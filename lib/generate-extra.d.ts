import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { PrismaTypeboxSchemaConfig } from "./prisma-generator.js";
type ExtraField = Partial<PrismaDMMF.Field> & {
    name: string;
    type: string;
    isRequired?: boolean;
    relationName?: string;
};
export declare function generateExtraModel(config: PrismaTypeboxSchemaConfig, project: Project, outputDir: string, modelName: string, modelConfig: {
    fields: Array<ExtraField>;
    type: "input" | "output";
}): void;
export {};
