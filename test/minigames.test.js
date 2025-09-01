const MiniGames = require('../src/quests/utils/MiniGames');

describe('MiniGames', () => {
    const dummyPlayer = (overrides = {}) => ({
        level: 2,
        race: 'Human',
        stats: { power: 20 },
        ...overrides
    });

    test('trainingMiniGame returns object with success and amount', () => {
        const res = MiniGames.trainingMiniGame(dummyPlayer());
        expect(res).toHaveProperty('success');
        expect(res).toHaveProperty('amount');
        expect(typeof res.success).toBe('boolean');
        expect(typeof res.amount).toBe('number');
    });

    test('sparMiniGame returns expected shape', () => {
        const res = MiniGames.sparMiniGame(dummyPlayer());
        expect(res).toHaveProperty('success');
        expect(res).toHaveProperty('amount');
    });

    test('fishingMiniGame returns expected shape', () => {
        const res = MiniGames.fishingMiniGame(dummyPlayer());
        expect(res).toHaveProperty('success');
        expect(res).toHaveProperty('amount');
    });

    test('turnBasedFight returns victory boolean and log entries', () => {
        const player = dummyPlayer({ stats: { power: 30 } });
        const opponentPower = 40;
        const res = MiniGames.turnBasedFight(player, opponentPower);
        expect(res).toHaveProperty('victory');
        expect(res).toHaveProperty('log');
        expect(Array.isArray(res.log)).toBe(true);
        expect(typeof res.playerHP).toBe('number');
        expect(typeof res.oppHP).toBe('number');
    });

    test('turnBasedFight deterministic-ish under extreme power', () => {
        const strongPlayer = dummyPlayer({ stats: { power: 999 } });
        const res = MiniGames.turnBasedFight(strongPlayer, 10);
        expect(res.victory).toBe(true);
    });
});
