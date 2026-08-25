module.exports = {
  apps: [
    {
      name: "inflixo",
      script: "npm",
      args: "start",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
