import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import {
  DecoratorStructure,
  ExportDeclarationStructure,
  OptionalKind,
  Project,
  SourceFile,
} from 'ts-morph';
import { PrismaClassDTOGeneratorConfig } from './prisma-generator.js';
import { PrismaClassDTOGeneratorField } from './generate-schema.js';

function generateUniqueImports(sourceFile: SourceFile, imports: string[], moduleSpecifier: string) {
  let existingImport = sourceFile.getImportDeclaration(moduleSpecifier);

  if (!existingImport) {
    existingImport = sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: [],
    });
  }

  const namedImports = new Set(existingImport.getNamedImports().map(namedImport => namedImport.getName()));
  imports.forEach(importName => namedImports.add(importName));
  existingImport.removeNamedImports();
  existingImport.addNamedImports(Array.from(namedImports).map(name => ({ name })));
}

export const generateModelsIndexFile = (
  prismaClientDmmf: PrismaDMMF.Document,
  project: Project,
  outputDir: string,
  config: PrismaClassDTOGeneratorConfig,
  generatedListSchemas: { file: string; exports: string[] }[] = [],
) => {
  const modelsBarrelExportSourceFile = project.createSourceFile(
    path.resolve(outputDir, 'models', 'index.ts'),
    undefined,
    { overwrite: true },
  );
  const excludeModels = config?.excludeModels || [];

  const excludeInputModels = config?.input?.excludeModels || [];
  const excludeOutputModels = config?.output?.excludeModels || [];

  const modelNames = prismaClientDmmf.datamodel.models.map((model) => model.name).filter((name) => !excludeModels.includes(name));

  const extraModelNames = config.extra?.models
    ? Object.keys(config.extra.models)
    : [];

  const standardExports = modelNames.flatMap<OptionalKind<ExportDeclarationStructure>>(
    (modelName) => {
      const exports: OptionalKind<ExportDeclarationStructure>[] = [];
      const model = prismaClientDmmf.datamodel.models.find(m => m.name === modelName);
      const hasRelations = model?.fields.some(field => field.relationName) || false;

      if (!excludeInputModels.includes(modelName)) {
        const inputExports = [`Input${modelName}Schema`, `Input${modelName}SchemaType`];
        if (hasRelations && config.input?.includeRelations !== false) {
          inputExports.push(`Input${modelName}SchemaLite`);
        }
        exports.push({
          moduleSpecifier: `./Input${modelName}Schema.model.js`,
          namedExports: inputExports,
        });
      }

      if (!excludeOutputModels.includes(modelName)) {
        const outputExports = [`Output${modelName}Schema`, `Output${modelName}SchemaType`];
        if (hasRelations && config.output?.includeRelations !== false) {
          outputExports.push(`Output${modelName}SchemaLite`);
        }
        exports.push({
          moduleSpecifier: `./Output${modelName}Schema.model.js`,
          namedExports: outputExports,
        });
      }

      return exports;
    }
  );

  // Add list schemas exports
  const listSchemaExports = generatedListSchemas.flatMap<OptionalKind<ExportDeclarationStructure>>(
    (schemaInfo) => ({
      moduleSpecifier: `./${schemaInfo.file.replace('.ts', '.js')}`,
      namedExports: schemaInfo.exports,
    })
  );

  const extraExports = extraModelNames.map<OptionalKind<ExportDeclarationStructure>>(
    (extraModelName) => ({
      moduleSpecifier: `./${extraModelName}Schema.model.js`,
      namedExports: [
        `${extraModelName}Schema`
      ],
    }),
  );

  modelsBarrelExportSourceFile.addExportDeclarations([
    ...standardExports,
    ...listSchemaExports,
    ...extraExports,
  ]);
};

export const getTSDataTypeFromFieldType = (field: PrismaDMMF.Field, config: PrismaClassDTOGeneratorConfig) => {
  let type = field.type;
  switch (field.type) {
    case 'Int':
    case 'Float':
      type = 'number';
      break;
    case 'DateTime':
      type = 'Date';
      break;
    case 'String':
      type = 'string';
      break;
    case 'Boolean':
      type = 'boolean';
      break;
    case 'Decimal':
      type = 'Prisma.Decimal';
      break;
    case 'Json':
      type = 'Prisma.JsonValue';
      break;
    case 'Bytes':
      type = 'Buffer';
      break;
  }

  if (field.isList) {
    type = `${type}[]`;
  } else if (field.kind === 'object') {
    type = `${type}`;
  }
  return type;
};

export function getTypeBoxType(field: PrismaDMMF.Field, schemaType?: 'Input' | 'Output'): string {
  let type = field.type;
  let isOptional = !field.isRequired;
  if (field.kind !== 'enum') {
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
        type = 'Type.Any({default: null})';
        break;
      case 'Bytes':
        type = 'Type.String()';
        break;
      case 'File':
        type = 'Type.String({ format: "binary" })';
        break;
    }
  }

  if (field.relationName) {
    const schemaSuffix = 'SchemaLite';
    const extraName = `${field.type}${schemaSuffix}`;
    const relatedSchemaName = (field as PrismaClassDTOGeneratorField).isExtra ? extraName : `${schemaType ? schemaType : ''}${field.type}${schemaSuffix}`;
    type = `Type.Ref('${relatedSchemaName}')`;
  }

  if (field.isList) {
    type = `Type.Array(${type})`;
  }

  if (isOptional) {
    type = `Type.Optional(${type})`;
  }

  return type;
}
export const generateEnumImports = (
  sourceFile: SourceFile,
  fields: PrismaDMMF.Field[],
  config: PrismaClassDTOGeneratorConfig,
) => {
  const allEnumsToImport = Array.from(
    new Set(fields.filter((field) => field.kind === 'enum').map((field) => field.type))
  );
  if (allEnumsToImport.length > 0) {
    generateUniqueImports(sourceFile, allEnumsToImport, '../enums/index.js');
  }
};

export function generateEnumsIndexFile(
  sourceFile: SourceFile,
  enumNames: string[],
) {
  sourceFile.addExportDeclarations(
    enumNames.sort().map<OptionalKind<ExportDeclarationStructure>>((name) => ({
      moduleSpecifier: `./${name}.enum.js`,
      namedExports: [name],
    })),
  );
}

export type FieldDirectives = {
  filterable: boolean;
  listable: boolean;
  pagination: boolean;
  orderable: boolean;
  exclude: 'input' | 'output';
};
export function getFieldDirectives(documentation: string | undefined): FieldDirectives {
  if (!documentation) {
    return {
      filterable: false,
      listable: false,
      orderable: false,
      pagination: false,
      exclude: undefined,
    }
  }
  const directives: FieldDirectives = {
    filterable: false,
    pagination: false,
    listable: false,
    orderable: false,
    exclude: undefined,
  };
  directives.filterable = /@filterable/.test(documentation);
  directives.listable = /@listable/.test(documentation);
  directives.orderable = /@orderable/.test(documentation);
  directives.pagination = /@pagination/.test(documentation);
  // @exclude (space +) input | output
  const excludeMatch = documentation.match(/@exclude\s+(input|output)/);
  if (excludeMatch) {
    const value = excludeMatch[1]?.toLowerCase();
    directives.exclude = value as 'input' | 'output';
  }
  return directives;
}

export function generatePreloadEntitiesFile(
  prismaClientDmmf: PrismaDMMF.Document,
  project: Project,
  outputDir: string,
  config: PrismaClassDTOGeneratorConfig,
  generatedListSchemas: { file: string; exports: string[] }[]
) {
  const preloadEntitiesSourceFile = project.createSourceFile(
    path.resolve(outputDir, 'preload-entities.extra.ts'),
    undefined,
    { overwrite: true },
  );

  // Add imports
  preloadEntitiesSourceFile.addImportDeclaration({
    moduleSpecifier: '@tsdiapi/server',
    namedImports: ['AppContext'],
  });

  // Get all model names that are actually generated
  const excludeModels = config?.excludeModels || [];
  const excludeInputModels = config?.input?.excludeModels || [];
  const excludeOutputModels = config?.output?.excludeModels || [];

  const modelNames = prismaClientDmmf.datamodel.models
    .map((model) => model.name)
    .filter((name) => !excludeModels.includes(name));

  const extraModelNames = config.extra?.models
    ? Object.keys(config.extra.models)
    : [];

  // Generate import statements for all schemas
  const importStatements = [
    ...modelNames.flatMap((modelName) => {
      const imports = [];
      const model = prismaClientDmmf.datamodel.models.find(m => m.name === modelName);
      const hasRelations = model?.fields.some(field => field.relationName) || false;

      if (!excludeInputModels.includes(modelName)) {
        imports.push(`Input${modelName}Schema`);
        if (hasRelations && config.input?.includeRelations !== false) {
          imports.push(`Input${modelName}SchemaLite`);
        }
      }
      if (!excludeOutputModels.includes(modelName)) {
        imports.push(`Output${modelName}Schema`);
        if (hasRelations && config.output?.includeRelations !== false) {
          imports.push(`Output${modelName}SchemaLite`);
        }
      }
      return imports;
    }),
    ...extraModelNames.map((extraModelName) => `${extraModelName}Schema`),
    ...generatedListSchemas.flatMap(schemaInfo => schemaInfo.exports),
  ];

  preloadEntitiesSourceFile.addImportDeclaration({
    moduleSpecifier: './models/index.js',
    namedImports: importStatements,
  });

  // Generate schema entries
  const schemaEntries = [
    ...modelNames.flatMap((modelName) => {
      const entries = [];
      const model = prismaClientDmmf.datamodel.models.find(m => m.name === modelName);
      const hasRelations = model?.fields.some(field => field.relationName) || false;

      if (!excludeInputModels.includes(modelName)) {
        entries.push(`    { name: 'Input${modelName}Schema', schema: Input${modelName}Schema },`);
        if (hasRelations && config.input?.includeRelations !== false) {
          entries.push(`    { name: 'Input${modelName}SchemaLite', schema: Input${modelName}SchemaLite },`);
        }
      }
      if (!excludeOutputModels.includes(modelName)) {
        entries.push(`    { name: 'Output${modelName}Schema', schema: Output${modelName}Schema },`);
        if (hasRelations && config.output?.includeRelations !== false) {
          entries.push(`    { name: 'Output${modelName}SchemaLite', schema: Output${modelName}SchemaLite },`);
        }
      }
      return entries;
    }),
    ...extraModelNames.map((extraModelName) =>
      `    { name: '${extraModelName}Schema', schema: ${extraModelName}Schema },`
    ),
    ...generatedListSchemas.flatMap(schemaInfo =>
      schemaInfo.exports.map(exportName =>
        `    { name: '${exportName}', schema: ${exportName} },`
      )
    ),
  ];

  // Remove the last comma if there are any entries
  if (schemaEntries.length > 0) {
    const lastEntry = schemaEntries[schemaEntries.length - 1];
    schemaEntries[schemaEntries.length - 1] = lastEntry.replace(/,$/, '');
  }

  // Generate the preload function
  preloadEntitiesSourceFile.addStatements([
    `export default function preloadEntities({ fastify }: AppContext): void {`,
    `  const allSchemas = [`,
    ...schemaEntries,
    `  ];`,
    ``,
    `  for (const { schema } of allSchemas) {`,
    `    if (!fastify.getSchema(schema.$id!)) {`,
    `      fastify.addSchema(schema);`,
    `    }`,
    `  }`,
    `}`,
  ]);
}
