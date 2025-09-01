const {
  SlashCommandBuilder,
  MessageFlags,
  ButtonStyle,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ContainerBuilder,
  ButtonBuilder,
  ActionRowBuilder, // This import is crucial
} = require('discord.js');
const { Player } = require('../../database');
const { generateToken, deleteToken } = require('../utils/tokenStore');

const races = [
  { label: 'Human', value: 'Human', description: 'Versatile and adaptable fighters' },
  { label: 'Fishman', value: 'Fishman', description: 'Strong swimmers with aquatic abilities' },
  { label: 'Mink', value: 'Mink', description: 'Electric-powered animal humanoids' },
  { label: 'Giant', value: 'Giant', description: 'Massive warriors with incredible strength' },
  { label: 'Skypiean', value: 'Skypiean', description: 'Sky islanders with small wings' },
];

const origins = [
  { label: 'East Blue', value: 'East Blue', description: 'The weakest sea, birthplace of legends' },
  { label: 'West Blue', value: 'West Blue', description: 'Known for its strong fighters' },
  { label: 'North Blue', value: 'North Blue', description: 'Home to many notorious pirates' },
  { label: 'South Blue', value: 'South Blue', description: 'A sea of diverse cultures' },
  { label: 'Grand Line', value: 'Grand Line', description: 'The most dangerous sea' },
];

const dreams = [
  { label: 'Become Pirate King', value: 'Pirate King', description: 'Find the One Piece treasure' },
  { label: 'Find All Blue', value: 'All Blue', description: 'The legendary sea of all fish' },
  { label: 'Draw World Map', value: 'World Map', description: 'Chart every island and sea' },
  { label: 'Cure All Illness', value: 'Cure All', description: 'Become the greatest doctor' },
  { label: 'Be Strongest', value: 'Strongest', description: 'Become the world\'s strongest fighter' },
];

// Helper function to build Components V2 container with text and select menu
function buildStepContainer(step, title, description, selectId, options, token) {
  const textDisplay = new TextDisplayBuilder()
    .setContent(`**Step ${step}: ${title}**\n${description}`);

  const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(token ? `${selectId}::${token}` : selectId)
    .setPlaceholder(`Choose your ${title.toLowerCase()}`)
    .addOptions(options);

  // ActionRow holds the interactive component (Select Menu)
  const actionRow = new ActionRowBuilder().addComponents(selectMenu);

  const container = new ContainerBuilder()
    .setAccentColor(0x3498db)
    .addTextDisplayComponents(textDisplay)    // Add text display directly to container
    .addActionRowComponents(actionRow);       // Add action row directly to container

  return container;
}

// Helper function to build summary container with multiple buttons
function buildSummaryContainer(race, origin, dream) {
  const textDisplay = new TextDisplayBuilder()
    .setContent(`**🏴‍☠️ Character Summary**\n**Race:** ${race}\n**Origin:** ${origin}\n**Dream:** ${dream}\n\nReady to begin your adventure?`);

  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm_start')
    .setLabel('⚓ Set Sail!')
    .setStyle(ButtonStyle.Success);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_start')
    .setLabel('❌ Cancel')
    .setStyle(ButtonStyle.Danger);

  // ActionRow holds the interactive components (Buttons)
  const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

  const container = new ContainerBuilder()
    .setAccentColor(0x27ae60)
    .addTextDisplayComponents(textDisplay)   // Add text display directly to container
    .addActionRowComponents(actionRow);      // Add action row directly to container

  return container;
}

// Helper function to build a simple text display container
function buildTextContainer(content, accentColor = 0x3498db) {
  const textDisplay = new TextDisplayBuilder().setContent(content);

  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(textDisplay);  // Add text display directly to container

  return container;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Begin your One Piece adventure!'),

  async execute(interaction) {
    const discordId = interaction.user.id;

    try {
      // Check if player already exists
  const existing = await Player.findOne({ where: { discordId: discordId } });
      if (existing) {
        // Using a V2 component for the reply to maintain consistency
        const alreadyExistsContainer = buildTextContainer(
          'You already have a character! Use `/profile` to view your stats.',
          0xe74c3c // Red color for error/warning
        );
        return interaction.reply({
          components: [alreadyExistsContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
      }

      // Create a transient token to attach to component customIds so other handlers
      // can authenticate these interactions if needed.
      const transientToken = generateToken({ discordId });

      // Step 1: Race selection
      const raceContainer = buildStepContainer(
        1,
        'Race Selection',
        'Choose your character\'s race. Each race has unique traits and abilities!',
        'select_race',
        races,
        transientToken
      );

      await interaction.reply({
        components: [raceContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });

      const raceSelect = await interaction.channel.awaitMessageComponent({
        filter: i => i.user.id === discordId && i.customId && i.customId.startsWith('select_race'),
        time: 60000,
      });
      const race = raceSelect.values[0];

      // Step 2: Origin selection
      const originContainer = buildStepContainer(
        2,
        'Origin Selection',
        'Where do you hail from? Each sea shapes your character\'s background.',
        'select_origin',
        origins
      ,
        transientToken
      );

      await raceSelect.update({
        components: [originContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const originSelect = await interaction.channel.awaitMessageComponent({
        filter: i => i.user.id === discordId && i.customId && i.customId.startsWith('select_origin'),
        time: 60000,
      });
      const origin = originSelect.values[0];

      // Step 3: Dream selection
      const dreamContainer = buildStepContainer(
        3,
        'Dream Selection',
        'What is your ultimate goal? Your dream will drive your journey across the seas!',
        'select_dream',
        dreams
      ,
        transientToken
      );

      await originSelect.update({
        components: [dreamContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const dreamSelect = await interaction.channel.awaitMessageComponent({
        filter: i => i.user.id === discordId && i.customId && i.customId.startsWith('select_dream'),
        time: 60000,
      });
      const dream = dreamSelect.values[0];

      // Step 4: Summary and confirmation
  const summaryContainer = buildSummaryContainer(race, origin, dream, transientToken);

      await dreamSelect.update({
        components: [summaryContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const confirm = await interaction.channel.awaitMessageComponent({
        filter: i => i.user.id === discordId && i.customId && (i.customId.startsWith('confirm_start') || i.customId.startsWith('cancel_start')),
        time: 60000,
      });

  if (confirm.customId && confirm.customId.startsWith('cancel_start')) {
        const cancelContainer = buildTextContainer(
          '⛵ **Character creation cancelled.**\nYou can start again anytime with `/start`!',
          0x95a5a6
        );
        await confirm.update({
          components: [cancelContainer],
          flags: MessageFlags.IsComponentsV2
        });
        try { deleteToken && deleteToken(transientToken); } catch (e) {}
        return;
      }

      // Create player in database
      await Player.create({
        discordId: discordId,
        race,
        origin,
        dream,
        stats: { hp: 10, atk: 5, def: 5 },
        currentQuestId: null,
      });

      // Success message
      const successContainer = buildTextContainer(
        `🎉 **Welcome to the Grand Line, pirate!**\n\n**${race}** from **${origin}** with the dream to **${dream}**!\n\nYour adventure begins now! Use \`/profile\` to view your character stats and \`/quest\` to start your first mission.`,
        0xf1c40f
      );

      await confirm.update({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2
      });
      try { deleteToken && deleteToken(transientToken); } catch (e) {}

    } catch (error) {
      console.error('Error in start command:', error);

      if (error.code === 'InteractionCollectorError' || error.message.includes('collector')) {
        const timeoutContainer = buildTextContainer(
          '⏰ **Character creation timed out.**\nPlease try again with `/start` when you\'re ready.',
          0x95a5a6
        );
        await interaction.editReply({
          components: [timeoutContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {}); // Suppress errors if the interaction is already gone
      } else {
        const errorContainer = buildTextContainer(
          '⚠️ **An error occurred during character creation.**\nPlease try again with `/start`.',
          0xe74c3c
        );
        // Use editReply if an interaction has already been replied to, otherwise reply.
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2
            }).catch(() => {});
        } else {
            await interaction.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            }).catch(() => {});
        }
      }
    }
  },
};