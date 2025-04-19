import { Project } from 'ts-morph';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator.js';
export declare function generateExtraEnum(project: Project, outputDir: string, enumName: string, enumConfig: {
    values: Array<string>;
}, config: PrismaClassDTOGeneratorConfig): void;
