"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("quests", {
      quest_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      saga: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      arc: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("locked", "in-progress", "completed"),
        allowNull: false,
        defaultValue: "locked",
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
    await queryInterface.dropTable("quests");
  },
};
