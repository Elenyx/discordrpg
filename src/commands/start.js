const { SlashCommandBuilder } = require('discord.js');

// V2 component helpers
function buildSelectRow({ selectId, options, title }) {
  return [
    {
      type: 1, // Action Row
      components: [
        {
          type: 3, // String Select
          custom_id: selectId,
          options: options.map(opt => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
            emoji: opt.emoji || undefined,
          })),
          placeholder: `Select your ${title.toLowerCase()}`,
          min_values: 1,
          max_values: 1,
        },
      ],
    },
  ];
}

function buildSummaryRow() {
  return [
    {
      type: 1, // Action Row
      components: [
        {
          type: 2, // Button
          style: 3, // Success
          label: 'Confirm',
          custom_id: 'confirm_start',
        },
        {
          type: 2, // Button
          style: 4, // Danger
          label: 'Cancel',
          custom_id: 'cancel_start',
        },
      ],
    },
  ];
}
const { Player } = require('../../database');

const races = [
  { label: 'Human', value: 'Human' },
  { label: 'Fishman', value: 'Fishman' },
  { label: 'Mink', value: 'Mink' },
  { label: 'Giant', value: 'Giant' },
  { label: 'Skypiean', value: 'Skypiean' },
];
const origins = [
  { label: 'East Blue', value: 'East Blue' },
  { label: 'West Blue', value: 'West Blue' },
  { label: 'North Blue', value: 'North Blue' },
  { label: 'South Blue', value: 'South Blue' },
  { label: 'Grand Line', value: 'Grand Line' },
];
const dreams = [
  { label: 'Become Pirate King', value: 'Pirate King' },
  { label: 'Find All Blue', value: 'All Blue' },
  { label: 'Draw World Map', value: 'World Map' },
  { label: 'Cure All Illness', value: 'Cure All' },
  { label: 'Be Strongest', value: 'Strongest' },
];


module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Begin your One Piece adventure!'),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const existing = await Player.findOne({ where: { discord_id: discordId } });
    if (existing) {
      return interaction.reply({ content: 'You already have a character!', ephemeral: true });
    }

    // Step 1: Race selection (Embed + String Select)
    await interaction.reply({
      embeds: [{
        title: 'Step 1: Race',
        description: 'Choose your character\'s race. Each race has unique traits!',
        color: 0x1e90ff,
      }],
      components: buildSelectRow({
        selectId: 'select_race',
        options: races,
        title: 'Race',
      }),
      flags: 1, // Components V2
      ephemeral: true,
    });
    const raceSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_race',
      time: 60000,
    });
    const race = raceSelect.values[0];
    await raceSelect.update({
      content: null,
      components: [],
      flags: 1,
      ephemeral: true,
    });

    // Step 2: Origin selection
    await interaction.followUp({
      embeds: [{
        title: 'Step 2: Origin',
        description: 'Where do you hail from? Each sea has its own story.',
        color: 0x1e90ff,
      }],
      components: buildSelectRow({
        selectId: 'select_origin',
        options: origins,
        title: 'Origin',
      }),
      flags: 1,
      ephemeral: true,
    });
    const originSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_origin',
      time: 60000,
    });
    const origin = originSelect.values[0];
    await originSelect.update({
      content: null,
      components: [],
      flags: 1,
      ephemeral: true,
    });

    // Step 3: Dream selection
    await interaction.followUp({
      embeds: [{
        title: 'Step 3: Dream',
        description: 'What is your ultimate goal? Your dream shapes your journey.',
        color: 0x1e90ff,
      }],
      components: buildSelectRow({
        selectId: 'select_dream',
        options: dreams,
        title: 'Dream',
      }),
      flags: 1,
      ephemeral: true,
    });
    const dreamSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_dream',
      time: 60000,
    });
    const dream = dreamSelect.values[0];
    await dreamSelect.update({
      content: null,
      components: [],
      flags: 1,
      ephemeral: true,
    });

    // Step 4: Summary and confirmation
    await interaction.followUp({
      embeds: [{
        title: 'Character Summary',
        description: `Race: **${race}**\nOrigin: **${origin}**\nDream: **${dream}**`,
        color: 0x1e90ff,
      }],
      components: buildSummaryRow(),
      flags: 1,
      ephemeral: true,
    });
    const confirm = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && (i.customId === 'confirm_start' || i.customId === 'cancel_start'),
      time: 60000,
    });
    if (confirm.customId === 'cancel_start') {
      await confirm.update({
        content: 'Character creation cancelled.',
        components: [],
        flags: 1,
        ephemeral: true,
      });
      return;
    }

    // Save to DB
    await Player.create({
      discord_id: discordId,
      race,
      origin,
      dream,
      stats: { hp: 10, atk: 5, def: 5 },
      currentQuestId: null,
    });
    await confirm.update({
      content: 'Character created! Use /profile to view your stats.',
      components: [],
      flags: 1,
      ephemeral: true,
    });
  },
};
