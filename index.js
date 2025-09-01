const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, Player } = require('./database');
const questManager = require('./src/quests/QuestManager');
const { consumeToken } = require('./src/utils/tokenStore');
const { writeLog } = require('./src/utils/fileLogger');
const logger = require('./src/utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize logger with the client once we have it available
try { logger.init(client); } catch (e) { console.error('Failed to init logger', e); }

// Load events
const eventsPath = path.join(__dirname, 'src', 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src', 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.on('interactionCreate', async interaction => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        try { await logger.logError('Slash Command Error', error, { userId: interaction.user.id, command: interaction.commandName, guildId: interaction.guildId, channelId: interaction.channelId }); } catch (err) { console.error('Logger failed', err); }
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
        }
      }
      return;
    }

    // Component interactions (buttons / select menus) -> route to active quest if any
    if ((interaction.isButton && interaction.isButton()) || (interaction.isStringSelectMenu && interaction.isStringSelectMenu())) {
      // Quick-path: let known central handlers (non-collector) process some customIds first.
      try {
        const rawId = interaction.customId || (interaction.values && interaction.values[0]) || null;
        // If this is the ping button, dispatch directly to the ping command handler if present
        if (rawId && rawId.startsWith('ping_button_v2')) {
          const pingCommand = client.commands.get('ping');
          if (pingCommand && typeof pingCommand.handleButton === 'function') {
            try {
              const handled = await pingCommand.handleButton(interaction, client);
              if (handled) return; // already handled
            } catch (err) { console.error('ping handler failed', err); }
          }
        }
      } catch (e) {
        // non-fatal: continue to regular routing
      }
      // If this interaction's message was created as a reply to a slash command, assume
      // the originating command (or its collector) should handle it and skip global routing.
      // This avoids consuming interactions that are part of ephemeral command flows like `/start`.
      try {
        const originatingCommand = interaction.message?.interaction?.commandName;
        if (originatingCommand) {
          // Some slash commands (for example `/start`) create ephemeral flows and collectors
          // that should retain ownership of component interactions. Only skip global routing for
          // those known collector-driven commands. Allow routing for quest interactions (e.g. `/quest accept`).
          const collectorCommands = new Set(['start', 'ping', 'profile', 'test-button']);
          if (collectorCommands.has(originatingCommand)) {
            console.info('Component interaction originates from command', originatingCommand, '- skipping global handler');
            return;
          }
          // Otherwise, allow global routing to handle the component interaction.
        }
      } catch (e) {
        // Non-fatal: continue to global handling if we can't inspect message.interaction
      }
      // Diagnostic info for debugging stuck interactions
      let incomingCustomId = interaction.customId || (interaction.values && interaction.values[0]) || null;
      // customId may be extended with a transient token: e.g. "fight_morgan::abc123"
      let transientToken = null;
      if (incomingCustomId && incomingCustomId.includes('::')) {
        const parts = incomingCustomId.split('::');
        incomingCustomId = parts[0];
        transientToken = parts[1];
      }
      const tokenPayload = transientToken ? consumeToken(transientToken) : null;
      if (tokenPayload) {
        interaction.tokenPayload = tokenPayload;
        interaction.transientToken = transientToken;
      }
  console.info(`Component interaction received: user=${interaction.user.id} customId=${incomingCustomId} token=${transientToken} guild=${interaction.guildId} channel=${interaction.channelId} message=${interaction.message?.id}`);
  writeLog('interactions.log', `user=${interaction.user.id} customId=${incomingCustomId} token=${transientToken} guild=${interaction.guildId} channel=${interaction.channelId} message=${interaction.message?.id}`);
      // Try to load player record by Discord ID
      let player = null;
      try {
        if (Player && typeof Player.findOne === 'function') {
          player = await Player.findOne({ where: { discordId: interaction.user.id } });
        }
      } catch (e) {
        console.error('Failed to load player for interaction:', e);
        try { await logger.logWarning('Player Load Failed', 'Failed to load player for interaction', { userId: interaction.user.id, error: e instanceof Error ? e.message : String(e) }); } catch (err) { console.error('Logger failed', err); }
      }

      if (!player) {
        // No DB-backed player found; log details to help diagnose why
        const warnPayload = {
          discordId: interaction.user.id,
          customId: incomingCustomId,
          tokenPayload: tokenPayload || null,
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          messageId: interaction.message?.id,
        };
        console.warn('No player record found for interaction', warnPayload);
        writeLog('interactions.log', `NO_PLAYER ${JSON.stringify(warnPayload)}`);

        // If there is a valid transient token payload, construct a transient player
        // object so quest handlers can operate for the duration of the interaction.
        if (tokenPayload) {
          console.info('Using transient token to construct temporary player for interaction', { discordId: interaction.user.id, token: transientToken });
          player = {
            id: null,
            discordId: tokenPayload.discordId || interaction.user.id,
            race: tokenPayload.race || 'Human',
            origin: tokenPayload.origin || null,
            dream: tokenPayload.dream || null,
            stats: tokenPayload.stats || { hp: 10, atk: 5, def: 5 },
            activeQuest: tokenPayload.questId || null,
            activeQuestInstance: tokenPayload.activeQuestInstance || null,
            save: async function () { /* transient no-op */ },
          };
        } else {
          // Inform user how to start a quest (ephemeral reply)
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({ content: 'No player profile found. Use the quest commands to start (e.g. /quest accept).', ephemeral: true });
            } else if (interaction.deferred) {
              await interaction.editReply({ content: 'No player profile found. Use the quest commands to start (e.g. /quest accept).' });
            }
          } catch (e) { console.error(e); try { await logger.logWarning('Interaction Reply Failed', 'Failed to inform user there is no player profile', { userId: interaction.user.id, customId: incomingCustomId, guildId: interaction.guildId, channelId: interaction.channelId, error: e instanceof Error ? e.message : String(e) }); } catch (err) { console.error('Logger failed', err); } }
          return;
        }
      }

      // Restore current quest instance for player and forward the interaction
      try {
        const quest = questManager.getCurrentQuest(player);
        if (!quest) {
          console.warn('Player has no active quest for component interaction', {
            discordId: interaction.user.id,
            activeQuestField: player.activeQuest || null,
            customId: incomingCustomId,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
          });

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'You are not currently on a quest.', ephemeral: true });
          } else if (interaction.deferred) {
            await interaction.editReply({ content: 'You are not currently on a quest.' });
          }
          return;
        }

        await quest.handleInteraction(interaction);
        } catch (e) {
        console.error('Error routing component interaction to quest:', e);
        try { await logger.logError('Component Interaction Error', e, { userId: interaction.user.id, customId: incomingCustomId, token: transientToken, guildId: interaction.guildId, channelId: interaction.channelId, messageId: interaction.message?.id, playerId: player && player.id ? player.id : null }); } catch (err) { console.error('Logger failed', err); }
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'There was an error handling that interaction.', ephemeral: true });
        } else if (interaction.deferred) {
          try { await interaction.editReply({ content: 'There was an error handling that interaction.' }); } catch (err) { console.error(err); try { await logger.logWarning('EditReply Failed', 'Failed to edit reply after interaction error', { userId: interaction.user.id, error: err instanceof Error ? err.message : String(err) }); } catch (er) { console.error('Logger failed', er); } }
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error in interactionCreate handler:', error);
    try { if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true }); } catch (e) {}
  }
});


// Sync DB and then login
sequelize.sync()
  .then(() => {
    console.log('Database synced.');
    client.login(process.env.BOT_TOKEN);
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try { await logger.logError('Unhandled Rejection', reason, { promise: String(promise) }); } catch (e) { console.error('Logger failed', e); }
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try { await logger.logError('Uncaught Exception', error); } catch (e) { console.error('Logger failed', e); }
});