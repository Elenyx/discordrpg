// src/events/ready.js
module.exports = (client) => {
  console.log(`Logged in as ${client.user.tag}! Ready to set sail!`);
  client.user.setActivity('the Grand Line', { type: 'WATCHING' }); // Types: PLAYING, WATCHING, LISTENING, COMPETING
};