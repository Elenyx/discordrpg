module.exports = {
  // Database environments
  development: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:SPXAitKWXJYdfLbKekjgbcLIYRfcMEkY@interchange.proxy.rlwy.net:43508/railway',
    dialect: 'postgres'
  },
  test: {
    url: process.env.DATABASE_URL || 'sqlite::memory:',
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres'
  },

  // Game-level configuration (tunable by designers)
  leveling: {
    baseExp: 100,
    power: 1.25
  },

  // Per-item icon mapping (external URLs). Designers can extend this map.
  itemIcons: {
    'Straw Hat': 'https://i.imgur.com/7bKXQ1N.png',
    'Sword': 'https://i.imgur.com/1XKzQ1A.png'
  }
};
