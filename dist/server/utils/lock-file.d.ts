export declare class LockFile {
    lockPath: string;
    constructor();
    create(port: number, pid: number): Promise<void>;
    read(): Promise<{
        port: number;
        pid: number;
        timestamp: number;
    } | null>;
    remove(): Promise<void>;
    isServerRunning(): Promise<boolean>;
}
