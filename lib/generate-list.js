import path from 'path';
import { generateEnumImports, getFieldDirectives, getTypeBoxType } from "./helpers.js";
export function generateListSchema(config, project, dirPath, model, mainConfig, enums) {
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
    const isOrderable = (config?.orderable === true || (Array.isArray(config?.orderable) && !!config?.orderable?.length)) || directives.orderable;
    const hasPagination = config?.pagination || directives.pagination;
    let orderableFields = Array.isArray(config?.orderable) ? config?.orderable : [];
    if (config?.orderable === true) {
        orderableFields = model.fields?.filter((field) => !field.relationName && !field.isList)?.map((field) => field.name) || [];
    }
    let filters = config?.filters || [];
    if (filters === true) {
        filters = model.fields?.filter((field) => !field.relationName && !field.isList)?.map((field) => field.name) || [];
    }
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
            const type = getTypeBoxType({
                ...field,
                isRequired: false
            }, 'Output');
            return `  ${field.name}: ${type},`;
        }),
    ];
    const modelFieldsKeys = model.fields?.map((field) => field.name) || [];
    const customFields = filters.filter((filter) => typeof filter !== 'string' && !modelFieldsKeys.includes(filter.name));
    const allCustomFields = [...customFields];
    filters.filter((filter) => typeof filter === 'string' && !modelFieldsKeys.includes(filter)).forEach((filter) => {
        allCustomFields.push({
            name: filter,
            type: 'String',
            isList: false,
            isRequired: false,
        });
    });
    generateEnumImports(sourceFile, allCustomFields, mainConfig);
    generateEnumImports(sourceFile, validFields, mainConfig);
    allCustomFields.forEach((field) => {
        const type = getTypeBoxType(field, 'Output');
        queryListProperties.push(`  ${field.name}: ${type},`);
    });
    if (isOrderable) {
        if (orderableFields?.length) {
            queryListProperties.push(`  orderBy: Type.Optional(Type.String({ enum: [${orderableFields.map(el => `"${el}"`)?.join(',')}] })),`);
        }
        else {
            queryListProperties.push(`  orderBy: Type.Optional(Type.String()),`);
        }
        queryListProperties.push(`  orderDirection: Type.Optional(Type.String({ enum: ['asc', 'desc'] })),`);
    }
    const hasLiteVersion = model.fields?.some(field => field.relationName) || false;
    const suffix = hasLiteVersion ? 'Lite' : '';
    // Generate OutputList schema
    const outputListProperties = [
        ...(hasPagination ? [
            `  take: Type.Optional(Type.Number()),`,
            `  skip: Type.Optional(Type.Number()),`,
        ] : []),
        `  total: Type.Optional(Type.Number()),`,
        `  items: Type.Array(Type.Ref('${itemsModelName}Schema${suffix}')),`,
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
            ],
            types: [
                `QueryList${modelName}SchemaType`,
                `OutputList${modelName}SchemaType`
            ]
        }];
}
//# sourceMappingURL=generate-list.js.map