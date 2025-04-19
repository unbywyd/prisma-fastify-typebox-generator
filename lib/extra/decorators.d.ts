export declare function FixArrayJsonSchemaReference(reference: any): PropertyDecorator;
export declare function FixItemJsonSchemaReference(reference: any): PropertyDecorator;
export declare function IsEntity(typeFunction: () => Promise<Function> | Function, options?: {
    each: boolean;
}): PropertyDecorator;
export declare function ReferenceModel<T>(modelName: T): PropertyDecorator;
