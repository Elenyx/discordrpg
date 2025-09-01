const { Sequelize } = require('sequelize');
const PlayerModel = require('./player');

// Only initialize Sequelize if a DATABASE_URL is provided. In test environments we often
// don't want to open a DB connection automatically when the module is required.
if (!process.env.DATABASE_URL) {
  module.exports = null;
} else {
  // Initialize Sequelize instance (update with your database configuration)
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres', // Change this to your database dialect (e.g., mysql, sqlite, etc.)
  });

  // Initialize models
  const Player = PlayerModel(sequelize);

  // Export initialized models
  module.exports = {
    sequelize,
    Player,
  };
}
