import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morph';
import path from 'path';

export default function generateEnum(
  project: Project,
  outputDir: string,
  enumItem: PrismaDMMF.DatamodelEnum,
) {
  const dirPath = path.resolve(outputDir, 'enums');
  const filePath = path.resolve(dirPath, `${enumItem.name}.enum.ts`);
  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  });

  // Add imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports: ['Type', 'Static'],
  });

  // Add TypeBox enum
  sourceFile.addStatements([
    `export const ${enumItem.name} = Type.String({`,
    `    enum: [${enumItem.values.map(v => `'${v.name}'`).join(', ')}]`,
    `});`,
    `export type ${enumItem.name}Type = Static<typeof ${enumItem.name}>;`,
  ]);
}
