const { expForLevel, getLevelFromExp } = require('../src/quests/utils/RewardHandler');

describe('Leveling functions', () => {
  test.each([
    [1, 0],
    [2, expForLevel(2)],
    [3, expForLevel(3)],
    [5, expForLevel(5)],
    [10, expForLevel(10)]
  ])('expForLevel and getLevelFromExp are consistent for level %i', (level, exp) => {
    expect(getLevelFromExp(exp)).toBe(level);
  });

  test('getLevelFromExp interpolates between levels', () => {
    const expAt2 = expForLevel(2);
    const expAt3 = expForLevel(3);
    const mid = Math.floor((expAt2 + expAt3) / 2);
    expect(getLevelFromExp(mid)).toBe(2);
  });
});
