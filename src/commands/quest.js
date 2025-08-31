const { SlashCommandBuilder } = require('discord.js');
const questManager = require('../quests/QuestManager');
const { Player } = require('../database'); // Adjust the path according to your project structure

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Manage your quests')
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('Show your current Main Story Quest (MSQ)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a new Main Story Quest (MSQ)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('complete')
                .setDescription('Complete your current Main Story Quest (MSQ)')
        ),

    async execute(interaction) {
        const player = await Player.findOne({ where: { discordId: interaction.user.id } });
        if (!player) {
            return await interaction.reply('Player not found. Please create a character first.');
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            await questManager.handleQuestCommand(subcommand, player, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while processing your quest command.');
        }
    }
};
