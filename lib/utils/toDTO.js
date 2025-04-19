import { plainToClass } from "class-transformer";
export function toDTO(DTOClass, data, options = {}) {
    return plainToClass(DTOClass, data, {
        ...options,
        excludeExtraneousValues: true,
    });
}
//# sourceMappingURL=toDTO.js.map