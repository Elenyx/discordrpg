"use strict";
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Best-effort: if there's a data export at repo root, use it to backfill active quest fields
    try {
      const exportPath = path.resolve(process.cwd(), 'data', 'players_export.json');
      if (!fs.existsSync(exportPath)) return;

      const raw = fs.readFileSync(exportPath, 'utf8');
      const players = JSON.parse(raw);

      for (const p of players) {
        if (!p.discordId) continue;
        const updates = {};
        if (p.activeQuest) updates.active_quest = p.activeQuest;
        if (p.activeQuestData) updates.active_quest_data = p.activeQuestData;
        if (p.activeQuestInstance) updates.active_quest_instance = p.activeQuestInstance;
        if (Object.keys(updates).length === 0) continue;
        await queryInterface.bulkUpdate('players', updates, { discord_id: p.discordId });
      }
    } catch (err) {
      // Don't fail migrations for missing or invalid export
      console.warn('Backfill migration skipped or failed:', err.message);
    }
  },
  down: async () => {
    // no-op
  },
};
