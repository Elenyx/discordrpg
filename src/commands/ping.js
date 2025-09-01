// src/commands/ping.js
const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Sends a ping button (measures latency).'),

  async execute(interaction, client) {
    // Build a small Container V2 with a text display and a ping button
    const container = new ContainerBuilder()
      .addTextDisplayComponents(td => td.setContent('🏓 Click the button to measure latency'));

    const actions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ping_button_v2').setLabel('Ping!').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ components: [container, actions], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  },
};

// Button interaction handler for latency. This file's exported object is a command; the bot's interaction dispatcher
// should route button interactions to component handlers elsewhere (the codebase uses a centralized interaction router).

// If the project listens for button interactions in a generic place, add this helper to respond when a ping button is pressed.
module.exports.handleButton = async function handleButton(interaction, client) {
  if (!interaction.isButton()) return false;
  if (interaction.customId !== 'ping_button_v2') return false;

  // Measure round-trip time by noting timestamp now and editing a small ephemeral reply
  const wsPing = Math.round(client.ws.ping);

  // Respond with ephemeral message showing both websocket ping and approximate RTT
  try {
    const sent = Date.now();
    await interaction.reply({ content: `🏓 Pong! Measuring...`, ephemeral: true });
    const rtt = Date.now() - sent;
    await interaction.editReply({ content: `🏓 Pong!
Websocket latency: ${wsPing}ms
Round-trip: ${rtt}ms` });
  } catch (err) {
    try { await interaction.reply({ content: `🏓 Pong! Websocket latency: ${wsPing}ms`, ephemeral: true }); } catch (e) {}
  }

  return true;
};
