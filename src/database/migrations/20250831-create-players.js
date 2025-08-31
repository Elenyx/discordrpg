"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("players", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      discord_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      race: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      origin: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dream: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stats: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      currentQuestId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("players");
  },
};
