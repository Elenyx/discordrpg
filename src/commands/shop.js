const { SlashCommandBuilder } = require('discord.js');
const { Player } = require('../database/models');
const appConfig = require('../../config/config');

// Simple shop catalog; in a real app this would be centrally defined
const CATALOG = [
    { id: 'small_berry', name: 'Small Berry', price: 10, power: 2 },
    { id: 'iron_sword', name: 'Iron Sword', price: 100, power: 10 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse the shop')
        .addSubcommand(sub => sub.setName('list').setDescription('List shop items'))
        .addSubcommand(sub => sub.setName('buy').setDescription('Buy an item').addStringOption(opt => opt.setName('item').setDescription('Item id').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const player = await Player.findOne({ where: { discordId: interaction.user.id } });
        if (!player) return await interaction.reply('Player not found. Create a character first.');

        if (sub === 'list') {
            const lines = CATALOG.map(i => `${i.id} - ${i.name} : ${i.price} berries (power +${i.power})`);
            return await interaction.reply(`Shop Items:\n${lines.join('\n')}`);
        }

        if (sub === 'buy') {
            const itemId = interaction.options.getString('item');
            const item = CATALOG.find(i => i.id === itemId);
            if (!item) return await interaction.reply('Item not found. Use /shop list to see items.');

            // Use player.stats.berries as currency for simplicity
            player.stats = player.stats || {};
            player.stats.berries = player.stats.berries || 0;
            if (player.stats.berries < item.price) return await interaction.reply('You cannot afford that item.');

            player.stats.berries -= item.price;
            player.stats.items = player.stats.items || [];
            const existing = player.stats.items.find(it => it.id === item.id);
            if (existing) existing.qty = (existing.qty || 1) + 1;
            else player.stats.items.push({ id: item.id, name: item.name, qty: 1 });

            // apply immediate effect for consumable small_berry
            if (item.id === 'small_berry') {
                player.stats.power = (player.stats.power || (player.level || 1) * 10) + item.power;
            }

            try { if (typeof player.save === 'function') await player.save(); } catch (e) { console.error('Failed to save player after purchase', e); }

            return await interaction.reply(`You purchased ${item.name}.`);
        }
    }
};
