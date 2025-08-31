const RomanceDawn = require('./EastBlueSaga/RomanceDawn');
const BaseQuest = require('./BaseQuest');

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
        return player.activeQuest ? this.createQuest(player.activeQuest, player) : null;
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

                try {
                    const completion = await quest.complete();
                    player.activeQuest = null;
                    // Apply rewards to player
                    player.berries += completion.rewards.berries;
                    player.exp += completion.rewards.exp;
                    completion.rewards.items.forEach(item => player.inventory.push(item));

                    await interaction.reply(`Quest completed!\nRewards: ${completion.rewards.berries} berries, ${completion.rewards.exp} EXP, and: ${completion.rewards.items.join(', ')}`);
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
