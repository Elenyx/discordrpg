// Abstract base class for all quests
class BaseQuest {
  constructor({ id, title, description, requirements = {}, rewards = {} }) {
    if (this.constructor === BaseQuest) {
      throw new Error('BaseQuest is abstract and cannot be instantiated directly.');
    }
    this.id = id;
    this.title = title;
    this.description = description;
    this.requirements = requirements;
    this.rewards = rewards;
  }

  // Called when quest is started
  start(player) {
    throw new Error('start() must be implemented by subclass');
  }

  // Called to update quest progress
  progress(player, data) {
    throw new Error('progress() must be implemented by subclass');
  }

  // Called when quest is completed
  complete(player) {
    throw new Error('complete() must be implemented by subclass');
  }

  // Called when quest fails
  fail(player) {
    throw new Error('fail() must be implemented by subclass');
  }
}

module.exports = BaseQuest;
