const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quest = sequelize.define('Quest', {
    quest_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    saga: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('locked', 'in-progress', 'completed'),
      allowNull: false,
      defaultValue: 'locked',
    },
  }, {
    tableName: 'quests',
    timestamps: true,
  });
  return Quest;
};
