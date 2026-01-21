#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const port_manager_1 = require("./utils/port-manager");
const lock_file_1 = require("./utils/lock-file");
async function main() {
    // Use PORT env var for cloud deployment, otherwise find available port
    const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
    const portManager = new port_manager_1.PortManager();
    const port = envPort || await portManager.findAvailablePort(3847); // Default port
    const lockFile = new lock_file_1.LockFile();
    // Skip lock file in production/cloud environments
    if (!envPort) {
        await lockFile.create(port, process.pid);
    }
    const server = await (0, app_1.startServer)(port);
    console.log(`PMXT Sidecar Server running on http://localhost:${port}`);
    if (!envPort) {
        console.log(`Lock file created at ${lockFile.lockPath}`);
    }
    // Graceful shutdown
    const shutdown = async () => {
        console.log('\nShutting down gracefully...');
        server.close();
        await lockFile.remove();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
