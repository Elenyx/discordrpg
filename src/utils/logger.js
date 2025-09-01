const { EmbedBuilder } = require('discord.js');
const { Setting } = require('../../database');

class Logger {
  constructor() {
    this.client = null;
    this.errorChannelId = null;
  }

  init(client) {
    this.client = client;
    this.loadErrorChannelId();
  }

  async loadErrorChannelId() {
    try {
      const setting = await Setting.findOne({ where: { key: 'error_log_channel' } });
      this.errorChannelId = setting ? setting.value : null;
    } catch (err) {
      console.error('[LOGGER] Failed to load error channel id', err);
    }
  }

  async setErrorChannel(channelId) {
    try {
      const [row, created] = await Setting.findOrCreate({ where: { key: 'error_log_channel' }, defaults: { value: channelId } });
      if (!created) {
        row.value = channelId;
        await row.save();
      }
      this.errorChannelId = channelId;
    } catch (err) {
      console.error('[LOGGER] Failed to set error channel', err);
      throw err;
    }
  }

  getErrorChannelId() { return this.errorChannelId; }

  async sendToErrorChannel(embed) {
    if (!this.client || !this.errorChannelId) return;
    try {
      const channel = await this.client.channels.fetch(this.errorChannelId);
      if (channel && channel.isTextBased && channel.isTextBased()) {
        await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[LOGGER] Failed to send to error channel', err);
    }
  }

  async logSuccess(event, description, metadata = {}) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Success Event')
      .addFields(
        { name: 'Event', value: `\`${event}\``, inline: true },
        { name: 'Description', value: description || 'No description', inline: false },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    if (Object.keys(metadata).length > 0) {
      const metadataString = '```json\n' + JSON.stringify(metadata, null, 2) + '\n```';
      embed.addFields({ name: 'Metadata', value: metadataString.length > 1024 ? 'Metadata too large to display' : metadataString, inline: false });
    }

    await this.sendToErrorChannel(embed);
    console.log(`[SUCCESS] ${event}: ${description}`);
  }

  async logWarning(event, message, metadata = {}) {
    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('⚠️ Warning Event')
      .addFields(
        { name: 'Event', value: `\`${event}\``, inline: true },
        { name: 'Message', value: message || 'No message', inline: false },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    if (Object.keys(metadata).length > 0) {
      const metadataString = '```json\n' + JSON.stringify(metadata, null, 2) + '\n```';
      embed.addFields({ name: 'Metadata', value: metadataString.length > 1024 ? 'Metadata too large to display' : metadataString, inline: false });
    }

    await this.sendToErrorChannel(embed);
    console.warn(`[WARNING] ${event}: ${message}`);
  }

  async logError(event, error, metadata = {}) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Error Event')
      .addFields(
        { name: 'Event', value: `\`${event}\``, inline: true },
        { name: 'Error Message', value: `\`\`\`\n${errorMessage}\n\`\`\``, inline: false },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    const stackTrace = errorStack.length > 1000 ? errorStack.substring(0, 1000) + '...' : errorStack;
    embed.addFields({ name: 'Stack Trace', value: `\`\`\`\n${stackTrace}\n\`\`\``, inline: false });

    if (Object.keys(metadata).length > 0) {
      const metadataString = '```json\n' + JSON.stringify(metadata, null, 2) + '\n```';
      embed.addFields({ name: 'Metadata', value: metadataString.length > 1024 ? 'Metadata too large to display' : metadataString, inline: false });
    }

    await this.sendToErrorChannel(embed);
    console.error(`[ERROR] ${event}: ${errorMessage}`);
    if (error instanceof Error) console.error(errorStack);
  }
}

module.exports = new Logger();
