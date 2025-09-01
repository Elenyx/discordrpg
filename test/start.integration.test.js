const startCommand = require('../src/commands/start');
const { Player } = require('../database');

// Simple mock interaction factory
function makeInteraction() {
  let replied = false;
  const channel = {
    awaitMessageComponent: jest.fn(),
  };
  return {
    user: { id: 'test-user' },
    channel,
    reply: jest.fn(async (opts) => { replied = true; return; }),
    deferred: false,
    replied: replied,
    options: {
      get: () => null,
    }
  };
}

describe('/start integration path', () => {
  beforeAll(() => {
    // Mock Player.findOne to return null initially, and Player.create to succeed
    jest.spyOn(Player, 'findOne').mockImplementation(async () => null);
    jest.spyOn(Player, 'create').mockImplementation(async (obj) => ({ ...obj }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('creates a player when selections are made', async () => {
    const interaction = makeInteraction();

    // Mock awaiting components in sequence for race/origin/dream/confirm
    interaction.channel.awaitMessageComponent
      .mockResolvedValueOnce({ values: ['Human'], update: jest.fn() })
      .mockResolvedValueOnce({ values: ['East Blue'], update: jest.fn() })
      .mockResolvedValueOnce({ values: ['Pirate King'], update: jest.fn() })
      .mockResolvedValueOnce({ customId: 'confirm_start', update: jest.fn() });

    await startCommand.execute(interaction);

    expect(Player.create).toHaveBeenCalled();
  });
});
