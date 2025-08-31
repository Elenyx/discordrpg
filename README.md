# discordrpg

One Piece themed RPG Discord bot.

Quick start

1. Install dependencies:

```powershell
npm install
```

2. Configure database:

Set `DATABASE_URL` environment variable for your DB or edit `config/config.js`.

3. Run migrations:

```powershell
$env:DATABASE_URL='postgresql://user:pass@host:port/dbname'; npm run db:migrate
```

4. Start bot:

```powershell
npm start
```

Development notes

- Quests are in `src/quests`. Each quest should extend `BaseQuest` and implement serialization hooks `toJSON()` and `static fromJSON()` for persistence.
- Player model now stores `active_quest`, `active_quest_data`, and `active_quest_instance`.
- CLI migrations are configured via `.sequelizerc` to use `src/database/migrations`.

Testing

```powershell
npm test
```