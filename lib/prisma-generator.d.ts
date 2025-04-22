import { PrismaClassDTOGeneratorField } from './generate-schema.js';
export type PrismaClassDTOGeneratorModelConfig = {
    excludeFields?: string[];
    excludeModels?: string[];
    excludeIdFields?: boolean;
    excludeDateAtFields?: boolean;
    makeDateFieldsOptional?: boolean;
    excludeIdRelationFields?: boolean;
    excludeModelFields?: {
        [modelName: string]: string[];
    };
    makeFieldsOptional?: boolean;
    includeModelFields?: {
        [modelName: string]: Array<string | PrismaClassDTOGeneratorField>;
    };
    includeRelations?: boolean;
    extendModels?: {
        [modelName: string]: {
            fields: Array<PrismaClassDTOGeneratorField>;
        };
    };
};
export type PrismaClassDTOGeneratorListModelConfig = {
    pagination?: true;
    outputModelName?: string;
    filters?: Array<string | PrismaClassDTOGeneratorField>;
    orderable?: boolean | Array<string>;
};
export type PrismaClassDTOGeneratorConfig = {
    input: PrismaClassDTOGeneratorModelConfig;
    output: PrismaClassDTOGeneratorModelConfig;
    excludeModels?: string[];
    strictMode?: boolean;
    lists?: {
        [modelName: string]: PrismaClassDTOGeneratorListModelConfig;
    };
    extra?: {
        enums?: {
            [enumName: string]: {
                values: Array<string>;
            };
        };
        models: {
            [modelName: string]: {
                type: "input" | "output";
                fields: Array<PrismaClassDTOGeneratorField>;
            };
        };
    };
};
export type GeneratorOptions = {
    schemaPath?: string;
    cwd?: string;
    output?: string;
};
export declare function generate(options: GeneratorOptions): Promise<void>;
