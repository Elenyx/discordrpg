// RomanceDawn.js
const BaseQuest = require('./BaseQuest');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const raceSteps = require('./RaceSpecificSteps');
const { morganFightMiniGame } = require('../utils/MiniGames');

class RomanceDawn extends BaseQuest {
    constructor(player) {
        super(player);
        this.id = 'romance_dawn';
        this.name = 'Romance Dawn';
        this.description = 'Begin your adventure in the East Blue and meet your first crewmates';
        this.steps = this.generateSteps();
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

    async handleInteraction(interaction) {
        const customId = interaction.customId;

        switch(customId) {
            case 'investigate_barrel':
                this.currentStep++;
                await interaction.update(await this.progress());
                break;

            case 'ignore_barrel':
                await interaction.update({
                    content: "You decided to ignore the barrel. Maybe you'll meet Luffy another time.",
                    components: []
                });
                this.state = 'available';
                break;

            case 'free_zoro':
                if (interaction.values[0] === 'free_yes') {
                    this.currentStep++;
                    await interaction.update(await this.progress());
                } else {
                    await interaction.update({
                        content: "You decided not to free Zoro. The story continues differently...",
                        components: []
                    });
                    this.currentStep += 2;
                    await this.progress();
                }
                break;

            case 'fight_morgan':
                const victory = morganFightMiniGame(this.player);
                if (victory) {
                    this.currentStep++;
                    await interaction.update({
                        content: "You defeated Captain Morgan! Zoro is now free and joins your crew!",
                        components: []
                    });
                } else {
                    await interaction.update({
                        content: "You were defeated by Morgan. Try again!",
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('fight_morgan')
                                    .setLabel('Try Again')
                                    .setStyle(ButtonStyle.Danger)
                            )
                        ]
                    });
                }
                break;

            default:
                this.currentStep++;
                await interaction.update(await this.progress());
        }
    }
}

module.exports = RomanceDawn;