const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder } = require('discord.js');
const { Player } = require('../../database');

// Race emojis for visual flair
const raceEmojis = {
  'Human': '👤',
  'Fishman': '🐟',
  'Mink': '⚡',
  'Giant': '🗿',
  'Skypiean': '☁️'
};

// Origin emojis
const originEmojis = {
  'East Blue': '🌊',
  'West Blue': '⚔️',
  'North Blue': '🏴‍☠️',
  'South Blue': '🌍',
  'Grand Line': '🌀'
};

// Dream emojis
const dreamEmojis = {
  'Pirate King': '👑',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const discordId = targetUser.id;
      try {
        const player = await Player.findOne({ where: { discordId: discordId } });
        if (!player) {
          const noCharacterEmbed = new EmbedBuilder()
            .setTitle('❌ No Character Found')
            .setDescription(targetUser.id === interaction.user.id 
              ? 'You haven\'t created a character yet!\nUse `/start` to begin your adventure!' 
              : `${targetUser.username} hasn't created a character yet!`)
            .setColor(0xe74c3c);
          return interaction.reply({ embeds: [noCharacterEmbed], flags: MessageFlags.Ephemeral });
        }

        // Calculate derived stats
        const stats = player.stats || { hp: 10, atk: 5, def: 5, spd: 5, acc: 5, lck: 5 };
        const level = calculateLevel(stats);
        const nextLevelExp = level * 100;
        const currentExp = player.exp || 0;
        const expProgress = generateProgressBar(currentExp % nextLevelExp, nextLevelExp);

        // Get emojis for visual enhancement
        const raceEmoji = raceEmojis[player.race] || '❓';
        const originEmoji = originEmojis[player.origin] || '🌍';
        const dreamEmoji = dreamEmojis[player.dream] || '⭐';

        // Build the profile embed
        const profileEmbed = new EmbedBuilder()
          .setTitle(`${targetUser.username}'s Pirate Profile`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
          .setColor(0x3498db)
          .addFields(
            { name: '👤 Character Info', value: [
              `${raceEmoji} **Race:** ${player.race}`,
              `${originEmoji} **Origin:** ${player.origin}`,
              `${dreamEmoji} **Dream:** ${player.dream}`
            ].join('\n'), inline: false },
            { name: '📊 Stats', value: formatStats(stats), inline: true },
            { name: '🎯 Progress', value: [
              `**Level:** ${level}`,
              `**EXP:** ${currentExp}/${nextLevelExp}`,
              `\`${expProgress}\``,
              `**Berries:** 🪙 ${player.berries || 0}`
            ].join('\n'), inline: true },
            { name: '📜 Current Quest', value: player.currentQuestId ? `🗺️ ${player.currentQuestId}` : '❌ No active quest\nUse `/quest` to start!', inline: false }
          )
          .setFooter({ text: `Pirate since ${player.createdAt.toLocaleDateString()}`, iconURL: 'https://cdn.discordapp.com/emojis/123456789.png' })
          .setTimestamp();

        // Add badges/achievements field if player has any
        if (player.achievements && player.achievements.length > 0) {
          profileEmbed.addFields({ name: '🏆 Achievements', value: player.achievements.map(a => `• ${a}`).join('\n').substring(0, 1024), inline: false });
        }

        // Add crew/alliance info if applicable
        if (player.crew) profileEmbed.addFields({ name: '🏴‍☠️ Crew', value: player.crew, inline: true });
        if (player.bounty && player.bounty > 0) profileEmbed.addFields({ name: '💰 Bounty', value: `${player.bounty.toLocaleString()} Berries`, inline: true });

        await interaction.reply({ embeds: [profileEmbed], flags: targetUser.id === interaction.user.id ? MessageFlags.Ephemeral : 0 });
      } catch (error) {
        console.error('Error in profile command (view):', error);
        const errorEmbed = new EmbedBuilder().setTitle('⚠️ Error Loading Profile').setDescription('There was an error loading the profile. Please try again later.').setColor(0xe74c3c);
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (subcommand === 'reset') {
      const discordId = interaction.user.id;
      try {
        const player = await Player.findOne({ where: { discordId } });
        if (!player) {
          const noCharContainer = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('❌ **No character found**\nYou don\'t have a character to reset. Use `/start` to create one.'));
          await interaction.reply({ components: [noCharContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        // Step 1: show warning and ask to confirm
        const warningContainer = new ContainerBuilder()
          .setAccentColor(0xe74c3c)
          .addTextDisplayComponents(td => td.setContent('⚠️ **Reset Character — Irreversible**'), td => td.setContent('This will permanently delete your character, progress, inventory, and quests. You will need to create a new character with `/start`.'))
          .addSeparatorComponents(s => s.setDivider(true).setSpacing(SeparatorSpacingSize.Small))
          .addSectionComponents(section => section.addTextDisplayComponents(td => td.setContent(`Character: **${interaction.user.username}**\nCreated: ${player.createdAt ? player.createdAt.toLocaleDateString() : 'Unknown'}`)).setThumbnailAccessory(th => th.setURL(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))))
          .addActionRowComponents(row => row.setComponents(new ButtonBuilder().setCustomId('confirm_reset').setLabel('Delete (Continue)').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)));

        await interaction.reply({ components: [warningContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

        const confirm = await interaction.channel.awaitMessageComponent({ filter: i => i.user.id === discordId && i.customId && (i.customId === 'confirm_reset' || i.customId === 'cancel_reset'), time: 60000, });

        if (confirm.customId === 'cancel_reset') {
          const cancelContainer = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('✅ **Reset canceled.** Your character is safe.'));
          await confirm.update({ components: [cancelContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        // Step 2: final confirmation
        const finalContainer = new ContainerBuilder().setAccentColor(0xe74c3c).addTextDisplayComponents(td => td.setContent('🛑 **Final Confirmation**'), td => td.setContent('This is your last chance. Press **Delete Permanently** to erase your character forever. This action cannot be undone.')).addActionRowComponents(row => row.setComponents(new ButtonBuilder().setCustomId('final_reset').setLabel('Delete Permanently').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)));

        await confirm.update({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

        const final = await interaction.channel.awaitMessageComponent({ filter: i => i.user.id === discordId && i.customId && (i.customId === 'final_reset' || i.customId === 'cancel_reset'), time: 60000, });

        if (final.customId === 'cancel_reset') {
          const cancelContainer = new ContainerBuilder().setAccentColor(0x95a5a6).addTextDisplayComponents(td => td.setContent('✅ **Reset canceled.** Your character is safe.'));
          await final.update({ components: [cancelContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
          return;
        }

        // Perform deletion
        try {
          if (player && typeof player.destroy === 'function') await player.destroy(); else await Player.destroy({ where: { discordId } });
        } catch (e) { console.error('Failed to delete player record', e); }

        const doneContainer = new ContainerBuilder().setAccentColor(0x2ecc71).addTextDisplayComponents(td => td.setContent('🗑️ **Character Deleted**\nYour character has been removed. Use `/start` to create a new pirate and begin again!'));
        await final.update({ components: [doneContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
      } catch (err) {
        console.error('Error during reset flow', err);
        const errContainer = new ContainerBuilder().setAccentColor(0xe74c3c).addTextDisplayComponents(td => td.setContent('⚠️ **An error occurred while resetting your character.** Please try again later.'));
        try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ components: [errContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); else await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); } catch (e) {}
      }
      return;
    }
    // Unknown subcommand
    await interaction.reply({ content: 'Unknown profile subcommand.', ephemeral: true });
  },

        // Perform deletion
        try {
          if (player && typeof player.destroy === 'function') {
            await player.destroy();
          } else {
            await Player.destroy({ where: { discordId } });
          }
        } catch (e) { console.error('Failed to delete player record', e); }

        const doneContainer = new ContainerBuilder()
          .setAccentColor(0x2ecc71)
          .addTextDisplayComponents(td => td.setContent('🗑️ **Character Deleted**\nYour character has been removed. Use `/start` to create a new pirate and begin again!'));

        await final.update({ components: [doneContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        return;
      } catch (err) {
        console.error('Error during reset flow', err);
        const errContainer = new ContainerBuilder().setAccentColor(0xe74c3c).addTextDisplayComponents(td => td.setContent('⚠️ **An error occurred while resetting your character.** Please try again later.'));
        try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ components: [errContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); else await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }); } catch (e) {}
        return;
      }
    }
      
    } catch (error) {
      console.error('Error in profile command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ Error Loading Profile')
        .setDescription('There was an error loading the profile. Please try again later.')
        .setColor(0xe74c3c);
      
      await interaction.reply({ 
        embeds: [errorEmbed], 
        flags: MessageFlags.Ephemeral 
      });
    }
  },
};