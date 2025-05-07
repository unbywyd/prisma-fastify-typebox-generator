import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { Project } from 'ts-morph';
import {
  generateEnumImports,
  getFieldDirectives,
  getTypeBoxType,
} from './helpers.js';
import { PrismaClassDTOGeneratorConfig, PrismaClassDTOGeneratorListModelConfig } from './prisma-generator.js';
import { generateListSchema } from './generate-list.js';
import { generateExtraModel } from './generate-extra.js';
import { generateExtraEnum } from './generate-extra-enums.js';

export type PrismaClassDTOGeneratorField = PrismaDMMF.Field & {
  isExtra?: boolean;
  isList?: boolean;
  options?: Record<string, any>;
};



function generateSchema(
  config: PrismaClassDTOGeneratorConfig['input'] | PrismaClassDTOGeneratorConfig['output'],
  project: Project,
  dirPath: string,
  model: PrismaDMMF.Model,
  schemaType: 'Input' | 'Output',
  mainConfig: PrismaClassDTOGeneratorConfig,
  foreignKeyMap: Map<string, string>,
) {
  const outputModelName = `${schemaType}${model.name}Schema`;
  const filePath = path.resolve(dirPath, outputModelName + '.model.ts');

  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  });

  // Add TypeBox imports
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports: ['Type', 'Static'],
  });

  const hasDateTimeFields = model.fields.some(field => field.type === 'DateTime');
  if (hasDateTimeFields) {
    // Add DateString import only if there are DateTime fields
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@tsdiapi/server',
      namedImports: ['DateString'],
    });
  }

  const strictMode = mainConfig.strictMode || false;
  const excludeModelFields = config.excludeModelFields?.[model.name] || [];
  const excludeModels = [...mainConfig.excludeModels || [], ...config.excludeModels || []];
  const includeOnlyFields = config.includeModelFields?.[model.name] || [];
  const includeOnlyFieldNames = includeOnlyFields.map((field) => 'string' === typeof field ? field : field.name);

  const isFieldExclude = (field: PrismaDMMF.Field) => {
    if (config?.excludeIdFields && field.isId) {
      return true;
    }
    if (config?.excludeDateAtFields && field.type === 'DateTime' && field.name.toLowerCase().endsWith('at')) {
      return true;
    }
    const referenceModelName = foreignKeyMap.get(`${model.name}.${field.name}`);
    if (config?.excludeIdRelationFields && referenceModelName) {
      return true;
    }
    if (!config?.includeRelations && field.relationName) {
      return true;
    }
    if (includeOnlyFields.length > 0 || strictMode) {
      const isInclude = includeOnlyFieldNames.includes(field.name);
      if (!isInclude) {
        return true;
      }
    }

    if (field.relationName && excludeModels.includes(field.type)) {
      return true;
    }
    const directives = getFieldDirectives(field.documentation);
    const type = schemaType.toLowerCase();
    return config.excludeFields?.includes(field.name) || directives.exclude == type || excludeModelFields.includes(field.name);
  }

  let fields = model.fields.filter((field) => !isFieldExclude(field));
  const extendFields = (config.extendModels?.[model.name]?.fields || []).filter((field) => {
    return !isFieldExclude({ name: field.name } as PrismaDMMF.Field);
  });

  const mergeInputFields = [];
  for (const field of includeOnlyFields) {
    if ('string' != typeof field) {
      if (!fields.find(f => f.name === field.name)) {
        const inExtend = extendFields.find(f => f.name === field.name);
        if (!inExtend) {
          extendFields.push(field);
        } else {
          extendFields[extendFields.indexOf(inExtend)] = Object.assign(field, inExtend);
        }
      } else {
        mergeInputFields.push(field);
      }
    }
  }

  const fieldsMap = new Map(fields.map(field => [field.name, field])) as Map<string, PrismaDMMF.Field>;
  extendFields.forEach((extendField) => {
    const existingField = fieldsMap.get(extendField.name);
    if (existingField) {
      fieldsMap.set(extendField.name, {
        ...existingField,
        ...extendField,
      });
    } else {
      fieldsMap.set(extendField.name, {
        ...extendField,
        isRequired: extendField.isRequired ?? false,
        isExtra: extendField.isExtra ?? false,
        isList: extendField.isList ?? false,
        relationName: extendField.relationName || null,
        documentation: '',
      } as PrismaDMMF.Field);
    }
  });

  if (mergeInputFields?.length > 0) {
    mergeInputFields.forEach((extendField) => {
      const existingField = fieldsMap.get(extendField.name);
      if (existingField) {
        fieldsMap.set(extendField.name, {
          ...existingField,
          ...extendField,
        });
      }
    });
  }

  fields = Array.from(fieldsMap.values());

  const makeFieldsOptional = config.makeFieldsOptional || false;
  if (makeFieldsOptional) {
    fields = fields.map((field) => ({
      ...field,
      isRequired: false,
    }));
  }

  const makeDateFieldsOptional = config.makeDateFieldsOptional || false;
  if (makeDateFieldsOptional) {
    fields = fields.map((field) => ({
      ...field,
      isRequired: field.type === 'DateTime' ? false : field.isRequired,
    }));
  }

  // Generate enum imports
  generateEnumImports(sourceFile, fields as PrismaDMMF.Field[], mainConfig);

  const relationImports = new Map<string, string>();
  const referenceFields = fields.filter((field) => field.relationName);

  referenceFields.forEach((field) => {
    const relatedSchemaName = (field as PrismaClassDTOGeneratorField).isExtra ? `${field.type}Schema` : `${schemaType}${field.type}Schema`;
    const relativePath = `./${relatedSchemaName}.model.js`;

    if (isFieldExclude(field as PrismaDMMF.Field)) {
      return;
    }
    if (!relationImports.has(relatedSchemaName) && outputModelName !== relatedSchemaName) {
      relationImports.set(relatedSchemaName, relativePath);
    }
  });

  // Generate lite schema with Type.Any() for relations
  const liteSchemaProperties = fields.map(field => {
    let type;
    if (field.relationName) {
      type = field.isList ? 'Type.Optional(Type.Array(Type.Any({default: null})))' : 'Type.Optional(Type.Any({default: null}))';
    } else {
      type = getTypeBoxType({
        ...field,
        isRequired: false
      }, schemaType);
    }
    return `  ${field.name}: ${type},`;
  });

  // Check if we need to generate lite version
  const hasRelations = fields.some(field => field.relationName);
  const shouldGenerateLite = hasRelations && config.includeRelations !== false;

  //if (shouldGenerateLite) {
  sourceFile.addStatements([
    `export const ${outputModelName}Lite = Type.Object({`,
    ...liteSchemaProperties,
    `}, {`,
    `  $id: '${outputModelName}Lite',`,
    `});`,
    ``,
    `export type ${outputModelName}LiteType = Static<typeof ${outputModelName}Lite>;`,
  ]);
  // }

  // Generate main schema with relations
  const schemaProperties = fields.map(field => {
    let type = getTypeBoxType(field, schemaType);
    return `  ${field.name}: ${type},`;
  });

  sourceFile.addStatements([
    `export const ${outputModelName} = Type.Object({`,
    ...schemaProperties,
    `}, {`,
    `  $id: '${outputModelName}',`,
    `});`,
    ``,
    `export type ${outputModelName}Type = Static<typeof ${outputModelName}>;`,
  ]);
}

export default async function generateClass(
  config: PrismaClassDTOGeneratorConfig,
  project: Project,
  outputDir: string,
  model: PrismaDMMF.Model,
  mainConfig: PrismaClassDTOGeneratorConfig,
  foreignKeyMap: Map<string, string>,
  refs: Array<{ type: 'input' | 'output', name: string }>,
  enums: Record<string, string[]>
) {
  const dirPath = path.resolve(outputDir, 'models');

  const strictMode = config.strictMode || false;
  let excludeOutputModels = config.output.excludeModels || [];
  let excludeInutModels = config.input.excludeModels || [];

  if (strictMode) {
    let inputDeclaratedModels: Array<string> = [];

    if (config.input.includeModelFields) {
      const keys = Object.keys(config.input.includeModelFields);
      for (const key of keys) {
        if (!inputDeclaratedModels.includes(key)) {
          inputDeclaratedModels.push(key);
        }
      }
    }
    if (config.input.extendModels) {
      const keys = Object.keys(config.input.extendModels);
      for (const key of keys) {
        if (!inputDeclaratedModels.includes(key)) {
          inputDeclaratedModels.push(key);
        }
      }
    }
    if (excludeInutModels.length) {
      inputDeclaratedModels = inputDeclaratedModels.filter((model) => !excludeInutModels.includes(model));
    }
    if (!inputDeclaratedModels.includes(model.name)) {
      excludeInutModels.push(model.name);
    }

    let outputDeclaratedModels: Array<string> = [];
    if (config.output.includeModelFields) {
      const keys = Object.keys(config.output.includeModelFields);
      for (const key of keys) {
        if (!outputDeclaratedModels.includes(key)) {
          outputDeclaratedModels.push(key);
        }
      }
    }
    if (config.output.extendModels) {
      const keys = Object.keys(config.output.extendModels);
      for (const key of keys) {
        if (!outputDeclaratedModels.includes(key)) {
          outputDeclaratedModels.push(key);
        }
      }
    }
    if (config.output.excludeModels) {
      outputDeclaratedModels = outputDeclaratedModels.filter((model) => !config.output.excludeModels.includes(model));
    }
    if (!outputDeclaratedModels.includes(model.name)) {
      excludeOutputModels.push(model.name);
    }
  }

  const isInputUsed = refs.find((ref) => ref.type === 'input' && ref.name === model.name);

  if (isInputUsed && !config.input?.includeModelFields?.[model.name] && !config.input?.extendModels?.[model.name]) {
    config.input.includeModelFields[model.name] = [];
    console.log('Model', model.name, 'is used as input but not declared in config. Added to input models');
    excludeInutModels = excludeInutModels.filter((name) => name !== model.name);
    config.input.excludeModels = excludeInutModels;
  }

  if (!excludeInutModels.includes(model.name)) {
    generateSchema(config.input, project, dirPath, model, 'Input', config, foreignKeyMap);
  }

  const isOutputUsed = refs.find((ref) => ref.type === 'output' && ref.name === model.name);

  if (isOutputUsed && !config.output.includeModelFields?.[model.name] && !config.output.extendModels?.[model.name]) {
    config.output.includeModelFields[model.name] = [];
    console.log('Model', model.name, 'is used as output but not declared in config. Added to output models');
    excludeOutputModels = excludeOutputModels.filter((name) => name !== model.name);
    config.output.excludeModels = excludeOutputModels;
  }

  if (!excludeOutputModels.includes(model.name) || isOutputUsed) {
    generateSchema(config.output, project, dirPath, model, 'Output', config, foreignKeyMap);
  }

  const directives = getFieldDirectives(model.documentation);

  if (config.extra?.models) {
    for (const [extraModelName, extraModelConfig] of Object.entries(config.extra.models)) {
      generateExtraModel(config, project, outputDir, extraModelName, extraModelConfig);
    }
  }

  if (config.extra?.enums) {
    for (const [extraEnumName, extraEnumConfig] of Object.entries(config.extra.enums)) {
      generateExtraEnum(project, outputDir, extraEnumName, extraEnumConfig, mainConfig);
    }
  }

  const listPrepared = [];

  const listModels = config.lists ? (config.lists as Record<string, PrismaClassDTOGeneratorListModelConfig>) : false;
  if (directives.listable && listModels) {
    const configList = listModels[model.name] || {
      pagination: true,
      filters: [],
    };
    generateListSchema(configList, project, dirPath, model, mainConfig, enums);
    listPrepared.push(model.name);
  }
  return listPrepared;
}
