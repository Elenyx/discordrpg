"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('players', 'active_quest_instance', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('players', 'active_quest_instance');
  },
};
