const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-button')
    .setDescription('Send a test button message to verify component interactions'),

  async execute(interaction) {
    try {
      const btn = new ButtonBuilder()
        .setCustomId('test_button_click')
        .setLabel('Test Button')
        .setStyle(ButtonStyle.Primary);

      const actionRow = new ActionRowBuilder().addComponents(btn);

      // Send as a normal channel message so global routing receives interactions
      const sent = await interaction.channel.send({ content: 'Test button — click me', components: [actionRow] });

      // Acknowledge the command privately
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `Sent test message ${sent.id}`, ephemeral: true });
      }
    } catch (e) {
      console.error('Failed to send test button', e);
      try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Failed to send test button', ephemeral: true }); } catch (err) {}
    }
  }
};
