// Manages branching quest dialogue and story text
module.exports = {
  getDialogue(quest, state) {
    // Return dialogue based on quest and current state
    if (quest.dialogue && quest.dialogue[state]) {
      return quest.dialogue[state];
    }
    return '';
  }
};
