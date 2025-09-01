require('dotenv').config();
const { Sequelize } = require('sequelize');
const PlayerModel = require('./src/database/models/player');
const QuestModel = require('./src/database/models/quest');
const SettingModel = require('./src/database/models/setting');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const Player = PlayerModel(sequelize);
const Quest = QuestModel(sequelize);
const Setting = SettingModel(sequelize);

module.exports = {
  sequelize,
  Player,
  Quest,
  Setting,
};
