# Copilot Instructions for One Piece RPG Discord Bot

## Project Overview
- This is a modular, saga-driven Discord RPG bot inspired by One Piece, built with Node.js and discord.js.
- Major features: character creation, questing, faction/crew/ship systems, PvP, and persistent state via PostgreSQL (using Sequelize ORM).
- The codebase is organized for scalability: each saga/arc/quest is a separate module, loaded dynamically.

## Key Architecture & Patterns
- **Quests:**
  - Each quest is a class extending `BaseQuest` (`/src/quests/BaseQuest.js`).
  - Quests are grouped by saga/arc in `/src/quests/<Saga>/<Arc>.js`.
  - `/src/quests/index.js` auto-loads all quests for easy registration.
  - Quest utilities (validation, rewards, dialogue) are in `/src/quests/utils/`.
- **Commands:**
  - Discord slash commands are modularized in `/src/commands/` (e.g., `quest.js`, `profile.js`).
- **Database:**
  - Models and migrations live in `/src/database/models/` and `/src/database/migrations/`.
  - Use Sequelize for all DB access; models should be normalized and use unique IDs for quests (e.g., `eastblue_romancedawn_001`).
- **Config:**
  - Secrets (Discord token, DB URL) are in `.env` as `BOT_TOKEN` and `DATABASE_URL`.

## Developer Workflows
- **Start bot:** `npm start` (entry: `index.js`)
- **Install deps:** `npm install`
- **Add quest:** Create a new file in the appropriate saga folder, export a class extending `BaseQuest`.
- **DB migration:** Use Sequelize CLI or scripts for migrations in `/src/database/migrations/`.
- **Environment:** Use Railway for hosting and PostgreSQL; connection string in `.env`.

## Project Conventions
- **File/Folder Naming:**
  - Sagas/arcs/quests use PascalCase (e.g., `BaratieArc.js`).
  - Utilities and handlers use camelCase.
- **Class/Function Naming:**
  - Classes: PascalCase (e.g., `QuestManager`)
  - Functions/vars: camelCase
- **No hardcoding:** Use constants/env vars for config, not magic values.
- **Component Use:** Discord Components V2 (buttons, select menus, modals) are used via discord.js, no extra packages needed.

## Integration Points
- **Discord API:** All bot interactions via discord.js.
- **Database:** All persistent state via Sequelize/PostgreSQL.
- **Hosting:** Railway (deploys, DB, env vars).

## Examples
- See `/src/quests/EastBlueSaga/RomanceDawn.js` for a typical quest module.
- See `/src/quests/utils/` for reusable quest logic.
- See `/src/commands/quest.js` for command structure.

---

For new features, follow the modular, saga-driven structure and use Sequelize for all DB access. When in doubt, check `AGENT.md` for project philosophy and coding guidelines.
