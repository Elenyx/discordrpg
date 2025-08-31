// RaceSpecificSteps.js

const raceSteps = {
    Human: [
        {
            title: 'Human Resilience',
            description: 'As a human, you show exceptional determination that impresses Luffy.',
            actions: [
                {
                    type: 'button',
                    label: 'Show your fighting spirit',
                    customId: 'human_fight'
                }
            ]
        }
    ],
    Fishman: [
        {
            title: 'Fishman Abilities',
            description: 'Your aquatic abilities amaze Luffy, who can\'t swim due to his Devil Fruit.',
            actions: [
                {
                    type: 'button',
                    label: 'Demonstrate swimming skills',
                    customId: 'fishman_swim'
                },
                {
                    type: 'button',
                    label: 'Show fishman karate',
                    customId: 'fishman_karate'
                }
            ]
        }
    ],
    Mink: [
        {
            title: 'Electro Power',
            description: 'Your electro ability surprises Luffy, who finds it "super cool!"',
            actions: [
                {
                    type: 'button',
                    label: 'Demonstrate Electro',
                    customId: 'mink_electro'
                },
                {
                    type: 'button',
                    label: 'Show Sulong form (night only)',
                    customId: 'mink_sulong'
                }
            ]
        }
    ],
    Giant: [
        {
            title: 'Giant Strength',
            description: 'Your massive size and strength impress Luffy greatly.',
            actions: [
                {
                    type: 'button',
                    label: 'Lift something heavy',
                    customId: 'giant_strength'
                }
            ]
        }
    ],
    Skypiean: [
        {
            title: 'Wings of the Sky',
            description: 'Your small wings and knowledge of the sky islands fascinate Luffy.',
            actions: [
                {
                    type: 'button',
                    label: 'Tell stories of Skypiea',
                    customId: 'skypiea_stories'
                }
            ]
        }
    ]
};

module.exports = raceSteps;
