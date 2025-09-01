// RomanceDawn.js
const BaseQuest = require('../BaseQuest');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const raceSteps = require('./RaceSpecificSteps');
const MiniGames = require('../utils/MiniGames');
const { generateToken, consumeToken, deleteToken } = require('../../utils/tokenStore');
const { writeLog } = require('../../utils/fileLogger');
const logger = require('../../utils/logger');

class RomanceDawn extends BaseQuest {
    // static identifier used by the QuestManager registration
    static id = 'romance_dawn';
    // version the serialized format
    static serializedVersion = 1;
    constructor(player) {
    // BaseQuest expects an object for id/title/description; pass minimal info
    super({ id: 'romance_dawn', title: 'Romance Dawn', description: 'Begin your adventure in the East Blue and meet your first crewmates' });
    // store the player for quest logic
    this.player = player;

    this.id = 'romance_dawn';
    this.name = 'Romance Dawn';
    this.description = 'Begin your adventure in the East Blue and meet your first crewmates';
    this.steps = this.generateSteps();
    }

    toJSON() {
        return {
            id: this.id,
            state: this.state,
            currentStep: this.currentStep,
            version: RomanceDawn.serializedVersion,
            custom: this.custom || null,
        };
    }

    static fromJSON(data, player) {
        const inst = new RomanceDawn(player);
        inst.state = data.state || inst.state;
        inst.currentStep = data.currentStep || inst.currentStep || 0;
        inst.version = data.version || RomanceDawn.serializedVersion;
        inst.custom = data.custom || inst.custom || null;
        return inst;
    }

    generateSteps() {
        const baseSteps = [
            {
                title: 'The Barrel Boy',
                description: 'You spot a mysterious barrel floating in the ocean. What do you do?',
                actions: [
                    {
                        type: 'button',
                        label: 'Investigate the barrel',
                        customId: 'investigate_barrel'
                    },
                    {
                        type: 'button',
                        label: 'Ignore it and keep sailing',
                        customId: 'ignore_barrel'
                    }
                ]
            },
            {
                title: 'Meeting Luffy',
                description: 'A boy with stretchy powers emerges from the barrel! He introduces himself as Monkey D. Luffy.',
                actions: [
                    {
                        type: 'button',
                        label: 'Offer him food',
                        customId: 'offer_food'
                    },
                    {
                        type: 'button',
                        label: 'Ask who he is',
                        customId: 'ask_identity'
                    }
                ]
            },
            {
                title: 'Luffy\'s Dream',
                description: 'Luffy says he\'s looking for a crew to become King of the Pirates!',
                actions: [
                    {
                        type: 'button',
                        label: 'Join his crew',
                        customId: 'join_crew'
                    },
                    {
                        type: 'button',
                        label: 'Politely decline',
                        customId: 'decline_crew'
                    }
                ]
            }
        ];

        const zoroSteps = [
            {
                title: 'The Cursed Swordsman',
                description: 'You arrive at Shells Town and hear about a pirate hunter tied up at the marine base.',
                actions: [
                    {
                        type: 'button',
                        label: 'Investigate the marine base',
                        customId: 'investigate_marine'
                    }
                ]
            },
            {
                title: 'Roronoa Zoro',
                description: 'You find Zoro tied up in the yard. He\'s been there for weeks without food or water.',
                actions: [
                    {
                        type: 'select',
                        label: 'Do you free Zoro?',
                        customId: 'free_zoro',
                        options: [
                            { label: 'Yes, he seems honorable', value: 'free_yes' },
                            { label: 'No, he\'s a dangerous pirate', value: 'free_no' }
                        ]
                    }
                ]
            },
            {
                title: 'The Challenge',
                description: 'To free Zoro, you must beat Marine Captain Morgan in a duel!',
                actions: [
                    {
                        type: 'button',
                        label: 'Fight Captain Morgan',
                        customId: 'fight_morgan'
                    },
                    {
                        type: 'button',
                        label: 'Create a distraction',
                        customId: 'distract_morgan'
                    }
                ]
            }
        ];

        return [...baseSteps, ...(raceSteps[this.player.race] || []), ...zoroSteps];
    }

    async start() {
        this.state = 'in-progress';
        this.currentStep = 1;
        return this.progress();
    }

    async complete() {
        if (this.state !== 'in-progress') {
            throw new Error('Quest is not in progress');
        }

        this.state = 'completed';
        return {
            rewards: this.calculateRewards()
        };
    }

    // Compute rewards for completing the quest
    calculateRewards() {
        return {
            berries: 100,
            exp: 50,
            items: ['Straw Hat']
        };
    }

    async progress() {
        if (this.state !== 'in-progress') {
            throw new Error('Quest is not in progress');
        }

        const currentStep = this.steps[this.currentStep - 1];
        if (!currentStep) {
            return await this.complete();
        }

        const components = [];
        
        for (const action of currentStep.actions) {
            if (action.type === 'button') {
                components.push(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(action.customId)
                            .setLabel(action.label)
                            .setStyle(ButtonStyle.Primary)
                    )
                );
            } else if (action.type === 'select') {
                components.push(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(action.customId)
                            .setPlaceholder(action.label)
                            .addOptions(action.options.map(opt => ({
                                label: opt.label,
                                value: opt.value
                            })))
                    )
                );
            }
        }

        return {
            content: `**${currentStep.title}**\n${currentStep.description}`,
            components
        };
    }

    // Safe update wrapper: attempt interaction.update, fall back to reply/editReply
    async safeUpdate(interaction, payload) {
        try {
            if (interaction && typeof interaction.update === 'function') {
                await interaction.update(payload);
                return;
            }
        } catch (err) {
            // If the interaction.update fails (Discord API error), log detailed diagnostics
            const errCode = err && err.code ? err.code : null;
            console.warn('safeUpdate: interaction.update failed, attempting fallback:', err && err.code ? `${err.code}` : err);
            try {
                await logger.logWarning('Interaction Update Failed', 'interaction.update failed, attempting fallback', {
                    userId: interaction?.user?.id,
                    customId: interaction?.customId,
                    messageId: interaction?.message?.id,
                    messageInteractionCommand: interaction?.message?.interaction?.commandName,
                    errorCode: errCode,
                    errorMessage: err instanceof Error ? err.message : String(err),
                    payloadPreview: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload).substring(0, 1000)) : null
                });
            } catch (logErr) {
                console.error('Logger failed while reporting interaction.update failure', logErr);
            }
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply(Object.assign({}, payload, { ephemeral: true }));
                } else if (interaction.deferred) {
                    await interaction.editReply(payload);
                } else if (interaction.replied) {
                    // Can't edit a reply easily in every case; try to follow up
                    await interaction.followUp(Object.assign({}, payload, { ephemeral: true }));
                }
            } catch (e) {
                console.error('safeUpdate: fallback failed:', e);
                try {
                    await logger.logError('Interaction Update Fallback Failed', e, {
                        userId: interaction?.user?.id,
                        customId: interaction?.customId,
                        guildId: interaction?.guildId,
                        channelId: interaction?.channelId,
                        messageId: interaction?.message?.id,
                        payloadPreview: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload).substring(0, 1000)) : null
                    });
                } catch (logErr) {
                    console.error('Logger failed while reporting fallback failure', logErr);
                }
            }
        }
    }

    async handleInteraction(interaction) {
    // Support transient tokens in customIds like "fight_morgan::<token>"
    const [rawCustomId, transientToken] = (interaction.customId || '').split('::');
    const customId = rawCustomId;

    switch(customId) {
            case 'investigate_barrel':
        // Investigating reveals Luffy and moves the story forward
        this.currentStep++;
        // small reward / flavour
        this.custom = this.custom || {};
        this.custom.investigated = true;
                // persist any runtime custom data if present
                if (this.player) {
                    this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                    try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                }
                await this.safeUpdate(interaction, await this.progress());
                break;

            case 'ignore_barrel':
                await this.safeUpdate(interaction, {
                    content: "You decided to ignore the barrel. Maybe you'll meet Luffy another time.",
                    components: []
                });
                // Mark the quest as available again so player may accept later
                this.state = 'available';
                break;

            case 'offer_food':
                // Friendly approach — Luffy becomes more trusting
                await this.safeUpdate(interaction, {
                    content: 'You offer food to Luffy. He happily accepts and seems to like you. He asks to join your crew.',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('join_crew').setLabel('Invite Luffy').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('ask_identity').setLabel('Ask who he is').setStyle(ButtonStyle.Secondary)
                        )
                    ]
                });
                break;

            case 'ask_identity':
                await this.safeUpdate(interaction, {
                    content: 'Luffy explains he ate the Gum-Gum fruit and dreams of becoming Pirate King. He seems earnest and energetic.',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('join_crew').setLabel('Join his crew').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('decline_crew').setLabel('Politely decline').setStyle(ButtonStyle.Secondary)
                        )
                    ]
                });
                break;

            case 'join_crew':
                // Accepting moves to the next story step (Zoro branch may follow)
                this.currentStep++;
                this.custom = this.custom || {};
                this.custom.joinedLuffy = true;
                if (this.player) {
                    // Ensure player has base stats object and simple power stat
                    this.player.stats = this.player.stats || {};
                    this.player.stats.power = this.player.stats.power || (this.player.level ? this.player.level * 10 : 10);
                    try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                    this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                }
                await this.safeUpdate(interaction, await this.progress());
                break;

            case 'decline_crew':
                await this.safeUpdate(interaction, {
                    content: 'You politely decline. Luffy is disappointed but still sets off on his adventure. Your story continues.',
                    components: []
                });
                // advance a little to keep story moving
                this.currentStep += 1;
                if (this.player) {
                    this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                    try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                }
                break;

            case 'free_zoro':
                if (interaction.values[0] === 'free_yes') {
                    this.currentStep++;
                    if (this.player) {
                        this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                    }
                    await this.safeUpdate(interaction, await this.progress());
                } else {
                    await this.safeUpdate(interaction, {
                        content: "You decided not to free Zoro. The story continues differently...",
                        components: []
                    });
                    this.currentStep += 2;
                    if (this.player) {
                        this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                    }
                    await this.progress();
                }
                break;

            case 'fight_morgan':
                console.info(`RomanceDawn: fight_morgan interaction for player=${this.player?.discordId || this.player?.id || 'unknown'}`);
                // If there is a transient token payload attached to the interaction, respect it and enforce retry limits
                const tokenPayload = interaction.tokenPayload || null;
                const originalTransient = interaction.transientToken || null;
                if (tokenPayload && tokenPayload.retries >= 3) {
                    writeLog('interactions.log', `Retry limit reached for user=${tokenPayload.discordId} tokenRetries=${tokenPayload.retries}`);
                    await this.safeUpdate(interaction, { content: 'You have reached the retry limit for this encounter. Try again later.', components: [] });
                    // delete token if present
                    try { deleteToken && deleteToken(originalTransient); } catch (e) {}
                    break;
                }
                // Ensure player has enough training / power before allowing final fight
                this.custom = this.custom || {};
                const trainingCount = this.custom.trainingCount || 0;
                const requiredTraining = 3; // require a few mini-games before the final boss

                // If player hasn't done required mini-games, present options to train
                if (trainingCount < requiredTraining) {
                    await this.safeUpdate(interaction, {
                        content: `Captain Morgan is strong. You need to get stronger first (completed ${trainingCount}/${requiredTraining}). Choose a way to grow stronger:`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('mini_train').setLabel('Train (Strength mini-game)').setStyle(ButtonStyle.Primary),
                                new ButtonBuilder().setCustomId('mini_spar').setLabel('Spar (Practice fight)').setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder().setCustomId('mini_fish').setLabel('Fish for supplies (buff)').setStyle(ButtonStyle.Success)
                            )
                        ]
                    });
                    break;
                }

                // If transient token present in custom id, parse it (e.g., Try Again flow sends fight_morgan::<token>)
                // Use a robust fight routine that uses MiniGames.turnBasedFight
                const morganPower = 70 + (this.player?.level || 1) * 5;
                const result = MiniGames.turnBasedFight(this.player, morganPower);
                const victory = result.victory;
                console.info(`RomanceDawn: fight_morgan result=${victory}`);
                if (victory) {
                    this.currentStep++;
                    if (this.player) {
                        this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                    }
                    // Show battle log and Morgan thumbnail
                    const battleSummary = result.log.join('\n');
                    await this.safeUpdate(interaction, {
                        content: `You defeated Captain Morgan! Zoro is now free and joins your crew!\n\nBattle log:\n${battleSummary}`,
                        components: []
                    });
                } else {
                    // Persist current state so the "Try Again" flow has a baseline
                    if (this.player) {
                        this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after Morgan defeat', e); try { await logger.logWarning('Player Save Failed', 'Failed to save player after Morgan defeat', { userId: this.player.discordId || this.player.id, error: e instanceof Error ? e.message : String(e) }); } catch (err) { console.error('Logger failed', err); } }
                    }

                    // Create or rotate a transient token which stores retry count and minimal instance reference
                    let newToken;
                    if (tokenPayload) {
                        // Increment existing token's retry count
                        const newPayload = Object.assign({}, tokenPayload, { retries: (tokenPayload.retries || 0) + 1 });
                        // delete old token from store
                        try { deleteToken && deleteToken(originalTransient); } catch (e) {}
                        newToken = generateToken(newPayload);
                        writeLog('interactions.log', `Rotated retry token for user=${newPayload.discordId} newRetries=${newPayload.retries} token=${newToken}`);
                    } else {
                        const createdTokenPayload = { discordId: this.player?.discordId || this.player?.id || null, questId: this.id, currentStep: this.currentStep, retries: 1 };
                        newToken = generateToken(createdTokenPayload);
                        writeLog('interactions.log', `Generated retry token for fight_morgan user=${createdTokenPayload.discordId} token=${newToken}`);
                    }

                    // Include battle log and thumbnail for Morgan
                    const battleSummary = result.log ? result.log.join('\n') : 'You were defeated.';
                    await this.safeUpdate(interaction, {
                        content: `You were defeated by Morgan. Try again!\n\nBattle log:\n${battleSummary}`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`fight_morgan::${newToken}`)
                                    .setLabel('Try Again')
                                    .setStyle(ButtonStyle.Danger)
                            )
                        ]
                    });
                }
                break;

            // Mini-game handlers: training, sparring, fishing
            case 'mini_train':
            case 'mini_spar':
            case 'mini_fish':
                // Map customId to actual mini-game
                {
                    let miniResult = { success: false, amount: 0 };
                    try {
                        if (customId === 'mini_train') miniResult = MiniGames.trainingMiniGame(this.player);
                        else if (customId === 'mini_spar') miniResult = MiniGames.sparMiniGame(this.player);
                        else if (customId === 'mini_fish') miniResult = MiniGames.fishingMiniGame(this.player);
                    } catch (e) {
                        console.error('Mini-game threw error', e);
                    }

                    // Apply result to player and quest progress
                    this.custom = this.custom || {};
                    this.custom.trainingCount = (this.custom.trainingCount || 0) + (miniResult.success ? 1 : 0);
                    // reward: increase player's stats.power
                    if (miniResult.success && this.player) {
                        this.player.stats = this.player.stats || {};
                        this.player.stats.power = (this.player.stats.power || (this.player.level ? this.player.level * 10 : 10)) + (miniResult.amount || 5);
                        // persist player
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after minigame', e); }
                    }

                    await this.safeUpdate(interaction, {
                        content: miniResult.success ? `Mini-game success! Power +${miniResult.amount}. Training progress: ${this.custom.trainingCount || 0}` : 'Mini-game failed. Try again later.',
                        components: []
                    });
                    // persist quest instance
                    if (this.player) {
                        this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                        try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                    }
                }
                break;

            default:
                this.currentStep++;
                if (this.player) {
                    this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                    try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {}
                }
                await this.safeUpdate(interaction, await this.progress());
        }
    }
}

module.exports = RomanceDawn;