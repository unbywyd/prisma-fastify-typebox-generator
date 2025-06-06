import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morph';
import { PrismaTypeboxSchemaConfig } from './prisma-generator.js';
export type PrismaField = PrismaDMMF.Field & {
    isExtra?: boolean;
    isList?: boolean;
    options?: Record<string, any>;
};
export default function generateClass(config: PrismaTypeboxSchemaConfig, project: Project, outputDir: string, model: PrismaDMMF.Model, mainConfig: PrismaTypeboxSchemaConfig, foreignKeyMap: Map<string, string>, refs: Array<{
    type: 'input' | 'output';
    name: string;
}>, enums: Record<string, string[]>): Promise<string[]>;
