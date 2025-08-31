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

  // Serialization hook - return a plain JSON-serializable object describing runtime state
  toJSON() {
    return {
      id: this.id,
      state: this.state || null,
      currentStep: this.currentStep || 0,
      version: this.version || 1,
      custom: this.custom || null,
    };
  }

  // Deserialization hook - subclasses can override to perform migrations and custom hydration
  static fromJSON(data, player) {
    // `this` will be the subclass constructor when called as Subclass.fromJSON
    const instance = new this(player);
    instance.state = data.state || instance.state;
    instance.currentStep = data.currentStep || instance.currentStep || 0;
    instance.version = data.version || instance.version || 1;
    instance.custom = data.custom || instance.custom || null;
    return instance;
  }
}

module.exports = BaseQuest;
