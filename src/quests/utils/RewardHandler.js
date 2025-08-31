// Handles quest rewards (EXP, berries, items, allies, etc.)
module.exports = {
  giveRewards(player, rewards) {
  	  if (rewards.exp) player.exp = (player.exp || 0) + rewards.exp;
    if (rewards.berries) player.berries = (player.berries || 0) + rewards.berries;
    if (rewards.items) {
      if (!player.items && player.inventory) player.items = player.inventory;
      if (!player.items) player.items = [];
      player.items.push(...rewards.items);
    }
    if (rewards.allies) {
      if (!player.allies) player.allies = [];
      player.allies.push(...rewards.allies);
    }
    // Add more reward types as needed
  }
};
