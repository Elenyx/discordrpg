const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    race: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dream: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    currentQuestId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'players',
    timestamps: true,
  });
  return Player;
};
