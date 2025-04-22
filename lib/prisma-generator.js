import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { promises as fs } from 'fs';
import path from 'path';
import generateSchema from './generate-schema.js';
import generateEnum from './generate-enum.js';
import { generateEnumsIndexFile, generateModelsIndexFile, generatePreloadEntitiesFile } from './helpers.js';
import { project } from './project.js';
import { generateListSchema } from './generate-list.js';
import { emptyDir, pathExists } from 'fsesm';
import { loadPrismaSchema } from './prisma-schema-loader.js';
function buildForeignKeyMap(dmmf) {
    const foreignKeyMap = new Map();
    for (const model of dmmf.datamodel.models) {
        for (const field of model.fields) {
            // Если поле - это объект (kind === "object") и в нём заданы relationFromFields,
            // значит, это реляционное поле, указывающее, откуда берётся FK (например, [ 'updatedById' ])
            if (field.kind === 'object' && field.relationFromFields?.length) {
                const relatedModelName = field.type; // Например, "Admin"
                // relationFromFields может содержать несколько ключей (если составной ключ),
                // обычно бывает 1, но на всякий случай обходим все
                field.relationFromFields.forEach(fkFieldName => {
                    // Сохраняем в Map, что в модели M поле fkFieldName -> указывает на relatedModelName
                    foreignKeyMap.set(`${model.name}.${fkFieldName}`, relatedModelName);
                });
            }
        }
    }
    return foreignKeyMap;
}
async function parseConfig(absolutePath) {
    const res = (config) => {
        if (!config.input) {
            config.input = {
                includeRelations: false,
                excludeIdFields: true,
                excludeModels: [],
                excludeModelFields: {},
                includeModelFields: {},
                makeDateFieldsOptional: true,
                excludeFields: [
                    "id",
                    "createdAt",
                    "updatedAt",
                    "deletedAt",
                    "isDeleted"
                ],
                extendModels: {},
            };
        }
        if (!config.output) {
            config.output = {
                excludeFields: [],
                includeRelations: true,
                makeFieldsOptional: true,
                excludeModels: [],
                excludeModelFields: {},
                includeModelFields: {},
                extendModels: {},
            };
        }
        if (!config.extra) {
            config.extra = {
                enums: {},
                models: {}
            };
        }
        // Если strictMode не указан, то он будет false
        if (!("strictMode" in config)) {
            config.strictMode = false;
        }
        if (!config.input.excludeFields) {
            config.input.excludeFields = [];
        }
        if (!config.output.excludeFields) {
            config.output.excludeFields = [];
        }
        if (!config.input.excludeModels) {
            config.input.excludeModels = [];
        }
        if (!config.output.excludeModels) {
            config.output.excludeModels = [];
        }
        if (!config.input.excludeModelFields) {
            config.input.excludeModelFields = {};
        }
        if (!config.output.excludeModelFields) {
            config.output.excludeModelFields = {};
        }
        if (!config.input.includeModelFields) {
            config.input.includeModelFields = {};
        }
        if (!config.output.includeModelFields) {
            config.output.includeModelFields = {};
        }
        if (!config.input.extendModels) {
            config.input.extendModels = {};
        }
        if (!config.output.extendModels) {
            config.output.extendModels = {};
        }
        if (!config.extra.enums) {
            config.extra.enums = {};
        }
        if (!config.extra.models) {
            config.extra.models = {};
        }
        if (config.input?.includeRelations === undefined) {
            config.input.includeRelations = false;
        }
        if (config.output?.includeRelations === undefined) {
            config.output.includeRelations = true;
        }
        return config;
    };
    const defaultValues = {};
    if (!absolutePath) {
        return res(defaultValues);
    }
    try {
        const fileContent = await fs.readFile(absolutePath, 'utf-8'); // Читаем содержимое файла
        const fileConfig = JSON.parse(fileContent);
        return res(fileConfig);
    }
    catch (e) {
        return res(defaultValues);
    }
}
export async function generate(options) {
    let prismaLoaded = null;
    try {
        prismaLoaded = await loadPrismaSchema(options.cwd || process.cwd(), options.schemaPath);
    }
    catch (e) {
        console.error(e);
        return;
    }
    const prismaPath = prismaLoaded.path;
    const prismaCWD = path.dirname(prismaPath);
    const outputDir = path.resolve(prismaCWD, options.output || 'schema_generated');
    await emptyDir(outputDir);
    const configFilePath = path.resolve(prismaCWD, 'generator-config.json');
    if (!await pathExists(configFilePath)) {
        console.warn('⚠️ Config file not found at ' + configFilePath + ', using default configuration');
    }
    let config = null;
    try {
        config = await parseConfig(configFilePath);
    }
    catch (e) {
        console.warn('⚠️ Error parsing config file: ' + e.message + ', using default configuration');
        config = await parseConfig('');
    }
    const prismaClientDmmf = await getDMMF({
        datamodel: prismaLoaded.schema,
    });
    const enumNames = new Set();
    prismaClientDmmf.datamodel.enums.forEach((enumItem) => {
        enumNames.add(enumItem.name);
        generateEnum(project, outputDir, enumItem);
    });
    if (config.extra?.enums) {
        const keys = Object.keys(config.extra.enums);
        for (const key of keys) {
            enumNames.add(key);
        }
    }
    if (enumNames.size > 0) {
        const enumsIndexSourceFile = project.createSourceFile(path.resolve(outputDir, 'enums', 'index.ts'), undefined, { overwrite: true });
        generateEnumsIndexFile(enumsIndexSourceFile, [...enumNames]);
    }
    let excludeModels = config.excludeModels || [];
    const listPrepared = new Set();
    const foreignKeyMap = buildForeignKeyMap(prismaClientDmmf);
    const referenceModels = [];
    const models = prismaClientDmmf.datamodel.models;
    const checkFieldsToReference = (fields, type) => {
        for (const field of fields) {
            if (typeof field !== 'string') {
                if (field?.relationName && field.type) {
                    if (!referenceModels.find((item) => item.name === field.type) && models.find((model) => model.name === field.type)) {
                        referenceModels.push({ type, name: field.type });
                        if (excludeModels.includes(field.type)) {
                            excludeModels = excludeModels.filter((model) => model !== field.type);
                        }
                    }
                }
            }
        }
    };
    config.excludeModels = excludeModels;
    if (config.extra?.models && Object.keys(config.extra?.models).length) {
        for (const key in config.extra.models) {
            const fields = config.extra.models[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, config.extra.models[key].type || 'output');
        }
    }
    if (config?.input?.includeModelFields && Object.keys(config.input.includeModelFields).length) {
        for (const key in config.input.includeModelFields) {
            const fields = config.input.includeModelFields[key];
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'input');
        }
    }
    if (config?.input?.extendModels && Object.keys(config.input.extendModels).length) {
        for (const key in config.input.extendModels) {
            const fields = config.input.extendModels[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'input');
        }
    }
    if (config?.output?.extendModels && Object.keys(config.output.extendModels).length) {
        for (const key in config.output.extendModels) {
            const fields = config.output.extendModels[key].fields;
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'output');
        }
    }
    if (config?.output?.includeModelFields && Object.keys(config.output.includeModelFields).length) {
        for (const key in config.output.includeModelFields) {
            const fields = config.output.includeModelFields[key];
            if (!fields.length) {
                continue;
            }
            checkFieldsToReference(fields, 'output');
        }
    }
    const prepareModels = models.filter((model) => !excludeModels.includes(model.name));
    for (const model of prepareModels) {
        const _listPrepared = await generateSchema(config, project, outputDir, model, config, foreignKeyMap, referenceModels);
        if (_listPrepared?.length) {
            _listPrepared.forEach((name) => listPrepared.add(name));
        }
    }
    const dirPath = path.resolve(outputDir, 'models');
    const list = config.lists || {};
    const generatedListSchemas = [];
    for (const [modelName, listConfig] of Object.entries(list)) {
        if (listPrepared.has(modelName)) {
            continue;
        }
        const listSchemas = generateListSchema(listConfig, project, dirPath, { name: modelName }, config);
        generatedListSchemas.push(...listSchemas);
    }
    generateModelsIndexFile(prismaClientDmmf, project, outputDir, config, generatedListSchemas);
    generatePreloadEntitiesFile(prismaClientDmmf, project, outputDir, config, generatedListSchemas);
    await project.save();
}
//# sourceMappingURL=prisma-generator.js.map