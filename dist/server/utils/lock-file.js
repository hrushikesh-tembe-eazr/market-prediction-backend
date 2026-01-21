"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockFile = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class LockFile {
    constructor() {
        this.lockPath = path.join(os.homedir(), '.pmxt', 'server.lock');
    }
    async create(port, pid) {
        await fs.mkdir(path.dirname(this.lockPath), { recursive: true });
        await fs.writeFile(this.lockPath, JSON.stringify({ port, pid, timestamp: Date.now() }, null, 2));
    }
    async read() {
        try {
            const data = await fs.readFile(this.lockPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async remove() {
        try {
            await fs.unlink(this.lockPath);
        }
        catch {
            // Ignore errors if file doesn't exist
        }
    }
    async isServerRunning() {
        const lock = await this.read();
        if (!lock)
            return false;
        // Check if process is still alive
        try {
            process.kill(lock.pid, 0); // Signal 0 checks existence without killing
            return true;
        }
        catch {
            // Process doesn't exist, remove stale lock file
            await this.remove();
            return false;
        }
    }
}
exports.LockFile = LockFile;
