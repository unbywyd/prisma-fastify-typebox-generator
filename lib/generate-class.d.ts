import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morph';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator.js';
export type PrismaClassDTOGeneratorField = PrismaDMMF.Field & {
    isExtra?: boolean;
    isList?: boolean;
    options?: Record<string, any>;
};
export default function generateClass(config: PrismaClassDTOGeneratorConfig, project: Project, outputDir: string, model: PrismaDMMF.Model, mainConfig: PrismaClassDTOGeneratorConfig, foreignKeyMap: Map<string, string>, refs: Array<{
    type: 'input' | 'output';
    name: string;
}>): Promise<string[]>;
