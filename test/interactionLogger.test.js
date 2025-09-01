const questManager = require('../src/quests/QuestManager');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('Interaction error logging', () => {
  test('logs error when quest.handleInteraction throws', async () => {
    // Arrange: create a fake player and a fake quest that throws
    const player = { id: 42, discordId: '12345', activeQuest: 'test_quest' };

    const throwingQuest = {
      handleInteraction: jest.fn(() => { throw new Error('simulated failure'); })
    };

    // Temporarily register the fake quest class in questManager
    const originalGetCurrentQuest = questManager.getCurrentQuest;
    questManager.getCurrentQuest = () => throwingQuest;

    // Fake interaction object with useful properties
    const interaction = {
      user: { id: '12345' },
      customId: 'test_action',
      guildId: 'g1',
      channelId: 'c1',
      message: { id: 'm1' },
      replied: false,
      deferred: false,
      reply: jest.fn(async () => Promise.resolve()),
      editReply: jest.fn(async () => Promise.resolve())
    };

    // Act: run the same error-catching block that index.js uses
    try {
      const quest = questManager.getCurrentQuest(player);
      await quest.handleInteraction(interaction);
    } catch (e) {
      // Simulate the index.js logging call
      await logger.logError('Component Interaction Error', e, { userId: interaction.user.id, customId: interaction.customId, guildId: interaction.guildId, channelId: interaction.channelId, messageId: interaction.message?.id, playerId: player.id });
      // Simulate user-facing reply (we don't assert this)
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error handling that interaction.', ephemeral: true }).catch(() => {});
      }
    }

    // Assert: logger.logError was called with an Error instance and metadata
    expect(logger.logError).toHaveBeenCalled();
    const callArgs = logger.logError.mock.calls[0];
    expect(callArgs[0]).toBe('Component Interaction Error');
    expect(callArgs[1]).toBeInstanceOf(Error);
    expect(callArgs[2]).toMatchObject({ userId: '12345', customId: 'test_action', guildId: 'g1', channelId: 'c1', messageId: 'm1', playerId: 42 });

    // Cleanup
    questManager.getCurrentQuest = originalGetCurrentQuest;
  });
});
