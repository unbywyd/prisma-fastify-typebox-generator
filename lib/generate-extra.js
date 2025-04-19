import path from "path";
import { shouldImportHelpers, generateEnumImports } from "./helpers.js";
function getTypeBoxType(field) {
    let type = field.type;
    let isOptional = !field.isRequired;
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
export function generateExtraModel(config, project, outputDir, modelName, modelConfig) {
    const filePath = path.resolve(outputDir, 'models', `${modelName}Schema.model.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    // Add TypeBox imports
    sourceFile.addImportDeclaration({
        moduleSpecifier: '@sinclair/typebox',
        namedImports: ['Type', 'Static'],
    });
    const hasDateTimeFields = modelConfig.fields.some(field => field.type === 'DateTime');
    if (hasDateTimeFields) {
        // Add DateString import only if there are DateTime fields
        sourceFile.addImportDeclaration({
            moduleSpecifier: '@tsdiapi/server',
            namedImports: ['DateString'],
        });
    }
    const oiType = modelConfig.type === 'input' ? 'Input' : 'Output';
    const excludeModels = config.excludeModels || [];
    // Преобразуем поля, устанавливаем значения по умолчанию
    let fields = modelConfig.fields.map((field) => ({
        ...field,
        isRequired: field.isRequired ?? false,
        isList: field.isList ?? false,
        relationName: field.relationName || null,
        documentation: ""
    })).filter((field) => {
        if (field?.relationName && excludeModels.includes(field.type)) {
            return false;
        }
        else {
            return true;
        }
    });
    const makeFieldsOptional = modelConfig.type === 'input' ? config.input.makeFieldsOptional : config.output.makeFieldsOptional;
    if (makeFieldsOptional) {
        fields = fields.map((field) => ({
            ...field,
            isRequired: false,
        }));
    }
    const makeDateFieldsOptional = modelConfig.type === 'input' ? config.input.makeDateFieldsOptional : config.output.makeDateFieldsOptional;
    if (makeDateFieldsOptional) {
        fields = fields.map((field) => ({
            ...field,
            isRequired: field.type === 'DateTime' ? false : field.isRequired,
        }));
    }
    // Импорты для связей
    const relationImports = new Map();
    fields.forEach((field) => {
        if (field.relationName) {
            const extraName = `${field.type}Schema`;
            const relatedSchemaName = field.isExtra ? extraName : `${oiType}${field.type}Schema`;
            const relativePath = `./${relatedSchemaName}.model.js`;
            if (!relationImports.has(relatedSchemaName)) {
                relationImports.set(relatedSchemaName, relativePath);
            }
        }
    });
    // Импорты вспомогательных методов (если нужны)
    if (shouldImportHelpers(fields)) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'prisma-class-dto-generator',
            namedImports: ['getEnumValues'],
        });
    }
    // Генерация импортов enum (если есть поля enum)
    generateEnumImports(sourceFile, fields, config);
    // Generate TypeBox schema
    const schemaProperties = fields.map(field => {
        let type = getTypeBoxType(field);
        if (field.relationName) {
            const isArray = field.isList;
            const extraName = `${field.type}Schema`;
            const relatedSchemaName = field.isExtra ? extraName : `${oiType}${field.type}Schema`;
            type = `Type.Ref('${relatedSchemaName}')`;
            if (isArray) {
                type = `Type.Array(${type})`;
            }
            if (!field.isRequired) {
                type = `Type.Optional(${type})`;
            }
        }
        else if (field.kind === 'enum') {
            type = field.type;
        }
        return `  ${field.name}: ${type},`;
    });
    sourceFile.addStatements([
        `export const ${modelName}Schema = Type.Object({`,
        ...schemaProperties,
        `}, {`,
        `  $id: '${modelName}Schema',`,
        `});`,
        ``,
        `export type ${modelName}SchemaType = Static<typeof ${modelName}Schema>;`,
    ]);
    // Сохраняем файл
    project.saveSync();
}
//# sourceMappingURL=generate-extra.js.map