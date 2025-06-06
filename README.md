# Prisma TypeBox Generator

[![NPM Version](https://img.shields.io/npm/v/prisma-fastify-typebox-generator.svg?style=for-the-badge)](https://www.npmjs.com/package/prisma-fastify-typebox-generator)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/prisma-fastify-typebox-generator.svg?style=for-the-badge&logo=github)](https://github.com/unbywyd/prisma-fastify-typebox-generator)

## ⚡ Prisma Schema Generator for TypeBox

This package generates TypeBox schemas from your Prisma schema, enabling type-safe runtime validation for your Fastify or other TypeScript applications.

## 🔹 Requirements

- Node.js >= 18.19.0
- Prisma >= 6.6.0
- TypeScript >= 5.7.2

## 🚀 Installation

```sh
npm install prisma-fastify-typebox-generator
```

## 🔧 Usage

You can use `prisma-fastify-typebox-generator` in two ways:

### CLI Mode

```sh
npx prisma-fastify-typebox-generator --path=./prisma/schema.prisma --output=./typebox-schemas
```

or install globally:

```sh
npm install -g prisma-fastify-typebox-generator
prisma-fastify-typebox-generator --path=./prisma/schema.prisma --output=./typebox-schemas
```

### Available CLI Options

```sh
Usage: prisma-fastify-typebox-generator --path=[path_to_schema]

Options:
  --help, -h            Show this help message
  --version, -v         Show the installed version
  --path=[path]         Specify a Prisma schema file (default: ./prisma/schema.prisma)
  --output=[path]       Specify the output directory (default: ./typebox-schemas)
  --configFile=[path]   Generate an empty configuration file at the specified path
```

### Programmatic Usage

```ts
import { generate } from "prisma-fastify-typebox-generator";

await generate({
  cwd: process.cwd(),
  schemaPath: "./prisma/schema.prisma",
  output: "./typebox-schemas"
});
```

## 📌 Features

- **Type-Safe Schemas** – Generate TypeBox schemas with runtime validation
- **ESM Support** – Fully compatible with modern Node.js environments
- **Fastify Integration** – Perfect for Fastify applications using TypeBox
- **Automated Schema Generation** – Creates TypeBox schemas for each Prisma model
- **List Schemas** – Supports pagination, filters, sorting, and flexible array elements
- **Enum Handling** – Generates enums from the Prisma schema
- **Selective Generation** – Fine-grained control over which models and fields to include
- **Custom Directives** – Supports `@filterable`, `@exclude input|output`, `@listable`, and `@orderable` annotations

## 🔧 Configuration

The tool allows configuring schema generation via a JSON file. You can generate an empty configuration file using the `--configFile` option:

```sh
npx prisma-fastify-typebox-generator --configFile
```

Example configuration:

```json
{
  "input": {
    "extendModels": {
      "Item": {
        "fields": [
          { "name": "title", "isRequired": false }
        ]
      }
    }
  }
}
```

## 🔗 Links & Resources

- **GitHub Repository:** [unbywyd/prisma-fastify-typebox-generator](https://github.com/unbywyd/prisma-fastify-typebox-generator)
- **NPM Package:** [prisma-fastify-typebox-generator](https://www.npmjs.com/package/prisma-fastify-typebox-generator)

## 📌 Author

Developed by [Artyom Gorlovetskiy](https://github.com/unbywyd).
