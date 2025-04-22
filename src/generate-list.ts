import { Project } from "ts-morph";
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { generateEnumImports, getFieldDirectives, getTSDataTypeFromFieldType } from "./helpers.js";
import { PrismaClassDTOGeneratorField } from "./generate-schema.js";
import { PrismaClassDTOGeneratorConfig, PrismaClassDTOGeneratorListModelConfig } from "./prisma-generator.js";

function getTypeBoxType(field: PrismaDMMF.Field | PrismaClassDTOGeneratorField): string {
    let type = field.type;
    let isOptional = true; // List fields are always optional

    switch (field.type) {
        case 'Int':
        case 'Float':
            type = 'Type.Number()';
            break;
        case 'DateTime':
            type = 'DateString()';
            break;
        case 'String':
            type = 'Type.String()';
            break;
        case 'Boolean':
            type = 'Type.Boolean()';
            break;
        case 'Decimal':
            type = 'Type.Number()';
            break;
        case 'Json':
            type = 'Type.Any()';
            break;
        case 'Bytes':
            type = 'Type.String()';
            break;
        case 'File':
            type = 'Type.String({ format: "binary" })';
            break;
    }

    if (field.isList) {
        type = `Type.Array(${type})`;
    }

    if (isOptional) {
        type = `Type.Optional(${type})`;
    }

    return type;
}

export function generateListSchema(
    config: PrismaClassDTOGeneratorListModelConfig,
    project: Project,
    dirPath: string,
    model: Partial<PrismaDMMF.Model>,
    mainConfig: PrismaClassDTOGeneratorConfig,
): { file: string; exports: string[] }[] {
    const modelName = model.name;
    const itemsModelName = config?.outputModelName ? config?.outputModelName : `Output${modelName}`;

    const filePath = path.resolve(dirPath, `List${modelName}Schema.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });

    // Add TypeBox imports
    sourceFile.addImportDeclaration({
        moduleSpecifier: '@sinclair/typebox',
        namedImports: ['Type', 'Static'],
    });

    const hasDateTimeFields = model.fields?.some(field => field.type === 'DateTime') || false;
    if (hasDateTimeFields) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: '@tsdiapi/server',
            namedImports: ['DateString'],
        });
    }

    const directives = getFieldDirectives(model?.documentation);
    const isOrderable = (config?.orderable === true || Array.isArray(config?.orderable) && config?.orderable?.length) || directives.orderable;
    const hasPagination = config?.pagination || directives.pagination;

    const orderableFields = Array.isArray(config?.orderable) ? config?.orderable : [];

    const filters = config?.filters || [];
    const validFields = model.fields?.filter((field) => {
        const directives = getFieldDirectives(field.documentation);
        return directives.filterable || filters.find((filter) => typeof filter === 'string' ? filter === field.name : filter.name === field.name);
    }) || [];

    // Generate QueryList schema
    const queryListProperties = [
        ...(hasPagination ? [
            `  take: Type.Optional(Type.Number()),`,
            `  skip: Type.Optional(Type.Number()),`,
        ] : []),
        ...validFields.map(field => {
            const type = getTypeBoxType(field);
            return `  ${field.name}: ${type},`;
        }),
    ];

    const modelFieldsKeys = model.fields?.map((field) => field.name) || [];
    const customFields = filters.filter((filter) => typeof filter !== 'string' && !modelFieldsKeys.includes(filter.name)) as Array<PrismaClassDTOGeneratorField>;

    generateEnumImports(sourceFile, customFields, mainConfig);

    customFields.forEach((field) => {
        const type = getTypeBoxType(field);
        queryListProperties.push(`  ${field.name}: ${type},`);
    });

    if (isOrderable) {
        if (orderableFields?.length) {
            queryListProperties.push(`  orderBy: Type.Optional(Type.String({ enum: [${orderableFields.map(el => `"${el}"`)?.join(',')}] })),`);
        } else {
            queryListProperties.push(`  orderBy: Type.Optional(Type.String()),`);
        }
        queryListProperties.push(`  orderDirection: Type.Optional(Type.String({ enum: ['asc', 'desc'] })),`);
    }

    // Generate OutputList schema
    const outputListProperties = [
        ...(hasPagination ? [
            `  take: Type.Optional(Type.Number()),`,
            `  skip: Type.Optional(Type.Number()),`,
        ] : []),
        `  total: Type.Optional(Type.Number()),`,
        `  items: Type.Array(Type.Ref('${itemsModelName}Schema')),`,
    ];

    sourceFile.addStatements([
        `export const QueryList${modelName}Schema = Type.Object({`,
        ...queryListProperties,
        `}, {`,
        `  $id: 'QueryList${modelName}Schema',`,
        `});`,
        ``,
        `export type QueryList${modelName}SchemaType = Static<typeof QueryList${modelName}Schema>;`,
        ``,
        `export const OutputList${modelName}Schema = Type.Object({`,
        ...outputListProperties,
        `}, {`,
        `  $id: 'OutputList${modelName}Schema',`,
        `});`,
        ``,
        `export type OutputList${modelName}SchemaType = Static<typeof OutputList${modelName}Schema>;`,
    ]);

    return [{
        file: `List${modelName}Schema.model.ts`,
        exports: [
            `QueryList${modelName}Schema`,
            `OutputList${modelName}Schema`
        ]
    }];
}

