const questManager = require('../src/quests/QuestManager');

describe('Quest instance serialization & restore', () => {
  test('RomanceDawn restores state from activeQuestInstance', async () => {
    const player = { race: 'default', activeQuest: null, activeQuestData: null, activeQuestInstance: null, berries: 0, exp: 0, inventory: [] };
    const interaction = { reply: async () => {}, update: async () => {} };

    // Accept the quest
    await questManager.handleQuestCommand('accept', player, interaction);
    expect(player.activeQuestInstance).not.toBeNull();

    // Simulate progress change
    player.activeQuestInstance.currentStep = 2;
    player.activeQuestInstance.custom = { note: 'test' };

    // Simulate a new process reloading the quest
    const restored = questManager.getCurrentQuest(player);
    expect(restored.currentStep).toBe(2);
    expect(restored.custom).toBeDefined();
    expect(restored.custom.note).toBe('test');
  });

  test('Custom quest instance shape is restored', async () => {
    // Create a simple fake quest class and register it
    class FakeQuest {
      static id = 'fake_quest';
      constructor(player) { this.player = player; this.state='in-progress'; this.currentStep=1; this.custom={}; }
      async start() { return { content: 'started' }; }
      async complete() { return { rewards: { berries: 1, exp: 1, items: ['x'] } }; }
    }

    questManager.registerQuest(FakeQuest);

    const player = { activeQuest: null, activeQuestData: null, activeQuestInstance: null, berries:0,exp:0,inventory:[] };
    const interaction = { reply: async () => {} };

  // Create the fake quest instance and persist as accept flow would
  const q = questManager.createQuest('fake_quest', player);
  player.activeQuest = 'fake_quest';
  player.activeQuestInstance = { state: q.state, currentStep: q.currentStep, custom: {} };
  // Simulate custom state
  player.activeQuestInstance.custom = { foo: 'bar' };

  const restored = questManager.getCurrentQuest(player);
  expect(restored.currentStep).toBe(1);
  expect(restored.custom.foo).toBe('bar');
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
