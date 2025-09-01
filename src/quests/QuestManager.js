const RomanceDawn = require('./EastBlueSaga/RomanceDawn');
const BaseQuest = require('./BaseQuest');
const RewardHandler = require('./utils/RewardHandler');
const appConfig = require('../../config/config');
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, AttachmentBuilder, MessageFlags } = require('discord.js');
const { writeLog } = require('../utils/fileLogger');
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
                    const noQuestContainer = new ContainerBuilder().addTextDisplayComponents(td => td.setContent('You are not currently on any quest.'));
                    return await interaction.reply({ components: [noQuestContainer], flags: MessageFlags.IsComponentsV2 });
                }

                const progressContainer = new ContainerBuilder()
                    .setAccentColor(0x90EE90)
                    .addTextDisplayComponents(
                        td => td.setContent(`**${currentQuest.name}**`),
                        td => td.setContent(`Progress: ${currentQuest.currentStep}/${currentQuest.steps.length}`)
                    );
                return await interaction.reply({ components: [progressContainer], flags: MessageFlags.IsComponentsV2 });

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

                // Convert start message into a Container; reuse any components the quest returned for interactivity
                const startContainer = new ContainerBuilder()
                    .setAccentColor(0x8EC5FF)
                    .addTextDisplayComponents(
                        td => td.setContent(`📝 **Quest Started: ${newQuest.name}**`),
                        td => td.setContent(startMessage.content)
                    );

                // If the quest provided action components (ActionRowBuilder instances), send a
                // classic message with `content` and `components` (action rows). Classic component
                // messages are universally supported and produce standard button/select interactions
                // that the global handler can route.
                try {
                    if (startMessage.components && Array.isArray(startMessage.components) && startMessage.components.length && interaction.channel && typeof interaction.channel.send === 'function') {
                        const sentMsg = await interaction.channel.send({ content: startMessage.content, components: startMessage.components });
                        console.info('Sent quest start classic message', { user: interaction.user?.id, messageId: sentMsg?.id, messageInteractionCommand: sentMsg?.interaction?.commandName });
                        try { writeLog('interactions.log', `SENT_QUEST_CLASSIC user=${interaction.user?.id} message=${sentMsg?.id} interactionCommand=${sentMsg?.interaction?.commandName || ''}`); } catch (e) { /* ignore logging errors */ }
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({ content: 'Quest started.', ephemeral: true });
                        }
                    } else {
                        // If no classic components were provided, fallback to sending the Container V2 message
                        // so text-only start messages still use the polished display components.
                        if (interaction.channel && typeof interaction.channel.send === 'function') {
                            const sentMsg = await interaction.channel.send({ components: [startContainer], flags: MessageFlags.IsComponentsV2 });
                            try { writeLog('interactions.log', `SENT_QUEST_MESSAGE user=${interaction.user?.id} message=${sentMsg?.id}`); } catch (e) { /* ignore */ }
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: 'Quest started.', ephemeral: true });
                            }
                        } else {
                            await interaction.reply({ components: [startContainer], flags: MessageFlags.IsComponentsV2 });
                        }
                    }
                } catch (e) {
                    console.error('Failed to send quest start message', e);
                    try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Failed to start quest.', ephemeral: true }); } catch (err) { console.error(err); }
                }
                break;

            case 'complete':
                const quest = this.getCurrentQuest(player);
                if (!quest) {
                    return await interaction.reply('You are not currently on any quest.');
                }

                // Use DB transaction if available
                const runCompletion = async (t) => {
                    const completion = await quest.complete();

                    // Apply rewards via RewardHandler which returns a result object including levelUp
                    const rewardResult = RewardHandler.giveRewards(player, completion.rewards);

                    // Clear quest fields
                    player.activeQuest = null;
                    player.activeQuestData = null;
                    player.activeQuestInstance = null;

                    // Persist player changes if possible
                    if (typeof player.save === 'function') {
                        await player.save({ transaction: t });
                    }

                    return { completion, rewardResult };
                };

                try {
                    let result;
                    if (db && db.sequelize && typeof db.sequelize.transaction === 'function') {
                        result = await db.sequelize.transaction(async (t) => runCompletion(t));
                    } else {
                        result = await runCompletion(null);
                    }

                    // Build a Components V2 Container to show completion, rewards and level-up
                    const { completion, rewardResult } = result;

                    const container = new ContainerBuilder()
                        .setAccentColor(0xFFD166)
                        .addTextDisplayComponents(
                            td => td.setContent(`🏁 **Quest Completed: ${quest.name}**`),
                            td => td.setContent(`You completed the quest and received the following rewards:`)
                        )
                        .addSectionComponents(section => section
                            .addTextDisplayComponents(
                                td => td.setContent(`**Berries:** ${rewardResult.berries}`),
                                td => td.setContent(`**EXP:** ${rewardResult.exp}`),
                                td => td.setContent(`**Items:** ${rewardResult.items.length ? rewardResult.items.map(i => {
                                    const icon = appConfig.itemIcons && appConfig.itemIcons[i] ? ` ${appConfig.itemIcons[i]}` : '';
                                    return `${i}${icon}`;
                                }).join(', ') : 'None'}`)
                            )
                        );

                    // Add a small thumbnail accessory via a Section (supported on SectionBuilder)
                    container.addSectionComponents(section => section.setThumbnailAccessory(thumbnail =>
                        thumbnail.setURL('https://i.imgur.com/7bKXQ1N.png').setDescription('Quest Complete')
                    ));

                    if (rewardResult.allies && rewardResult.allies.length) {
                        container.addSectionComponents(section => section
                            .addTextDisplayComponents(td => td.setContent(`**Allies Gained:** ${rewardResult.allies.join(', ')}`))
                        );
                    }

                    if (rewardResult.levelUp) {
                        container.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(1));
                        container.addSectionComponents(section => section
                            .addTextDisplayComponents(
                                td => td.setContent(`🎉 **Level Up!** You advanced from level ${rewardResult.levelUp.oldLevel} to ${rewardResult.levelUp.newLevel} (+${rewardResult.levelUp.levelsGained})`),
                                td => td.setContent(`✨ New stats or rewards unlocked.`)
                            )
                        );
                    }

                    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
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
