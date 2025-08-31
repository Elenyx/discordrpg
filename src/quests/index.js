// Dynamically loads all quests by saga
const fs = require('fs');
const path = require('path');

const quests = {};
const sagaDirs = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'utils')
  .map(dirent => dirent.name);

for (const saga of sagaDirs) {
  const sagaPath = path.join(__dirname, saga);
  quests[saga] = {};
  const files = fs.readdirSync(sagaPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const questName = path.basename(file, '.js');
    quests[saga][questName] = require(path.join(sagaPath, file));
  }
}

module.exports = quests;
