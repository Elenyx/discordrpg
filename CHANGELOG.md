# CHANGELOG

All notable changes to this project will be documented in this file. This project adheres to semantic versioning.

## [Unreleased]

- Added BaseQuest serialization hooks (toJSON/fromJSON) to standardize quest persistence.
- Persist per-player serialized quest instances to `players.active_quest_instance`.
- QuestManager uses quest class `fromJSON` when present and restores instances atomically.
- Wrapped quest completion (apply rewards + clear quest) inside a DB transaction.
- Defensive RewardHandler and tests for quest flows and instance restore.

## [1.0.0] - 2025-09-01

### Added
- Initial quest system refactor: DB-backed quest persistence (`active_quest`, `active_quest_data`, `active_quest_instance`).
- `RomanceDawn` quest with serialization hooks and interaction persistence.
- Sequelize migrations and `.sequelizerc` for CLI.
- Unit tests for accept/complete and instance restore.

### Changed
- QuestManager now restores serialized quest instances and prefers class `fromJSON` where available.

