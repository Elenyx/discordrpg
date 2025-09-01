const pingCommand = require('../src/commands/ping.js');

// Minimal mocks for interaction and client
function makeInteraction() {
  let replied = false;
  const replies = [];
  return {
    isChatInputCommand: () => true,
    commandName: 'ping',
    replied: false,
    deferred: false,
    reply: async (payload) => { replied = true; replies.push({ type: 'reply', payload }); return { id: 'r1' }; },
    editReply: async (payload) => { replies.push({ type: 'edit', payload }); },
    channel: {
      send: async (payload) => { replies.push({ type: 'channel.send', payload }); return { id: 'm1', ...payload }; }
    },
    user: { id: 'user-1' },
    interaction: { commandName: 'ping' },
    replies,
  };
}

describe('ping command integration', () => {
  test('execute sends components and handleButton replies with latency', async () => {
    const interaction = makeInteraction();
    // Mock client
    const client = { ws: { ping: 123 } };

    // Call execute
    await pingCommand.execute(interaction, client);
    expect(interaction.replies.length).toBeGreaterThan(0);

    // Simulate a button interaction object
    const buttonInteraction = {
      isButton: () => true,
      customId: 'ping_button_v2',
      user: { id: 'user-1' },
      reply: async (p) => { buttonInteraction.replied = true; buttonInteraction.last = p; return {}; },
      editReply: async (p) => { buttonInteraction.edited = true; buttonInteraction.last = p; },
    };

    const handled = await pingCommand.handleButton(buttonInteraction, client);
    expect(handled).toBe(true);
    expect(buttonInteraction.last).toBeDefined();
    expect(typeof buttonInteraction.last.content === 'string' || buttonInteraction.edited === true).toBeTruthy();
  });
});
