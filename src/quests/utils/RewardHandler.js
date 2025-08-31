// Handles quest rewards (EXP, berries, items, allies, etc.)
module.exports = {
  giveRewards(player, rewards) {
    if (rewards.exp) player.exp += rewards.exp;
    if (rewards.berries) player.berries += rewards.berries;
    if (rewards.items) player.items.push(...rewards.items);
    if (rewards.allies) player.allies.push(...rewards.allies);
    // Add more reward types as needed
  }
};
