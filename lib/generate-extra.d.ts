import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { PrismaClassDTOGeneratorConfig } from "./prisma-generator.js";
type ExtraField = Partial<PrismaDMMF.Field> & {
    name: string;
    type: string;
    isRequired?: boolean;
    relationName?: string;
};
export declare function generateExtraModel(config: PrismaClassDTOGeneratorConfig, project: Project, outputDir: string, modelName: string, modelConfig: {
    fields: Array<ExtraField>;
    type: "input" | "output";
}): void;
export {};
