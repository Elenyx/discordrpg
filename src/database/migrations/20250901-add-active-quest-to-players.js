"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('players', 'active_quest', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('players', 'active_quest_data', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('players', 'active_quest_data');
    await queryInterface.removeColumn('players', 'active_quest');
  },
};
