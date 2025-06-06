import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { PrismaTypeboxSchemaConfig, PrismaTypeboxSchemaListModelConfig } from "./prisma-generator.js";
export declare function generateListSchema(config: PrismaTypeboxSchemaListModelConfig, project: Project, dirPath: string, model: Partial<PrismaDMMF.Model>, mainConfig: PrismaTypeboxSchemaConfig, enums: Record<string, string[]>): {
    file: string;
    types: string[];
    exports: string[];
}[];
