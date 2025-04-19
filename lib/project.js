import { Project, ScriptTarget, ModuleKind } from 'ts-morph';
const compilerOptions = {
    target: ScriptTarget.ES2022,
    module: ModuleKind.NodeNext,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    esModuleInterop: true,
};
export const project = new Project({
    compilerOptions: {
        ...compilerOptions,
    },
});
//# sourceMappingURL=project.js.map