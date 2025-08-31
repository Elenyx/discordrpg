// Checks quest requirements (level, items, faction, etc.)
module.exports = {
  validate(player, requirements) {
    // Example: check level, items, faction
    if (requirements.level && player.level < requirements.level) return false;
    if (requirements.items) {
      for (const item of requirements.items) {
        if (!player.items.includes(item)) return false;
      }
    }
    if (requirements.faction && player.faction !== requirements.faction) return false;
    return true;
  }
};
