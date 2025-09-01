// Handles quest rewards (EXP, berries, items, allies, etc.)
// Leveling curve configuration is kept in central config/config.js so designers can tune pacing.
const config = require('../../../config/config');
const LEVELING_CONFIG = config.leveling || { baseExp: 100, power: 1.25 };



function expForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(LEVELING_CONFIG.baseExp * Math.pow(i, LEVELING_CONFIG.power));
  }
  return total;
}

function getLevelFromExp(exp) {
  exp = Math.max(0, exp || 0);
  let level = 1;
  while (exp >= expForLevel(level + 1)) {
    level++;
    if (level > 1000) break;
  }
  return level;
}

function giveRewards(player, rewards = {}) {
    // Ensure numeric fields exist
    player.exp = player.exp || 0;
    player.berries = player.berries || 0;
    player.items = player.items || (player.inventory ? player.inventory.slice() : []);
    player.allies = player.allies || [];
    player.level = player.level || getLevelFromExp(player.exp);

    const result = {
      berries: 0,
      exp: 0,
      items: [],
      allies: [],
      levelUp: null
    };

    if (rewards.exp) {
      result.exp = rewards.exp;
      player.exp += rewards.exp;
    }
    if (rewards.berries) {
      result.berries = rewards.berries;
      player.berries += rewards.berries;
    }
    if (rewards.items && rewards.items.length) {
      result.items = rewards.items.slice();
      player.items.push(...rewards.items);
      // maintain legacy `inventory` field if present
      if (Array.isArray(player.inventory)) {
        player.inventory.push(...rewards.items);
      } else {
        player.inventory = player.items.slice();
      }
    }
    if (rewards.allies && rewards.allies.length) {
      result.allies = rewards.allies.slice();
      player.allies.push(...rewards.allies);
    }

    // Recompute level and determine if a level-up occurred
    const oldLevel = player.level || getLevelFromExp(player.exp - (result.exp || 0));
    const newLevel = getLevelFromExp(player.exp);
    if (newLevel > oldLevel) {
      player.level = newLevel;
      result.levelUp = {
        oldLevel,
        newLevel,
        levelsGained: newLevel - oldLevel
      };
    }

    return result;
}

module.exports = {
  giveRewards,
  expForLevel,
  getLevelFromExp
};
