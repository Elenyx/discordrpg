const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discordId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'discord_id', // Map to database column
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
