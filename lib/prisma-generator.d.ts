import { PrismaField } from './generate-schema.js';
export type PrismaTypeboxSchemaModelConfig = {
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
        [modelName: string]: Array<string | PrismaField>;
    };
    includeRelations?: boolean;
    extendModels?: {
        [modelName: string]: {
            fields: Array<PrismaField>;
        };
    };
};
export type PrismaTypeboxSchemaListModelConfig = {
    pagination?: true;
    outputModelName?: string;
    filters?: Array<string | PrismaField> | true;
    orderable?: boolean | Array<string>;
};
export type PrismaTypeboxSchemaConfig = {
    input: PrismaTypeboxSchemaModelConfig;
    output: PrismaTypeboxSchemaModelConfig;
    excludeModels?: string[];
    strictMode?: boolean;
    useBaseListFields?: Array<string>;
    lists?: {
        [modelName: string]: PrismaTypeboxSchemaListModelConfig;
    } | boolean;
    extra?: {
        enums?: {
            [enumName: string]: {
                values: Array<string>;
            };
        };
        models: {
            [modelName: string]: {
                type: "input" | "output";
                fields: Array<PrismaField>;
            };
        };
    };
};
export type GeneratorOptions = {
    schemaPath?: string;
    cwd?: string;
    output?: string;
};
export declare function generateConfig(cwd?: string): Promise<void>;
export declare function generate(options: GeneratorOptions): Promise<void>;
