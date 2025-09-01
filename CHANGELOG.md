# CHANGELOG

All notable changes to this project will be documented in this file. This project adheres to semantic versioning.

## [Unreleased]

- Added BaseQuest serialization hooks (toJSON/fromJSON) to standardize quest persistence.
- Persist per-player serialized quest instances to `players.active_quest_instance`.
- QuestManager uses quest class `fromJSON` when present and restores instances atomically.
- Wrapped quest completion (apply rewards + clear quest) inside a DB transaction.
- Defensive RewardHandler and tests for quest flows and instance restore.
 - Route component interactions (buttons/selects) to active quest instances via `index.js`.
 - Added ephemeral replies and editReply fallbacks for component interactions when player or quest not found.
 - Implemented transient retry tokens for button flows to avoid DB race windows (`src/utils/tokenStore.js`).
 - Add retry limits and token rotation for the `fight_morgan` mini-game to prevent infinite retries.
 - Added file logging for interactions (`logs/interactions.log`) via `src/utils/fileLogger.js`.
 - Added `quest-debug` slash command for developers to dump a player's quest payload (ephemeral).
 - Improved diagnostic logs when component interactions arrive to help debug stuck buttons.
 - Added centralized in-Discord error/success logger with configurable channel (`src/utils/logger.js`).
 - Added `/admin` command for administrators to set/get/test the error log channel (`src/commands/admin.js`).
 - Added `settings` DB model to persist error log channel (`src/database/models/setting.js`).
 - Implemented transient-token propagation from `/start` components to allow global handlers to authenticate command-originated interactions.
 - Added `safeUpdate` fallbacks for quest interaction updates to avoid Unknown interaction errors when interactions expire (`src/quests/*`).
 - Added an integration test for `/start` (Jest) and updated test harness (`test/start.integration.test.js`).
 - Updated `index.js` to initialize logger and route unhandled rejections/uncaught exceptions to the logger.
 - Fixed model attribute/column usage inconsistencies (use `discordId` model attribute in code).


## [1.0.0] - 2025-09-01

### Added
- Initial quest system refactor: DB-backed quest persistence (`active_quest`, `active_quest_data`, `active_quest_instance`).
- `RomanceDawn` quest with serialization hooks and interaction persistence.
- Sequelize migrations and `.sequelizerc` for CLI.
- Unit tests for accept/complete and instance restore.

### Changed
- QuestManager now restores serialized quest instances and prefers class `fromJSON` where available.

