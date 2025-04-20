# Prisma TypeBox Generator

[![NPM Version](https://img.shields.io/npm/v/prisma-fastify-typebox-generator.svg?style=for-the-badge)](https://www.npmjs.com/package/prisma-fastify-typebox-generator)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/prisma-fastify-typebox-generator.svg?style=for-the-badge&logo=github)](https://github.com/unbywyd/prisma-fastify-typebox-generator)

## ⚡ Prisma Schema Generator – CLI & Programmatic Usage

This package is part of the Prisma schema generation ecosystem, offering two specialized generators:

1. **Prisma Fastify TypeBox Generator** (this package) - Generates TypeBox schemas for TSDIAPI framework
2. **Prisma Class DTO Generator** - Generates DTO classes for Routing Controllers framework

Both generators share the same configuration format and UI constructor, but produce different output formats optimized for their respective frameworks.

**[Prisma Schema Generator UI Constructor](https://prisma-dto-generator.netlify.app/)** is an intuitive UI tool that helps generate configurations for both generators. Define your settings visually, export a `generator-config.json`, and seamlessly integrate schema generation into your workflow.

## 🔹 How It Works

You can use `prisma-fastify-typebox-generator` in two ways:
1. **CLI Mode** – Run from the command line
2. **Programmatic Mode** – Import and execute within your Node.js application

### 🚀 CLI Usage

```sh
npx prisma-fastify-typebox-generator --path=./prisma/schema.prisma --output=./typebox-schemas
```

or install globally:

```sh
npm install -g prisma-fastify-typebox-generator
prisma-fastify-typebox-generator --path=./prisma/schema.prisma --output=./typebox-schemas
```

### 🎛 Available CLI Options

```sh
Usage: prisma-fastify-typebox-generator --path=[path_to_schema]

Options:
  --help, -h            Show this help message
  --version, -v         Show the installed version
  --path=[path]         Specify a Prisma schema file (default: ./prisma/schema.prisma)
  --output=[path]       Specify the output directory (default: ./typebox-schemas)
```

### 🎯 Why Use It?
✅ **Type-Safe Schemas** – Generate TypeBox schemas with runtime validation
✅ **ESM Support** – Fully compatible with modern Node.js environments
✅ **Fastify Integration** – Perfect for Fastify applications using TypeBox
✅ **Consistent & Maintainable** – Ensures uniform schema structures

## 📦 Programmatic Usage

You can also use it inside a Node.js project:

```ts
import { generate } from "prisma-fastify-typebox-generator";

await generate({
  cwd: process.cwd(),
  schemaPath: "./prisma/schema.prisma",
  output: "./typebox-schemas"
});
```

## 📌 Features

- **Automated Schema Generation** – Creates TypeBox schemas for each Prisma model
- **List Schemas** – Supports pagination, filters, sorting, and flexible array elements
- **Enum Handling** – Generates enums from the Prisma schema
- **Selective Generation** – Fine-grained control over which models and fields to include
- **Custom Directives** – Supports `@filterable`, `@exclude input|output`, `@listable`, and `@orderable` annotations
- **TypeBox Integration** – Seamless integration with TypeBox for runtime validation
- **Fastify Support** – Optimized for Fastify applications using TypeBox

## 🛠 Installation

```sh
npm install prisma-fastify-typebox-generator
```

or

```sh
yarn add prisma-fastify-typebox-generator
```

## 🔧 Configuration

The tool allows configuring schema generation via a JSON file:

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

## 📄 Example Prisma Schema Configuration

To integrate with Prisma, add a generator entry in `schema.prisma`:

```prisma
generator typebox {
  provider   = "node node_modules/prisma-fastify-typebox-generator"
  output     = "../src/typebox-schemas"
  configPath = "./"
}
```

## 🔗 Links & Resources

- **Website:** [Prisma Schema Generator](https://prisma-dto-generator.netlify.app/)
- **GitHub Repository:** [unbywyd/prisma-fastify-typebox-generator](https://github.com/unbywyd/prisma-fastify-typebox-generator)
- **NPM Package:** [prisma-fastify-typebox-generator](https://www.npmjs.com/package/prisma-fastify-typebox-generator)
- **Related Package:** [prisma-class-dto-generator](https://www.npmjs.com/package/prisma-class-dto-generator)

## 📌 Author

Developed by [unbywyd](https://unbywyd.com).
