const { SlashCommandBuilder } = require('discord.js');
const { Player } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your character profile'),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const player = await Player.findOne({ where: { discord_id: discordId } });
    if (!player) {
      return interaction.reply({ content: 'No character found. Use /start to create one!', ephemeral: true });
    }
    const stats = player.stats || {};
    await interaction.reply({
      embeds: [{
        title: `${interaction.user.username}'s Profile`,
        fields: [
          { name: 'Race', value: player.race, inline: true },
          { name: 'Origin', value: player.origin, inline: true },
          { name: 'Dream', value: player.dream, inline: true },
          { name: 'Stats', value: Object.entries(stats).map(([k,v]) => `${k}: ${v}`).join('\n') || 'None', inline: false },
          { name: 'Current Quest', value: player.currentQuestId || 'None', inline: false },
        ],
        color: 0x1e90ff,
      }],
      ephemeral: true,
    });
  },
};
