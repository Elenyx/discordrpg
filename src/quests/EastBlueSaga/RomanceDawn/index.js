// RomanceDawn.js
const BaseQuest = require('../../BaseQuest');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const raceSteps = require('../RaceSpecificSteps');
const MiniGames = require('../../utils/MiniGames');
const CONSEQUENCES = require('../consequences.json');
const { generateToken, deleteToken } = require('../../../utils/tokenStore');
const { writeLog } = require('../../../utils/fileLogger');
const logger = require('../../../utils/logger');

class RomanceDawn extends BaseQuest {
    static id = 'romance_dawn';
    static serializedVersion = 1;
    constructor(player) {
        super({ id: 'romance_dawn', title: 'Romance Dawn', description: 'Begin your adventure in the East Blue and meet your first crewmates' });
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
                    { type: 'button', label: 'Investigate the barrel', customId: 'investigate_barrel' },
                    { type: 'button', label: 'Ignore it and keep sailing', customId: 'ignore_barrel' },
                    { type: 'button', label: 'Search the barrel for supplies', customId: 'search_barrel' },
                    { type: 'button', label: 'Check if someone needs help', customId: 'check_survivors' }
                ]
            },
            {
                title: 'Meeting Luffy',
                description: 'A boy with stretchy powers emerges from the barrel! He introduces himself as Monkey D. Luffy.',
                actions: [
                    { type: 'button', label: 'Offer him food', customId: 'offer_food' },
                    { type: 'button', label: 'Ask who he is', customId: 'ask_identity' }
                ]
            },
            {
                title: "Luffy's Dream",
                description: "Luffy says he's looking for a crew to become King of the Pirates!",
                actions: [
                    { type: 'button', label: 'Join his crew', customId: 'join_crew' },
                    { type: 'button', label: 'Politely decline', customId: 'decline_crew' }
                ]
            }
        ];

        const zoroSteps = [
            { title: 'The Cursed Swordsman', description: 'You arrive at Shells Town and hear about a pirate hunter tied up at the marine base.', actions: [ { type: 'button', label: 'Investigate the marine base', customId: 'investigate_marine' } ] },
            { title: 'Roronoa Zoro', description: "You find Zoro tied up in the yard. He's been there for weeks without food or water.", actions: [ { type: 'select', label: 'Do you free Zoro?', customId: 'free_zoro', options: [ { label: 'Yes, he seems honorable', value: 'free_yes' }, { label: 'No, he\'s a dangerous pirate', value: 'free_no' } ] } ] },
            { title: 'The Challenge', description: 'To free Zoro, you must beat Marine Captain Morgan in a duel!', actions: [ { type: 'button', label: 'Fight Captain Morgan', customId: 'fight_morgan' }, { type: 'button', label: 'Create a distraction', customId: 'distract_morgan' } ] }
        ];

        return [...baseSteps, ...(raceSteps[this.player.race] || []), ...zoroSteps];
    }

    async applyConsequences(customId) {
        const cons = CONSEQUENCES[customId] || null;
        if (!cons) return null;
        this.custom = this.custom || {};
        this.custom.history = this.custom.history || [];
        this.custom.history.push({ id: customId, stats: cons.stats || {}, time: Date.now() });
        if (this.player) {
            this.player.stats = this.player.stats || {};
            for (const [k, v] of Object.entries(cons.stats || {})) {
                this.player.stats[k] = (this.player.stats[k] || 0) + v;
            }
            if (typeof this.player.stats.power === 'undefined') this.player.stats.power = (this.player.level || 1) * 10;
            if (cons.loot && Array.isArray(cons.loot) && cons.loot.length) {
                this.player.stats.items = this.player.stats.items || [];
                for (const loot of cons.loot) {
                    if (Math.random() <= (loot.chance || 1)) {
                        const existing = this.player.stats.items.find(i => i.id === loot.id);
                        if (existing) existing.qty = (existing.qty || 1) + (loot.qty || 1);
                        else this.player.stats.items.push({ id: loot.id, name: loot.name, qty: loot.qty || 1 });
                    }
                }
            }
            try { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after applying consequences', e); }
        }
        return cons.message || null;
    }

    async start() { this.state = 'in-progress'; this.currentStep = 1; return this.progress(); }

    async complete() { if (this.state !== 'in-progress') { throw new Error('Quest is not in progress'); } this.state = 'completed'; return { rewards: this.calculateRewards() }; }

    calculateRewards() { return { berries: 100, exp: 50, items: ['Straw Hat'] }; }

    // Helper to build a Continue button pointing to a specific target step
    buildContinueButton(targetStep) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`romance_next::${targetStep}`).setLabel('Continue your journey').setStyle(ButtonStyle.Primary)
        );
    }

    async progress() {
        if (this.state !== 'in-progress') throw new Error('Quest is not in progress');
        const currentStep = this.steps[this.currentStep - 1];
        if (!currentStep) return await this.complete();
        const dynamicStep = Object.assign({}, currentStep);
        const playerCharisma = (this.player && this.player.stats && this.player.stats.charisma) || 0;
        if (currentStep.title === "Luffy's Dream" && playerCharisma >= 2) dynamicStep.actions = (dynamicStep.actions || []).concat([{ type: 'button', label: 'Flatter Luffy', customId: 'flatter_luffy' }]);
        const components = [];
        for (const action of dynamicStep.actions) {
            if (action.type === 'button') components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(action.customId).setLabel(action.label).setStyle(ButtonStyle.Primary)));
            else if (action.type === 'select') components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(action.customId).setPlaceholder(action.label).addOptions(action.options.map(opt => ({ label: opt.label, value: opt.value })) )));
        }
        return { content: `**${currentStep.title}**\n${currentStep.description}`, components };
    }

    async safeUpdate(interaction, payload) {
        // If the payload has no components but the quest still has a next step,
        // inject a Continue button so the quest doesn't dead-end.
        try {
            payload = payload || {};
            const componentsEmpty = !payload.components || (Array.isArray(payload.components) && payload.components.length === 0);
            const nextStepIdx = (this.currentStep || 1) - 1;
            const hasNextStep = Array.isArray(this.steps) && this.steps[nextStepIdx];
            if (componentsEmpty && this.state === 'in-progress' && hasNextStep) {
                // Use instance helper to create the continue button for the current step
                payload.components = [ this.buildContinueButton(this.currentStep || 1) ];
            }
            if (interaction && typeof interaction.update === 'function') { await interaction.update(payload); return; }
        }
        catch (err) {
            const errCode = err && err.code ? err.code : null;
            console.warn('safeUpdate: interaction.update failed, attempting fallback:', err && err.code ? `${err.code}` : err);
            try { await logger.logWarning('Interaction Update Failed', 'interaction.update failed, attempting fallback', { userId: interaction?.user?.id, customId: interaction?.customId, messageId: interaction?.message?.id, messageInteractionCommand: interaction?.message?.interaction?.commandName, errorCode: errCode, errorMessage: err instanceof Error ? err.message : String(err), payloadPreview: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload).substring(0, 1000)) : null }); } catch (logErr) { console.error('Logger failed while reporting interaction.update failure', logErr); }
            try { if (!interaction.replied && !interaction.deferred) { await interaction.reply(Object.assign({}, payload, { ephemeral: true })); } else if (interaction.deferred) { await interaction.editReply(payload); } else if (interaction.replied) { await interaction.followUp(Object.assign({}, payload, { ephemeral: true })); } }
            catch (e) { console.error('safeUpdate: fallback failed:', e); try { await logger.logError('Interaction Update Fallback Failed', e, { userId: interaction?.user?.id, customId: interaction?.customId, guildId: interaction?.guildId, channelId: interaction?.channelId, messageId: interaction?.message?.id, payloadPreview: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload).substring(0, 1000)) : null }); } catch (logErr) { console.error('Logger failed while reporting fallback failure', logErr); } }
        }
    }

    async handleInteraction(interaction) {
        const [rawCustomId, transientToken] = (interaction.customId || '').split('::');
        const customId = rawCustomId;
    // ...existing code...
        switch (customId) {
            case 'romance_next': {
                // transientToken contains the target step we should show next
                const target = parseInt(transientToken, 10) || (this.currentStep || 1);
                this.currentStep = target;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                await this.safeUpdate(interaction, await this.progress());
                break;
            }
            case 'resume_quest':
                if (this.state !== 'in-progress') { this.state = 'in-progress'; this.currentStep = this.currentStep || 1; if (this.player) { this.player.activeQuest = this.id; this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} } }
                await this.safeUpdate(interaction, await this.progress());
                break;
            case 'abandon_quest':
                this.state = 'abandoned'; if (this.player) { try { this.player.activeQuest = null; this.player.activeQuestData = null; this.player.activeQuestInstance = null; if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player on abandon', e); } } await this.safeUpdate(interaction, { content: 'You have abandoned the quest.', components: [] }); break;
            case 'investigate_barrel':
                this.currentStep++; this.custom = this.custom || {}; this.custom.investigated = true; if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} } await this.safeUpdate(interaction, await this.progress()); break;
            case 'search_barrel': {
                const msg = await this.applyConsequences('search_barrel');
                // advance now and show a Continue button so the player can proceed
                this.currentStep++;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                await this.safeUpdate(interaction, { content: msg, components: [ this.buildContinueButton(this.currentStep) ] });
            } break;
            case 'check_survivors': {
                const msg = await this.applyConsequences('check_survivors');
                this.currentStep++;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                await this.safeUpdate(interaction, { content: msg, components: [ this.buildContinueButton(this.currentStep) ] });
            } break;
            case 'ignore_barrel': this.state = 'available'; this.custom = this.custom || {}; this.custom.ignoredBarrel = true; if (this.player) { this.player.activeQuest = this.id; this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep || 1, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player when ignoring barrel', e); } } await this.safeUpdate(interaction, { content: 'You decided to ignore the barrel for now. You can reconsider it later.', components: [ new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('investigate_barrel').setLabel('Reconsider the barrel').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('end_quest_now').setLabel('Give up on this quest').setStyle(ButtonStyle.Secondary) ) ] }); break;
            case 'end_quest_now': this.state = 'abandoned'; if (this.player) { try { if (typeof this.player.save === 'function') { this.player.activeQuest = null; this.player.activeQuestData = null; this.player.activeQuestInstance = null; await this.player.save(); } } catch (e) { console.error('Failed to clear player when abandoning quest', e); } } await this.safeUpdate(interaction, { content: 'You have abandoned the Romance Dawn quest.', components: [] }); break;
            case 'offer_food': { const msg = await this.applyConsequences('offer_food'); await this.safeUpdate(interaction, { content: `${msg}\nHe asks to join your crew.`, components: [ new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('join_crew').setLabel('Invite Luffy').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('ask_identity').setLabel('Ask who he is').setStyle(ButtonStyle.Secondary) ) ] }); } break;
            case 'flatter_luffy': {
                const msg = await this.applyConsequences('flatter_luffy');
                const sparRes = MiniGames.sparMiniGame(this.player || {});
                // Present result and a continue button that moves to the next step
                const target = (this.currentStep || 1) + 1;
                if (sparRes.success) {
                    await this.safeUpdate(interaction, { content: `${msg}\nYou spar with Luffy and win! Power +${sparRes.amount}`, components: [ this.buildContinueButton(target) ] });
                } else {
                    await this.safeUpdate(interaction, { content: `${msg}\nYou spar with Luffy but it's a close match.`, components: [ this.buildContinueButton(target) ] });
                }
            } break;
            case 'ask_identity': await this.safeUpdate(interaction, { content: 'Luffy explains he ate the Gum-Gum fruit and dreams of becoming Pirate King. He seems earnest and energetic.', components: [ new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('join_crew').setLabel('Join his crew').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('decline_crew').setLabel('Politely decline').setStyle(ButtonStyle.Secondary) ) ] }); break;
            case 'join_crew': {
                const msg = await this.applyConsequences('join_crew');
                this.currentStep++;
                this.custom = this.custom || {};
                this.custom.joinedLuffy = true;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; }
                await this.safeUpdate(interaction, await this.progress());
                try { await interaction.followUp({ content: msg, ephemeral: true }); } catch (e) {}
            } break;
            case 'decline_crew': {
                const msg = await this.applyConsequences('decline_crew');
                // Advance and show a Continue button so the player can proceed
                this.currentStep += 1;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                await this.safeUpdate(interaction, { content: `You politely decline. Luffy is disappointed but still sets off on his adventure. Your story continues.\n${msg}`, components: [ this.buildContinueButton(this.currentStep) ] });
            } break;
            case 'free_zoro':
                if (interaction.values[0] === 'free_yes') {
                    this.currentStep++;
                    if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                    await this.safeUpdate(interaction, await this.progress());
                } else {
                    // Player chose not to free Zoro. Jump ahead and immediately show the new step
                    this.currentStep += 2;
                    if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                    await this.safeUpdate(interaction, await this.progress());
                }
                break;
            case 'fight_morgan': {
                console.info(`RomanceDawn: fight_morgan interaction for player=${this.player?.discordId || this.player?.id || 'unknown'}`);
                const tokenPayload = interaction.tokenPayload || null;
                const originalTransient = interaction.transientToken || null;
                if (tokenPayload && tokenPayload.retries >= 3) { writeLog('interactions.log', `Retry limit reached for user=${tokenPayload.discordId} tokenRetries=${tokenPayload.retries}`); await this.safeUpdate(interaction, { content: 'You have reached the retry limit for this encounter. Try again later.', components: [ this.buildContinueButton(this.currentStep || 1) ] }); try { deleteToken && deleteToken(originalTransient); } catch (e) {} break; }
                this.custom = this.custom || {};
                const trainingCount = this.custom.trainingCount || 0;
                const requiredTraining = 3;
                if (trainingCount < requiredTraining) { await this.safeUpdate(interaction, { content: `Captain Morgan is strong. You need to get stronger first (completed ${trainingCount}/${requiredTraining}). Choose a way to grow stronger:`, components: [ new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId('mini_train').setLabel('Train (Strength mini-game)').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('mini_spar').setLabel('Spar (Practice fight)').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('mini_fish').setLabel('Fish for supplies (buff)').setStyle(ButtonStyle.Success) ) ] }); break; }
                const morganPower = 70 + (this.player?.level || 1) * 5; const result = MiniGames.turnBasedFight(this.player, morganPower); const victory = result.victory; console.info(`RomanceDawn: fight_morgan result=${victory}`);
                if (victory) { this.currentStep++; if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} } const battleSummary = result.log.join('\n'); await this.safeUpdate(interaction, { content: `You defeated Captain Morgan! Zoro is now free and joins your crew!\n\nBattle log:\n${battleSummary}`, components: [ this.buildContinueButton(this.currentStep) ] }); }
                else { if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after Morgan defeat', e); try { await logger.logWarning('Player Save Failed', 'Failed to save player after Morgan defeat', { userId: this.player.discordId || this.player.id, error: e instanceof Error ? e.message : String(e) }); } catch (err) { console.error('Logger failed', err); } } }
                let newToken; if (tokenPayload) { const newPayload = Object.assign({}, tokenPayload, { retries: (tokenPayload.retries || 0) + 1 }); try { deleteToken && deleteToken(originalTransient); } catch (e) {} newToken = generateToken(newPayload); writeLog('interactions.log', `Rotated retry token for user=${newPayload.discordId} newRetries=${newPayload.retries} token=${newToken}`); } else { const createdTokenPayload = { discordId: this.player?.discordId || this.player?.id || null, questId: this.id, currentStep: this.currentStep, retries: 1 }; newToken = generateToken(createdTokenPayload); writeLog('interactions.log', `Generated retry token for fight_morgan user=${createdTokenPayload.discordId} token=${newToken}`); }
                const battleSummary = result.log ? result.log.join('\n') : 'You were defeated.';
                await this.safeUpdate(interaction, { content: `You were defeated by Morgan. Try again!\n\nBattle log:\n${battleSummary}`, components: [ new ActionRowBuilder().addComponents( new ButtonBuilder().setCustomId(`fight_morgan::${newToken}`).setLabel('Try Again').setStyle(ButtonStyle.Danger) ) ] }); }
                break; }
            case 'distract_morgan': {
                // The distraction gives you an opening — advance to the next step immediately
                const msg = await this.applyConsequences('distract_morgan');
                // Add a bit of narrative so the player sees the effect
                const narrative = `${msg}\nYou shout and toss a net, drawing the marines' attention away long enough to slip past.`;
                // Advance the quest step and persist
                this.currentStep = (this.currentStep || 1) + 1;
                if (this.player) {
                    this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom };
                    try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after distract_morgan', e); }
                }
                // Render the next step so the player has immediate interactive options
                const nextPayload = await this.progress();
                // If the quest returned only text, include our narrative as a section above it
                if (nextPayload && nextPayload.content) nextPayload.content = `${narrative}\n\n${nextPayload.content}`;
                await this.safeUpdate(interaction, nextPayload);
            } break;
            case 'use_map_fragment': { const items = (this.player && this.player.stats && this.player.stats.items) || []; const frag = items.find(i => i.id === 'map_fragment'); if (!frag) { await this.safeUpdate(interaction, { content: 'You do not have a map fragment to use.', components: [ this.buildContinueButton(this.currentStep || 1) ] }); break; } const puzzle = MiniGames.mapPuzzle(this.player || {}); if (puzzle.success) { frag.qty = (frag.qty || 1) - 1; if (frag.qty <= 0) this.player.stats.items = items.filter(i => i.id !== 'map_fragment'); this.player.stats.power = (this.player.stats.power || (this.player.level || 1) * 10) + 3; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} await this.safeUpdate(interaction, { content: 'You solved the map puzzle and gained a clue. Power +3', components: [ this.buildContinueButton(this.currentStep || 1) ] }); } else { await this.safeUpdate(interaction, { content: 'The map puzzle eludes you for now.', components: [ this.buildContinueButton(this.currentStep || 1) ] }); } } break;
            case 'mini_train':
            case 'mini_spar':
            case 'mini_fish': {
                let miniResult = { success: false, amount: 0 };
                try { if (customId === 'mini_train') miniResult = MiniGames.trainingMiniGame(this.player); else if (customId === 'mini_spar') miniResult = MiniGames.sparMiniGame(this.player); else if (customId === 'mini_fish') miniResult = MiniGames.fishingMiniGame(this.player); } catch (e) { console.error('Mini-game threw error', e); }
                this.custom = this.custom || {};
                this.custom.trainingCount = (this.custom.trainingCount || 0) + (miniResult.success ? 1 : 0);
                if (miniResult.success && this.player) { this.player.stats = this.player.stats || {}; this.player.stats.power = (this.player.stats.power || (this.player.level ? this.player.level * 10 : 10)) + (miniResult.amount || 5); try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) { console.error('Failed to save player after minigame', e); } }
                // Offer a continue button so the user can return to the previous choice/state
                await this.safeUpdate(interaction, { content: miniResult.success ? `Mini-game success! Power +${miniResult.amount}. Training progress: ${this.custom.trainingCount || 0}` : 'Mini-game failed. Try again later.', components: [ this.buildContinueButton(this.currentStep || 1) ] });
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
            } break;
            default:
                this.currentStep++;
                if (this.player) { this.player.activeQuestInstance = { state: this.state, currentStep: this.currentStep, custom: this.custom }; try { if (typeof this.player.save === 'function') await this.player.save(); } catch (e) {} }
                await this.safeUpdate(interaction, await this.progress());
        }
    }
}

module.exports = RomanceDawn;

