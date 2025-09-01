const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SeparatorSpacingSize } = require('discord.js');
const { Player } = require('../../database');

const raceEmojis = { Human: '👤', Fishman: '🐟', Mink: '⚡', Giant: '🗿', Skypiean: '☁️' };
const originEmojis = { 'East Blue': '🌊', 'West Blue': '⚔️', 'North Blue': '🏴‍☠️', 'South Blue': '🌍', 'Grand Line': '🌀' };
const dreamEmojis = { 'Pirate King': '👑', 'All Blue': '🌊', 'World Map': '🗺️', 'Cure All': '💊', 'Strongest': '💪' };

function calculateLevel(stats) { const total = (stats.hp || 10) + (stats.atk || 5) + (stats.def || 5); return Math.floor(total / 10); }
function formatStats(stats) { return [ `❤️ **HP:** ${stats.hp || 10}`, `⚔️ **ATK:** ${stats.atk || 5}`, `🛡️ **DEF:** ${stats.def || 5}`, `⚡ **SPD:** ${stats.spd || 5}`, `🎯 **ACC:** ${stats.acc || 5}`, `🍀 **LCK:** ${stats.lck || 5}` ].join('\n'); }
function generateProgressBar(current, max, len = 10) { const filled = Math.round((current / max) * len); return '█'.repeat(filled) + '░'.repeat(len - filled); }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Manage or view your character profile')
    .addSubcommand(s => s.setName('view').setDescription('View your profile').addUserOption(o => o.setName('user').setDescription('View another pirate\'s profile').setRequired(false)))
    .addSubcommand(s => s.setName('reset').setDescription('Reset your character (permanently delete)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const target = interaction.options.getUser('user') || interaction.user;
      const discordId = target.id;
      try {
        const player = await Player.findOne({ where: { discordId } });
        if (!player) {
          const embed = new EmbedBuilder().setTitle('❌ No Character Found').setDescription(target.id === interaction.user.id ? 'You haven\'t created a character yet!\nUse `/start` to begin.' : `${target.username} hasn't created a character yet.`).setColor(0xe74c3c);
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        }

        const stats = player.stats || { hp: 10, atk: 5, def: 5, spd: 5, acc: 5, lck: 5 };
        const level = calculateLevel(stats);
        const nextExp = level * 100;
        const curExp = player.exp || 0;

        const embed = new EmbedBuilder()
          .setTitle(`${target.username}'s Pirate Profile`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
          .setColor(0x3498db)
          .addFields(
            { name: '👤 Character Info', value: [ `${raceEmojis[player.race] || '❓'} **Race:** ${player.race}`, `${originEmojis[player.origin] || '🌍'} **Origin:** ${player.origin}`, `${dreamEmojis[player.dream] || '⭐'} **Dream:** ${player.dream}` ].join('\n'), inline: false },
            { name: '📊 Stats', value: formatStats(stats), inline: true },
            { name: '🎯 Progress', value: [ `**Level:** ${level}`, `**EXP:** ${curExp}/${nextExp}`, `${generateProgressBar(curExp % nextExp, nextExp)}`, `**Berries:** 🪙 ${player.berries || 0}` ].join('\n'), inline: true },
            { name: '📜 Current Quest', value: player.currentQuestId ? `🗺️ ${player.currentQuestId}` : '❌ No active quest\nUse `/quest` to start!', inline: false }
          )
          .setTimestamp();

        if (player.achievements && player.achievements.length) embed.addFields({ name: '🏆 Achievements', value: player.achievements.map(a => `• ${a}`).join('\n').substring(0, 1024), inline: false });
        if (player.crew) embed.addFields({ name: '🏴‍☠️ Crew', value: player.crew, inline: true });
        if (player.bounty) embed.addFields({ name: '💰 Bounty', value: `${player.bounty.toLocaleString()} Berries`, inline: true });

        await interaction.reply({ embeds: [embed], flags: target.id === interaction.user.id ? MessageFlags.Ephemeral : 0 });
        return;
      } catch (err) {
        console.error('profile view error', err);
        const e = new EmbedBuilder().setTitle('⚠️ Error').setDescription('Failed to load profile.').setColor(0xe74c3c);
        await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
        return;
      }
    }

    if (sub === 'reset') {
      const discordId = interaction.user.id;
      try {
        const player = await Player.findOne({ where: { discordId } });
        if (!player) {
          const noChar = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('❌ **No character found**\nYou don\'t have a character to reset. Use `/start` to create one.'));
          await interaction.reply({ components: [noChar], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        const warning = new ContainerBuilder()
          .setAccentColor(0xe74c3c)
          .addTextDisplayComponents(td => td.setContent('⚠️ **Reset Character — Irreversible**'), td => td.setContent('This will permanently delete your character, progress, inventory, and quests.'))
          .addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
          .addTextDisplayComponents(td => td.setContent(`Character: **${interaction.user.username}**\nCreated: ${player.createdAt ? player.createdAt.toLocaleDateString() : 'Unknown'}`));

        const actions = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('confirm_reset').setLabel('Delete (Continue)').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ components: [warning, actions], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

        const step1 = await interaction.channel.awaitMessageComponent({ filter: i => i.user.id === discordId && i.customId && (i.customId === 'confirm_reset' || i.customId === 'cancel_reset'), time: 60000 });
        if (step1.customId === 'cancel_reset') {
          const ok = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('✅ **Reset canceled.** Your character is safe.'));
          await step1.update({ components: [ok], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        const final = new ContainerBuilder().setAccentColor(0xe74c3c).addTextDisplayComponents(td => td.setContent('🛑 **Final Confirmation**'), td => td.setContent('Press **Delete Permanently** to erase your character forever.'));
        const finalActions = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('final_reset').setLabel('Delete Permanently').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary));
        await step1.update({ components: [final, finalActions], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

        const step2 = await interaction.channel.awaitMessageComponent({ filter: i => i.user.id === discordId && i.customId && (i.customId === 'final_reset' || i.customId === 'cancel_reset'), time: 60000 });
        if (step2.customId === 'cancel_reset') {
          const ok = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('✅ **Reset canceled.** Your character is safe.'));
          await step2.update({ components: [ok], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        try {
          if (player && typeof player.destroy === 'function') await player.destroy(); else await Player.destroy({ where: { discordId } });
        } catch (e) { console.error('Failed to delete player', e); }

        const done = new ContainerBuilder().setAccentColor(0x2ecc71).addTextDisplayComponents(td => td.setContent('🗑️ **Character Deleted**\nYour character has been removed. Use `/start` to create a new pirate and begin again!'));
        await step2.update({ components: [done], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        return;
      } catch (err) {
        console.error('profile reset error', err);
        const errC = new ContainerBuilder().setAccentColor(0xe74c3c).addTextDisplayComponents(td => td.setContent('⚠️ **An error occurred while resetting your character.** Please try again later.'));
        try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ components: [errC], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); else await interaction.editReply({ components: [errC], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); } catch (e) {}
        return;
      }
    }

    await interaction.reply({ content: 'Unknown profile subcommand.', ephemeral: true });
  }
};