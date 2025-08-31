const RomanceDawn = require('./EastBlueSaga/RomanceDawn');
const BaseQuest = require('./BaseQuest');
const RewardHandler = require('./utils/RewardHandler');
// Import DB models to access sequelize for transactions when available
let db = null;
try { db = require('../database/models'); } catch (e) { /* ignore if DB not configured in test env */ }

class QuestManager {
    constructor() {
        this.quests = new Map();
    }

    registerQuest(questClass) {
        this.quests.set(questClass.id || questClass.name, questClass);
    }

    createQuest(questId, player) {
        const QuestClass = this.quests.get(questId);
        if (!QuestClass) throw new Error(`Quest ${questId} not found`);
    return new QuestClass(player);
    }

    getCurrentQuest(player) {
        // In a real implementation, this would check player's active quests
        if (!player.activeQuest) return null;
        const questClass = this.quests.get(player.activeQuest);
        if (!questClass) throw new Error(`Quest class for ${player.activeQuest} not registered`);

        // If we have a serialized instance and the class implements fromJSON, use it
        if (player.activeQuestInstance && typeof questClass.fromJSON === 'function') {
            return questClass.fromJSON(player.activeQuestInstance, player);
        }

        // Otherwise, create a fresh instance and hydrate minimal fields
        const quest = this.createQuest(player.activeQuest, player);
        if (player.activeQuestInstance) {
            const inst = player.activeQuestInstance;
            quest.state = inst.state;
            quest.currentStep = inst.currentStep;
            if (inst.custom) quest.custom = inst.custom;
        } else if (player.activeQuestData) {
            quest.state = player.activeQuestData.state;
            quest.currentStep = player.activeQuestData.currentStep;
        }
        return quest;
        return quest;
    }

    // Command handlers
    async handleQuestCommand(command, player, interaction) {
        switch(command) {
            case 'current':
                const currentQuest = this.getCurrentQuest(player);
                if (!currentQuest) {
                    return await interaction.reply('You are not currently on any quest.');
                }
                return await interaction.reply(`Current Quest: ${currentQuest.name}\nProgress: ${currentQuest.currentStep}/${currentQuest.steps.length}`);

            case 'accept':
                if (player.activeQuest) {
                    return await interaction.reply(`You're already on a quest: ${player.activeQuest}`);
                }

                // For new players, start with Romance Dawn
                const newQuest = this.createQuest('romance_dawn', player);
                player.activeQuest = 'romance_dawn';
                const startMessage = await newQuest.start();
                // persist minimal quest state on player so it can be restored later
                // persist minimal quest state and serialized instance
                const instancePayload = { state: newQuest.state, currentStep: newQuest.currentStep };
                player.activeQuestData = { state: newQuest.state, currentStep: newQuest.currentStep };
                player.activeQuestInstance = instancePayload;
                // persist to DB if player is a Sequelize model
                try { if (typeof player.save === 'function') await player.save(); } catch (e) { /* ignore save errors in non-DB tests */ }

                await interaction.reply({
                    content: `Quest started: ${newQuest.name}\n${startMessage.content}`,
                    components: startMessage.components
                });
                break;

            case 'complete':
                const quest = this.getCurrentQuest(player);
                if (!quest) {
                    return await interaction.reply('You are not currently on any quest.');
                }

                // Use DB transaction if available
                const runCompletion = async (t) => {
                    const completion = await quest.complete();
                    // Apply rewards via RewardHandler (handles different reward types)
                    try {
                        RewardHandler.giveRewards(player, completion.rewards);
                    } catch (e) {
                        if (completion.rewards.berries) player.berries = (player.berries || 0) + completion.rewards.berries;
                        if (completion.rewards.exp) player.exp = (player.exp || 0) + completion.rewards.exp;
                        if (completion.rewards.items) player.inventory = (player.inventory || []).concat(completion.rewards.items);
                    }

                    // Clear quest fields
                    player.activeQuest = null;
                    player.activeQuestData = null;
                    player.activeQuestInstance = null;

                    // Persist player changes if possible
                    if (typeof player.save === 'function') {
                        await player.save({ transaction: t });
                    }

                    return completion;
                };

                try {
                    if (db && db.sequelize && typeof db.sequelize.transaction === 'function') {
                        const completion = await db.sequelize.transaction(async (t) => runCompletion(t));
                        await interaction.reply(`Quest completed!\nRewards: ${completion.rewards.berries} berries, ${completion.rewards.exp} EXP, and: ${completion.rewards.items.join(', ')}`);
                    } else {
                        const completion = await runCompletion(null);
                        await interaction.reply(`Quest completed!\nRewards: ${completion.rewards.berries} berries, ${completion.rewards.exp} EXP, and: ${completion.rewards.items.join(', ')}`);
                    }
                } catch (error) {
                    await interaction.reply(`Cannot complete quest: ${error.message}`);
                }
                break;
        }
    }
}

// Initialize and register quests
const questManager = new QuestManager();
questManager.registerQuest(RomanceDawn);

module.exports = questManager;
