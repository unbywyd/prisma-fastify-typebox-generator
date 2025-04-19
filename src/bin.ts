#!/usr/bin/env node

import { generate } from "./prisma-generator.js";

// Function to parse CLI arguments
const parseArgs = (args: string[]) => {
    const options: Record<string, string | boolean> = {};
    args.forEach(arg => {
        const match = arg.match(/^--(\w+)(?:=(.+))?$/);
        if (match) {
            const [, key, value] = match;
            options[key] = value !== undefined ? value : true;
        }
    });
    return options;
};

// CLI: process.argv
const args = process.argv.slice(2);
const options = parseArgs(args);

// Handling --help and --version flags
if (options.help || options.h) {
    console.log(`
Usage: prisma-typebox-generator --path=[path_to_schema]

Options:
  --help, -h            Show this help message
  --version, -v         Show the installed version
  --path=[path]         Specify a Prisma schema file (default: ./prisma/schema.prisma)
  --output=[path]       Specify the output directory (default: ./typebox-schemas)
  `);
    process.exit(0);
}

if (options.version || options.v) {
    console.log("PrismaTypeBoxGenerator v1.0.0");
    process.exit(0);
}

// Loading and rendering Prisma Schema
(async () => {
    try {
        const filePath = typeof options.path === "string" ? options.path : undefined;
        const outputDir = typeof options.output === "string" ? options.output : "./typebox-schemas";
        generate({
            cwd: process.cwd(),
            schemaPath: filePath,
            output: outputDir,
        }).then(() => {
            console.log("✅ TypeBox schemas generated successfully!");
            process.exit(0);
        }).catch((error) => {
            console.error(error instanceof Error ? error.message : "❌ An unknown error occurred.");
            process.exit(1);
        });
    } catch (error) {
        console.error(error instanceof Error ? error.message : "❌ An unknown error occurred.");
        process.exit(1);
    }
})();

