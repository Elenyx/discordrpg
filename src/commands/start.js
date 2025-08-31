const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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
    // Race selection
    const raceRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_race')
        .setPlaceholder('Choose your race')
        .addOptions(races)
    );
    await interaction.reply({ content: 'Choose your race:', components: [raceRow], ephemeral: true });

    // Collector for race
    const raceSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_race',
      time: 60000,
    });
    const race = raceSelect.values[0];
    await raceSelect.update({ content: `Race selected: ${race}\nNow choose your origin:`, components: [] });

    // Origin selection
    const originRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_origin')
        .setPlaceholder('Choose your origin')
        .addOptions(origins)
    );
    const originMsg = await interaction.followUp({ content: 'Choose your origin:', components: [originRow], ephemeral: true });
    const originSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_origin',
      time: 60000,
    });
    const origin = originSelect.values[0];
    await originSelect.update({ content: `Origin selected: ${origin}\nNow choose your dream:`, components: [] });

    // Dream selection
    const dreamRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_dream')
        .setPlaceholder('Choose your dream')
        .addOptions(dreams)
    );
    const dreamMsg = await interaction.followUp({ content: 'Choose your dream:', components: [dreamRow], ephemeral: true });
    const dreamSelect = await interaction.channel.awaitMessageComponent({
      filter: i => i.user.id === discordId && i.customId === 'select_dream',
      time: 60000,
    });
    const dream = dreamSelect.values[0];
    await dreamSelect.update({ content: `Character created!`, components: [] });

    // Save to DB
    await Player.create({
      discord_id: discordId,
      race,
      origin,
      dream,
      stats: { hp: 10, atk: 5, def: 5 },
      currentQuestId: null,
    });
  },
};
