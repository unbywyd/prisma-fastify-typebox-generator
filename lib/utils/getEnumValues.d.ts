type EnumLike = Array<unknown> | Record<string, unknown>;
export declare function getEnumValues<T extends EnumLike>(enumType: T): Array<string>;
export {};
