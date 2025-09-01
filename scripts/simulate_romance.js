// Simple simulation harness for RomanceDawn quest flow
const RomanceDawn = require('../src/quests/EastBlueSaga/RomanceDawn/index.js');

function makeInteraction(customId, values) {
    return {
        customId,
        values,
        replied: false,
        deferred: false,
        async update(payload) {
            console.log(`interaction.update called for ${customId}`);
            console.log(JSON.stringify(payload, null, 2));
            this.replied = true;
        },
        async reply(payload) {
            console.log(`interaction.reply called for ${customId}`);
            console.log(JSON.stringify(payload, null, 2));
            this.replied = true;
        },
        async followUp(payload) {
            console.log(`interaction.followUp called for ${customId}`);
            console.log(JSON.stringify(payload, null, 2));
        }
    };
}

(async () => {
    const player = {
        id: 'sim-player-1',
        level: 1,
        race: 'Human',
        stats: {},
        async save() { console.log('player.save() called'); }
    };

    const quest = new RomanceDawn(player);
    console.log('Starting quest...');
    const startMsg = await quest.start();
    console.log('start() returned:');
    console.log(JSON.stringify(startMsg, null, 2));

    // Simulate user choosing 'search_barrel'
    console.log('\n--- Simulate pressing search_barrel ---');
    const int1 = makeInteraction('search_barrel');
    await quest.handleInteraction(int1);

    // After the handler, quest.currentStep should have advanced and the interaction
    // payload should include a Continue button with customId 'romance_next::<step>'
    console.log('\nCurrent step after search_barrel:', quest.currentStep);

    // Simulate pressing the Continue button
    const continueCustom = `romance_next::${quest.currentStep}`;
    console.log(`\n--- Simulate pressing continue (${continueCustom}) ---`);
    const int2 = makeInteraction(continueCustom);
    await quest.handleInteraction(int2);

    console.log('\nFinal currentStep:', quest.currentStep);
    console.log('Player.activeQuestInstance:', JSON.stringify(player.activeQuestInstance, null, 2));
})();
