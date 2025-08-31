// MiniGames.js

/**
 * Simulates a fight mini-game.
 * @param {Object} player - The player object.
 * @param {number} basePower - The base power of the opponent.
 * @returns {boolean} - Whether the player wins the mini-game.
 */
function morganFightMiniGame(player, basePower = 50) {
    let playerPower = player.level * 10;

    // Race advantages
    if (player.race === 'Giant') playerPower += 20;
    if (player.race === 'Fishman') playerPower += 15;

    return Math.random() * playerPower > basePower * 0.7;
}

module.exports = {
    morganFightMiniGame
};
