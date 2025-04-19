export declare class AsyncResolver {
    private static tasks;
    static addTask(task: Promise<any>): void;
    static resolveAll(): Promise<void>;
}
