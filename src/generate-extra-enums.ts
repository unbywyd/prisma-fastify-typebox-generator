import { Project } from 'ts-morph';
import path from 'path';
import { PrismaTypeboxSchemaConfig } from './prisma-generator.js';

export function generateExtraEnum(
    project: Project,
    outputDir: string,
    enumName: string,
    enumConfig: { values: Array<string> },
    config: PrismaTypeboxSchemaConfig,
) {
    const dirPath = path.resolve(outputDir, 'enums');
    const name = enumName;
    const filePath = path.resolve(dirPath, `${name}.enum.ts`);
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
        `export const ${name} = Type.String({`,
        `    enum: [${enumConfig.values.map(v => `'${v}'`).join(', ')}]`,
        `});`,
        `export type ${name}Type = Static<typeof ${name}>;`,
    ]);
}
