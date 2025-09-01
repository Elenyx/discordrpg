const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
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
  'All Blue': '🌊',
  'World Map': '🗺️',
  'Cure All': '💊',
  'Strongest': '💪'
};

// Calculate level from stats (example formula)
function calculateLevel(stats) {
  const totalStats = (stats.hp || 10) + (stats.atk || 5) + (stats.def || 5);
  return Math.floor(totalStats / 10);
}

// Format stats for display
function formatStats(stats) {
  return [
    `❤️ **HP:** ${stats.hp || 10}`,
    `⚔️ **ATK:** ${stats.atk || 5}`,
    `🛡️ **DEF:** ${stats.def || 5}`,
    `⚡ **SPD:** ${stats.spd || 5}`,
    `🎯 **ACC:** ${stats.acc || 5}`,
    `🍀 **LCK:** ${stats.lck || 5}`
  ].join('\n');
}

// Generate progress bar
function generateProgressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your character profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('View another pirate\'s profile')
        .setRequired(false)),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const discordId = targetUser.id;
    
    try {
  // Fetch player data
  const player = await Player.findOne({ where: { discordId: discordId } });
      
      if (!player) {
        const noCharacterEmbed = new EmbedBuilder()
          .setTitle('❌ No Character Found')
          .setDescription(targetUser.id === interaction.user.id 
            ? 'You haven\'t created a character yet!\nUse `/start` to begin your adventure!' 
            : `${targetUser.username} hasn't created a character yet!`)
          .setColor(0xe74c3c);
        
        return interaction.reply({ 
          embeds: [noCharacterEmbed], 
          flags: MessageFlags.Ephemeral 
        });
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
          { 
            name: '👤 Character Info', 
            value: [
              `${raceEmoji} **Race:** ${player.race}`,
              `${originEmoji} **Origin:** ${player.origin}`,
              `${dreamEmoji} **Dream:** ${player.dream}`
            ].join('\n'),
            inline: false 
          },
          {
            name: '📊 Stats',
            value: formatStats(stats),
            inline: true
          },
          {
            name: '🎯 Progress',
            value: [
              `**Level:** ${level}`,
              `**EXP:** ${currentExp}/${nextLevelExp}`,
              `\`${expProgress}\``,
              `**Berries:** 🪙 ${player.berries || 0}`
            ].join('\n'),
            inline: true
          },
          {
            name: '📜 Current Quest',
            value: player.currentQuestId ? `🗺️ ${player.currentQuestId}` : '❌ No active quest\nUse `/quest` to start!',
            inline: false
          }
        )
        .setFooter({ 
          text: `Pirate since ${player.createdAt.toLocaleDateString()}`,
          iconURL: 'https://cdn.discordapp.com/emojis/123456789.png' // Optional: Add your bot's icon
        })
        .setTimestamp();
      
      // Add badges/achievements field if player has any
      if (player.achievements && player.achievements.length > 0) {
        profileEmbed.addFields({
          name: '🏆 Achievements',
          value: player.achievements.map(a => `• ${a}`).join('\n').substring(0, 1024),
          inline: false
        });
      }
      
      // Add crew/alliance info if applicable
      if (player.crew) {
        profileEmbed.addFields({
          name: '🏴‍☠️ Crew',
          value: player.crew,
          inline: true
        });
      }
      
      // Add bounty if exists
      if (player.bounty && player.bounty > 0) {
        profileEmbed.addFields({
          name: '💰 Bounty',
          value: `${player.bounty.toLocaleString()} Berries`,
          inline: true
        });
      }
      
      await interaction.reply({
        embeds: [profileEmbed],
        flags: targetUser.id === interaction.user.id ? MessageFlags.Ephemeral : 0
      });
      
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