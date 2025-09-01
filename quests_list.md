# Quests and Mini-Games (generated 2025-09-01)

## Summary

This document lists the current quest definitions, their step titles, available actions (buttons/selects and customIds), the mini-games used, and other quest-related utilities and files in this repository.

## Source files

- `src/quests/index.js` - dynamic loader for saga folders
- `src/quests/QuestManager.js` - registers quests and handles quest commands (accept/current/complete)
- `src/quests/BaseQuest.js` - abstract base class for quests
- `src/quests/utils/MiniGames.js` - mini-game implementations
- `src/quests/utils/RewardHandler.js` - handles giving rewards (used by `QuestManager`)
- `src/quests/utils/QuestValidator.js` - quest validation utilities
- `src/quests/utils/QuestDialogue.js` - dialog helpers for quests
 `src/quests/EastBlueSaga/RomanceDawn/index.js` - Romance Dawn quest implementation
 **EastBlueSaga**
  - `RomanceDawn` — `src/quests/EastBlueSaga/RomanceDawn/index.js`
 The quest class is exported from `src/quests/EastBlueSaga/RomanceDawn/index.js` and registered in `src/quests/QuestManager.js`.
 Links (quick)

 RomanceDawn: `src/quests/EastBlueSaga/RomanceDawn/index.js`

- **AlabastaSaga**
  - (no `.js` quest files present)

- **SkypieaSaga**
  - (no `.js` quest files present)

## Romance Dawn (`romance_dawn`)

### Basic info

- `id`: `romance_dawn`
- `title` / `name`: "Romance Dawn"
- `description`: "Begin your adventure in the East Blue and meet your first crewmates"
- Rewards (from `calculateRewards()` in the quest):
  - `100` berries
  - `50` EXP
  - `items`: [`Straw Hat`]

The quest class is exported from `src/quests/EastBlueSaga/RomanceDawn.js` and registered in `src/quests/QuestManager.js`.

### How steps are built

`RomanceDawn.generateSteps()` returns: `baseSteps` + `raceSteps[this.player.race]` (from `RaceSpecificSteps.js`) + `zoroSteps`.

### Base steps (defined in `RomanceDawn`)

1. **The Barrel Boy**
   - Description: "You spot a mysterious barrel floating in the ocean. What do you do?"
   - Actions:
     - Button — label: "Investigate the barrel", customId: `investigate_barrel`
     - Button — label: "Ignore it and keep sailing", customId: `ignore_barrel`

2. **Meeting Luffy**
   - Description: "A boy with stretchy powers emerges from the barrel!"
   - Actions:
     - Button — label: "Offer him food", customId: `offer_food`
     - Button — label: "Ask who he is", customId: `ask_identity`

3. **Luffy's Dream**
   - Description: "Luffy says he's looking for a crew to become King of the Pirates!"
   - Actions:
     - Button — label: "Join his crew", customId: `join_crew`
     - Button — label: "Politely decline", customId: `decline_crew`

### Race-specific steps (`src/quests/EastBlueSaga/RaceSpecificSteps.js`)

- `Human`:
  - "Human Resilience" — button: `human_fight`

- `Fishman`:
  - "Fishman Abilities" — buttons: `fishman_swim`, `fishman_karate`

- `Mink`:
  - "Electro Power" — buttons: `mink_electro`, `mink_sulong`

- `Giant`:
  - "Giant Strength" — button: `giant_strength`

- `Skypiean`:
  - "Wings of the Sky" — button: `skypiea_stories`

### Zoro-related steps (appended after race steps)

1. **The Cursed Swordsman**
   - Actions: button `investigate_marine`

2. **Roronoa Zoro**
   - Actions: select menu `free_zoro` with options: `free_yes`, `free_no`

3. **The Challenge**
   - Actions: buttons `fight_morgan`, `distract_morgan`

### Interaction behavior notes

- `investigate_barrel`: advances `currentStep` and updates player saved instance
- `ignore_barrel`: sets `state` to `available` and removes components (ends interaction)
- `free_zoro`: branch — `free_yes` advances normally; `free_no` advances differently (skips steps)
- `fight_morgan`: triggers a mini-game defined in `src/quests/utils/MiniGames.js`

## Mini-games (`src/quests/utils/MiniGames.js`)

- `morganFightMiniGame(player, basePower = 50)`
  - Computes `playerPower = player.level * 10`
  - Applies race bonuses: `Giant` +20, `Fishman` +15
  - Returns success if `Math.random() * playerPower > basePower * 0.7`
  - Used by: `RomanceDawn` on `fight_morgan` interactions

## Other utilities

- `src/quests/utils/RewardHandler.js` — applies rewards when quests complete (used by `QuestManager`)
- `src/quests/utils/QuestValidator.js` — helper functions to validate quest prerequisites or progress
- `src/quests/utils/QuestDialogue.js` — formatting helpers for quest messages

## Persistence & lifecycle notes

- `BaseQuest` provides `toJSON()` and `fromJSON()` hooks for serialization and hydration.
- `RomanceDawn` overrides `toJSON()` and `fromJSON()` to include versioning.
- `QuestManager` persists minimal quest data on the player object: `activeQuest`, `activeQuestData`, and `activeQuestInstance`. If the `player` object exposes `.save()`, it will be called to persist changes.

## Links (quick)

- RomanceDawn: `src/quests/EastBlueSaga/RomanceDawn.js`
- Race steps: `src/quests/EastBlueSaga/RaceSpecificSteps.js`
- Mini-games: `src/quests/utils/MiniGames.js`
- QuestManager: `src/quests/QuestManager.js`
- BaseQuest: `src/quests/BaseQuest.js`

## Next steps (optional)

- Convert this into a machine-readable JSON/CSV of all quests/steps.
- Add in-file anchors for per-step deep links.
- Auto-generate a developer-focused README for adding new quests and mini-games.

---

End of generated report.
