require('dotenv').config();
const { Sequelize } = require('sequelize');
const PlayerModel = require('./src/database/models/player');
const QuestModel = require('./src/database/models/quest');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const Player = PlayerModel(sequelize);
const Quest = QuestModel(sequelize);

module.exports = {
  sequelize,
  Player,
  Quest,
};
