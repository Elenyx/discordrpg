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

  // 1) Pick up any top-level .js files (legacy single-file quests)
  const files = fs.readdirSync(sagaPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const questName = path.basename(file, '.js');
    try { quests[saga][questName] = require(path.join(sagaPath, file)); } catch (e) { console.warn('Failed to load quest', file, e.message); }
  }

  // 2) Pick up nested folders that export an index.js (new per-quest folder layout)
  const subdirs = fs.readdirSync(sagaPath, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const sub of subdirs) {
    const idxPath = path.join(sagaPath, sub, 'index.js');
    if (fs.existsSync(idxPath)) {
      try { quests[saga][sub] = require(idxPath); } catch (e) { console.warn('Failed to load quest folder', sub, e.message); }
    }
  }
}

module.exports = quests;
