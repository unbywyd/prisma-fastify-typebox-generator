import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { Project, SourceFile } from 'ts-morph';
import { PrismaTypeboxSchemaConfig } from './prisma-generator.js';
export declare const generateModelsIndexFile: (prismaClientDmmf: PrismaDMMF.Document, project: Project, outputDir: string, config: PrismaTypeboxSchemaConfig, generatedListSchemas?: {
    file: string;
    exports: string[];
    types: string[];
}[]) => void;
export declare function getTypeBoxType(field: PrismaDMMF.Field, schemaType?: 'Input' | 'Output'): string;
export declare const generateEnumImports: (sourceFile: SourceFile, fields: PrismaDMMF.Field[], config: PrismaTypeboxSchemaConfig) => void;
export declare function generateEnumsIndexFile(sourceFile: SourceFile, enumNames: string[]): void;
export type FieldDirectives = {
    filterable: boolean;
    listable: boolean;
    pagination: boolean;
    orderable: boolean;
    exclude: 'input' | 'output';
};
export declare function getFieldDirectives(documentation: string | undefined): FieldDirectives;
export declare function generatePreloadEntitiesFile(prismaClientDmmf: PrismaDMMF.Document, project: Project, outputDir: string, config: PrismaTypeboxSchemaConfig, generatedListSchemas: {
    file: string;
    exports: string[];
}[]): void;
