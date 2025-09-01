// MiniGames.js

/**
 * Simulates a fight mini-game.
 * @param {Object} player - The player object.
 * @param {number} basePower - The base power of the opponent.
 * @returns {boolean} - Whether the player wins the mini-game.
 */
function morganFightMiniGame(player, basePower = 50) {
    let playerPower = (player.level || 1) * 10;

    // Race advantages
    if (player.race === 'Giant') playerPower += 20;
    if (player.race === 'Fishman') playerPower += 15;

    return Math.random() * playerPower > basePower * 0.7;
}

function trainingMiniGame(player) {
    // Simple RNG-based training success. Higher level -> higher base power
    const chance = Math.min(0.9, 0.3 + ((player.level || 1) * 0.05));
    const success = Math.random() < chance;
    const amount = success ? Math.floor(3 + Math.random() * 5) : 0;
    return { success, amount };
}

function sparMiniGame(player) {
    // Simulate a short spar where player's power competes with a random opponent
    const opponentPower = 10 + Math.floor(Math.random() * 20);
    const playerPower = (player.stats && player.stats.power) || ((player.level || 1) * 10);
    const success = playerPower + Math.random() * 10 > opponentPower;
    const amount = success ? Math.max(2, Math.floor((playerPower - opponentPower) / 5) + 3) : 0;
    return { success, amount };
}

function fishingMiniGame(player) {
    // Fishing yields supplies which temporarily boost power; modeled as amount
    const success = Math.random() < 0.6;
    const amount = success ? (2 + Math.floor(Math.random() * 6)) : 0;
    return { success, amount };
}

function turnBasedFight(player, opponentPower) {
    // Very small turn-based fight simulator. Returns object with victory and log
    const playerPower = (player.stats && player.stats.power) || ((player.level || 1) * 10);
    let playerHP = 50 + Math.floor(playerPower / 2);
    let oppHP = 50 + Math.floor(opponentPower / 2);

    const log = [];
    let turn = 0;
    while (playerHP > 0 && oppHP > 0 && turn < 20) {
        // player attacks
        const pDamage = Math.max(1, Math.floor((playerPower / 10) + Math.random() * 6));
        oppHP -= pDamage;
        log.push(`You hit for ${pDamage} (oppHP=${Math.max(0, oppHP)})`);
        if (oppHP <= 0) break;

        // opponent attacks
        const oDamage = Math.max(1, Math.floor((opponentPower / 10) + Math.random() * 6));
        playerHP -= oDamage;
        log.push(`Morgan hits for ${oDamage} (youHP=${Math.max(0, playerHP)})`);
        turn++;
    }

    const victory = playerHP > 0 && oppHP <= 0;
    return { victory, log, playerHP: Math.max(0, playerHP), oppHP: Math.max(0, oppHP) };
}

module.exports = {
    morganFightMiniGame,
    trainingMiniGame,
    sparMiniGame,
    fishingMiniGame,
    turnBasedFight,
    // New: small map puzzle mini-game
    mapPuzzle
};

function mapPuzzle(player) {
    // Simple puzzle: player must 'solve' by RNG influenced by charisma
    const charisma = (player.stats && player.stats.charisma) || 0;
    const baseChance = 0.3 + (charisma * 0.1);
    const success = Math.random() < Math.min(0.95, baseChance);
    return { success, reward: success ? { item: 'map_fragment', note: 'You completed the map puzzle and revealed a clue.' } : null };
}
