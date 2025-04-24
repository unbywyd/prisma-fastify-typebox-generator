import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { PrismaClassDTOGeneratorConfig, PrismaClassDTOGeneratorListModelConfig } from "./prisma-generator.js";
export declare function generateListSchema(config: PrismaClassDTOGeneratorListModelConfig, project: Project, dirPath: string, model: Partial<PrismaDMMF.Model>, mainConfig: PrismaClassDTOGeneratorConfig, enums: Record<string, string[]>): {
    file: string;
    types: string[];
    exports: string[];
}[];
