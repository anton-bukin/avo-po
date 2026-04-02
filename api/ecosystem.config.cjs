module.exports = {
  apps: [{
    name: 'pspay-api',
    script: 'npx',
    args: 'tsx src/index.ts',
    cwd: '/root/avo-po/api',
    env: {
      PORT: 3100,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/pspay',
      JWT_SECRET: 'pspay-demo-secret-key-2026',
      NODE_ENV: 'production',
    },
  }],
};
