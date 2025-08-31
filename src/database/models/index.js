const { Sequelize } = require('sequelize');
const PlayerModel = require('./player');

// Initialize Sequelize instance (update with your database configuration)
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres', // Change this to your database dialect (e.g., mysql, sqlite, etc.)
});

// Initialize models
const Player = PlayerModel(sequelize);

// Export initialized models
module.exports = {
  sequelize,
  Player,
};
