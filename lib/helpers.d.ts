import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { DecoratorStructure, OptionalKind, Project, SourceFile } from 'ts-morph';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator.js';
export declare const generateModelsIndexFile: (prismaClientDmmf: PrismaDMMF.Document, project: Project, outputDir: string, config: PrismaClassDTOGeneratorConfig, generatedListSchemas?: {
    file: string;
    exports: string[];
}[]) => void;
export declare const shouldImportPrisma: (fields: PrismaDMMF.Field[]) => boolean;
export declare const shouldImportHelpers: (fields: PrismaDMMF.Field[]) => boolean;
export declare const getTSDataTypeFromFieldType: (field: PrismaDMMF.Field, config: PrismaClassDTOGeneratorConfig) => string;
export declare const getDecoratorsByFieldType: (field: PrismaDMMF.Field, config: PrismaClassDTOGeneratorConfig) => OptionalKind<DecoratorStructure>[];
export declare const getDecoratorsImportsByType: (field: PrismaDMMF.Field) => unknown[];
export declare const generateClassValidatorImport: (sourceFile: SourceFile, validatorImports: Array<string>) => void;
export declare const generatePrismaImport: (sourceFile: SourceFile) => void;
export declare const generateRelationImportsImport: (sourceFile: SourceFile, relationImports: Array<string>) => void;
export declare const generateHelpersImports: (sourceFile: SourceFile, helpersImports: Array<string>) => void;
export declare const generateEnumImports: (sourceFile: SourceFile, fields: PrismaDMMF.Field[], config: PrismaClassDTOGeneratorConfig) => void;
export declare function generateEnumsIndexFile(sourceFile: SourceFile, enumNames: string[]): void;
export declare const generateClassTransformerImport: (sourceFile: SourceFile, transformerImports: Array<string>) => void;
export type FieldDirectives = {
    filterable: boolean;
    listable: boolean;
    pagination: boolean;
    orderable: boolean;
    exclude: 'input' | 'output';
};
export declare function getFieldDirectives(documentation: string | undefined): FieldDirectives;
export declare function generatePreloadEntitiesFile(prismaClientDmmf: PrismaDMMF.Document, project: Project, outputDir: string, config: PrismaClassDTOGeneratorConfig, generatedListSchemas: {
    file: string;
    exports: string[];
}[]): void;
