// src/events/ready.js
module.exports = (client) => {
  // Set bot activity status
        client.user.setActivity('the Grand Line 🏴‍☠️', { 
            type: ActivityType.Watching 
        });

        // Log some statistics
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
                console.log(`[BOT] Monitoring ${totalUsers} total users across all guilds`);
        }