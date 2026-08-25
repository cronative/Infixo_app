module.exports = {
  apps: [
    {
      name: "inflixo",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "max", // Uses all available CPU cores on your VPS
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G", // Auto-restart if a worker leaks memory > 1GB
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
