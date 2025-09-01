const RewardHandler = require('../src/quests/utils/RewardHandler');

describe('RewardHandler.giveRewards', () => {
  test('happy path: applies berries, exp, items and returns result', () => {
    const player = { berries: 0, exp: 0, inventory: [], allies: [], level: 1 };
    const rewards = { berries: 50, exp: 120, items: ['Sword'], allies: ['Zoro'] };

    const result = RewardHandler.giveRewards(player, rewards);

    expect(player.berries).toBe(50);
    expect(player.exp).toBe(120);
    expect(player.inventory.length).toBeGreaterThan(0);
    expect(player.items).toBeDefined();
    expect(player.items).toContain('Sword');
    expect(player.allies).toContain('Zoro');

    expect(result).toHaveProperty('berries', 50);
    expect(result).toHaveProperty('exp', 120);
    expect(result.items).toContain('Sword');
  });

  test('level-up edge case: crossing level thresholds reports levelUp', () => {
    // Start with exp at threshold for level 1 (0), give a big exp chunk to cause multi-level gain
    const player = { berries: 0, exp: 0, inventory: [], allies: [], level: 1 };
    // Calculate a large exp to guarantee multiple levels; using baseExp * 10^power roughly
    const bigExp = 5000;
    const rewards = { exp: bigExp };

    const result = RewardHandler.giveRewards(player, rewards);

    expect(player.exp).toBe(bigExp);
    expect(result.exp).toBe(bigExp);
    expect(result.levelUp).not.toBeNull();
    expect(result.levelUp.newLevel).toBeGreaterThan(result.levelUp.oldLevel);
  });
});
