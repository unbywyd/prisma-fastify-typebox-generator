import { Project, ScriptTarget, ModuleKind, CompilerOptions } from 'ts-morph';

const compilerOptions: CompilerOptions = {
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
