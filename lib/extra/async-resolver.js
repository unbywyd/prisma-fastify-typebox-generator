export class AsyncResolver {
    static tasks = [];
    static addTask(task) {
        this.tasks.push(task);
    }
    static async resolveAll() {
        if (this.tasks.length > 0) {
            await Promise.all(this.tasks);
        }
    }
}
//# sourceMappingURL=async-resolver.js.map