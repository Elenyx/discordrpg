const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Administrator commands for bot management')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-error-channel')
        .setDescription('Set the channel for error logging')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send error logs to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('get-error-channel')
        .setDescription('Get the current error log channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('test-error-log')
        .setDescription('Send a test error log message')
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    try {
      switch (sub) {
        case 'set-error-channel': {
          const channel = interaction.options.getChannel('channel');
          if (!channel.permissionsFor(interaction.client.user).has(['SendMessages', 'EmbedLinks'])) {
            return interaction.editReply('❌ I don\'t have permission to send messages or embed links in that channel.');
          }
          await logger.setErrorChannel(channel.id);
          const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Error Log Channel Set').setDescription(`Error logs will now be sent to ${channel}`).setTimestamp();
          await interaction.editReply({ embeds: [embed] });
          await logger.logSuccess('Admin Action', `Error log channel set to ${channel.name}`, { adminUser: interaction.user.tag, channelId: channel.id, channelName: channel.name });
          break;
        }
        case 'get-error-channel': {
          const channelId = logger.getErrorChannelId();
          if (!channelId) return interaction.editReply('❌ No error log channel is currently set. Use `/admin set-error-channel` to set one.');
          try {
            const channel = await interaction.client.channels.fetch(channelId);
            const embed = new EmbedBuilder().setColor(0x0099FF).setTitle('📋 Current Error Log Channel').setDescription(`Error logs are being sent to ${channel}`).addFields({ name: 'Channel ID', value: `\`${channelId}\``, inline: true }, { name: 'Channel Name', value: channel.name, inline: true }).setTimestamp();
            await interaction.editReply({ embeds: [embed] });
          } catch (err) {
            await interaction.editReply('❌ The set error log channel no longer exists or is inaccessible. Please set a new one.');
          }
          break;
        }
        case 'test-error-log': {
          const channelId = logger.getErrorChannelId();
          if (!channelId) return interaction.editReply('❌ No error log channel is set. Use `/admin set-error-channel` first.');
          await logger.logSuccess('Test Event', 'This is a test success log message', { testType: 'success', triggeredBy: interaction.user.tag });
          await logger.logWarning('Test Event', 'This is a test warning log message', { testType: 'warning', triggeredBy: interaction.user.tag });
          await logger.logError('Test Event', new Error('This is a test error message'), { testType: 'error', triggeredBy: interaction.user.tag });
          await interaction.editReply('✅ Test log messages sent! Check the error log channel.');
          break;
        }
      }
    } catch (error) {
      console.error('[ERROR] Admin command failed:', error);
      await logger.logError('Admin Command Error', error, { adminUser: interaction.user.tag, guildId: interaction.guildId });
      await interaction.editReply('❌ An error occurred while executing the admin command.');
    }
  }
};
