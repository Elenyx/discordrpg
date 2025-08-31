const { SlashCommandBuilder } = require('discord.js');
const { Player } = require('../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quest-debug')
    .setDescription('Dump a player\'s quest instance for debugging (ephemeral)')
    .addUserOption(option => option.setName('user').setDescription('Target user').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    try {
      const player = await Player.findOne({ where: { discordId: target.id } });
      if (!player) return await interaction.reply({ content: 'Player not found.', ephemeral: true });

      const payload = {
        activeQuest: player.activeQuest || null,
        activeQuestData: player.activeQuestData || null,
        activeQuestInstance: player.activeQuestInstance || null
      };

      let text = JSON.stringify(payload, null, 2);
      if (text.length > 1900) text = text.slice(0, 1900) + '\n...output truncated';

      await interaction.reply({ content: `\`\`\`json\n${text}\n\`\`\``, ephemeral: true });
    } catch (err) {
      console.error('Error in quest-debug command:', err);
      await interaction.reply({ content: 'Error fetching debug data.', ephemeral: true });
    }
  }
};
