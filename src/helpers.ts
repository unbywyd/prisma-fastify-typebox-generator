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

      if (!excludeInputModels.includes(modelName)) {
        exports.push({
          moduleSpecifier: `./Input${modelName}Schema.model.js`,
          namedExports: [`Input${modelName}Schema`],
        });
      }

      if (!excludeOutputModels.includes(modelName)) {
        exports.push({
          moduleSpecifier: `./Output${modelName}Schema.model.js`,
          namedExports: [`Output${modelName}Schema`],
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

export const shouldImportPrisma = (fields: PrismaDMMF.Field[]) => {
  return fields.some((field) => ['Decimal', 'Json'].includes(field.type));
};

export const shouldImportHelpers = (fields: PrismaDMMF.Field[]) => {
  return fields.some((field) => ['enum'].includes(field.kind));
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

export const getDecoratorsByFieldType = (field: PrismaDMMF.Field, config: PrismaClassDTOGeneratorConfig) => {
  const decorators: OptionalKind<DecoratorStructure>[] = [];

  switch (field.type) {
    case 'Int':
      decorators.push({ name: 'IsInt', arguments: [] });
      break;
    case 'Float':
      decorators.push({ name: 'IsNumber', arguments: [] });
      break;
    case 'Decimal':
      decorators.push({ name: 'IsDecimal', arguments: [] });
      break;
    case 'DateTime':
      decorators.push({ name: 'IsDate', arguments: [] });
      break;
    case 'String':
      decorators.push({
        name: 'IsString',
        arguments: field.isList ? ['{ each: true }'] : [], // Преобразуем объект в строку
      });

      break;
    case 'Boolean':
      decorators.push({ name: 'IsBoolean', arguments: [] });
      break;
  }

  // Добавляем валидатор для обязательного или опционального поля
  if (field.isRequired) {
    decorators.unshift({ name: 'IsDefined', arguments: [] });
  } else {
    decorators.unshift({ name: 'IsOptional', arguments: [] });
  }

  switch (field.type) {
    case 'Int':
    case 'Float':
      decorators.push({ name: 'Type', arguments: ['() => Number'] });
      break;
    case 'DateTime':
      decorators.push({ name: 'Type', arguments: ['() => Date'] });
      break;
    case 'String':
      decorators.push({ name: 'Type', arguments: ['() => String'] });
      break;
    case 'Boolean':
      decorators.push({ name: 'Type', arguments: ['() => Boolean'] });
      break;
  }

  if (field.kind === 'enum') {
    decorators.push({ name: 'IsIn', arguments: [`getEnumValues(${field.type})`] });
  }

  decorators.push({ name: 'Expose', arguments: [] });

  return decorators;
};


export const getDecoratorsImportsByType = (field: PrismaDMMF.Field) => {
  const validatorImports = new Set();
  switch (field.type) {
    case 'Int':
      validatorImports.add('IsInt');
      break;
    case 'DateTime':
      validatorImports.add('IsDate');
      break;
    case 'String':
      validatorImports.add('IsString');
      break;
    case 'Boolean':
      validatorImports.add('IsBoolean');
      break;
    case 'Decimal':
      validatorImports.add('IsDecimal');
      break;
    case 'Float':
      validatorImports.add('IsNumber');
      break;
  }
  if (field.isRequired) {
    validatorImports.add('IsDefined');
  } else {
    validatorImports.add('IsOptional');
  }
  if (field.kind === 'enum') {
    validatorImports.add('IsIn');
  }
  return [...validatorImports];
};

export const generateClassValidatorImport = (
  sourceFile: SourceFile,
  validatorImports: Array<string>,
) => {
  generateUniqueImports(sourceFile, validatorImports, 'class-validator');
};

export const generatePrismaImport = (sourceFile: SourceFile) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: ['Prisma'],
  });
};

export const generateRelationImportsImport = (
  sourceFile: SourceFile,
  relationImports: Array<string>,
) => {
  generateUniqueImports(sourceFile, relationImports.map(name => `${name}Schema`), './');
};

export const generateHelpersImports = (
  sourceFile: SourceFile,
  helpersImports: Array<string>,
) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'prisma-class-dto-generator',
    namedImports: helpersImports,
  });
};

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

export const generateClassTransformerImport = (
  sourceFile: SourceFile,
  transformerImports: Array<string>,
) => {
  generateUniqueImports(sourceFile, transformerImports, 'class-transformer');
};


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
    path.resolve(outputDir, 'preload-entities.module.ts'),
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
      if (!excludeInputModels.includes(modelName)) {
        imports.push(`Input${modelName}Schema`);
      }
      if (!excludeOutputModels.includes(modelName)) {
        imports.push(`Output${modelName}Schema`);
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
      if (!excludeInputModels.includes(modelName)) {
        entries.push(`    { name: 'Input${modelName}Schema', schema: Input${modelName}Schema },`);
      }
      if (!excludeOutputModels.includes(modelName)) {
        entries.push(`    { name: 'Output${modelName}Schema', schema: Output${modelName}Schema },`);
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
    `    if (!fastify.getSchema(schema.$id)) {`,
    `      fastify.addSchema(schema);`,
    `    }`,
    `  }`,
    `}`,
  ]);
}
