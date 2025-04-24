import path from "path";
import { generateEnumImports, getTypeBoxType } from "./helpers.js";
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
    // Генерация импортов enum (если есть поля enum)
    generateEnumImports(sourceFile, fields, config);
    // Generate TypeBox schema
    const schemaProperties = fields.map(field => {
        let type = getTypeBoxType(field);
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
}
//# sourceMappingURL=generate-extra.js.map