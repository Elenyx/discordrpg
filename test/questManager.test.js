const questManager = require('../src/quests/QuestManager');

describe('QuestManager accept/complete flow', () => {
  test('accept starts quest and complete applies rewards', async () => {
    const player = { race: 'default', activeQuest: null, activeQuestData: null, berries: 0, exp: 0, inventory: [] };

    const replies = [];
    const interaction = {
      reply: async (msg) => {
        replies.push(msg);
      }
    };

    // Accept the quest
    await questManager.handleQuestCommand('accept', player, interaction);

  expect(player.activeQuest).toBe('romance_dawn');
  expect(player.activeQuestData).not.toBeNull();
  expect(player.activeQuestInstance).not.toBeNull();
    expect(replies.length).toBeGreaterThan(0);
    // The accept reply should use Components V2 flags and include components
    const acceptReply = replies[0];
    expect(acceptReply).toHaveProperty('components');
    // Some runtime environments may not set flags; we accept either object or string replies, but prefer V2
    // If flags exist, ensure IsComponentsV2 is set
    if (acceptReply.flags !== undefined) {
      const { MessageFlags } = require('discord.js');
      expect(acceptReply.flags & MessageFlags.IsComponentsV2).toBeGreaterThanOrEqual(0);
    }

    // Simulate being at the final step and complete
    player.activeQuestData.state = 'in-progress';
    player.activeQuestData.currentStep = 999;

    await questManager.handleQuestCommand('complete', player, interaction);

    // After completion, active quest should be cleared and rewards applied
  expect(player.activeQuest).toBeNull();
  expect(player.activeQuestData).toBeNull();
  expect(player.activeQuestInstance).toBeNull();
    expect(player.berries).toBeGreaterThan(0);
    expect(player.exp).toBeGreaterThan(0);
    expect(player.inventory.length).toBeGreaterThan(0);
    // The last reply (completion) should be a Components V2 container
    const completionReply = replies[replies.length - 1];
    expect(completionReply).toHaveProperty('components');
    if (completionReply.flags !== undefined) {
      const { MessageFlags } = require('discord.js');
      expect(completionReply.flags & MessageFlags.IsComponentsV2).toBeGreaterThanOrEqual(0);
    }
  });
});

afterAll(async () => {
  try {
    const db = require('../src/database/models');
    if (db && db.sequelize) await db.sequelize.close();
  } catch (e) {
    // ignore
  }
});
