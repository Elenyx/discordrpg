module.exports = {
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
  }
};
