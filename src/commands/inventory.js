const { SlashCommandBuilder } = require('discord.js');
const { Player } = require('../database/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View your inventory'),

    async execute(interaction) {
        const player = await Player.findOne({ where: { discordId: interaction.user.id } });
        if (!player) return await interaction.reply('Player not found. Create a character first.');

        const items = (player.stats && player.stats.items) || [];
        if (!items.length) return await interaction.reply('Your inventory is empty.');

        const list = items.map(i => `- ${i.name} x${i.qty || 1}`).join('\n');
        await interaction.reply(`Your inventory:\n${list}`);
    }
};
