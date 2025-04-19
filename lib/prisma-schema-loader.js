import fs from "fs";
import path from "path";
export const loadPrismaSchema = async (cwd, inputPath) => {
    let schemaPath = null;
    // Check if a path is provided
    if (inputPath) {
        // Determine if the path is absolute or relative
        const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
        if (fs.existsSync(resolvedPath)) {
            const stat = fs.statSync(resolvedPath);
            if (stat.isDirectory()) {
                // If it's a directory, look for `schema.prisma`
                const possibleSchemaPaths = [
                    path.join(resolvedPath, "prisma", "schema.prisma"),
                    path.join(resolvedPath, "schema.prisma")
                ];
                schemaPath = possibleSchemaPaths.find(fs.existsSync) || null;
            }
            else if (stat.isFile()) {
                // If it's a file, use it directly
                schemaPath = resolvedPath;
            }
        }
        if (!schemaPath) {
            throw new Error(`❌ Path "${inputPath}" does not point to a valid Prisma schema file or directory.`);
        }
    }
    else {
        // If no path is provided, look in standard locations
        const possibleSchemaPaths = [
            path.join(cwd, "prisma", "schema.prisma"),
            path.join(cwd, "schema.prisma")
        ];
        schemaPath = possibleSchemaPaths.find(fs.existsSync) || null;
    }
    // If no file is found, throw an error
    if (!schemaPath) {
        throw new Error(`❌ Prisma schema file not found. Please ensure that the schema.prisma file exists in the "prisma" directory or provide a valid path.`);
    }
    // Read the file
    const schemaContent = await fs.promises.readFile(schemaPath, "utf-8");
    // Check if it's really a Prisma schema (look for keywords)
    if (!/^\s*(generator|datasource|client)\b/m.test(schemaContent)) {
        throw new Error(`❌ The file at "${schemaPath}" does not appear to be a valid Prisma schema.`);
    }
    return { schema: schemaContent, path: schemaPath };
};
//# sourceMappingURL=prisma-schema-loader.js.map