import { ClassTransformOptions } from "class-transformer";
type Constructor<T> = new () => T;
export declare function toDTO<T>(DTOClass: Constructor<T>, data: any, options?: Partial<ClassTransformOptions>): T;
export {};
