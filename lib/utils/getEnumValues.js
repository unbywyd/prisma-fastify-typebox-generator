export function getEnumValues(enumType) {
    return Array.from(new Set(Object.keys(enumType)
        .filter((key) => isNaN(Number(key))) // Оставляем только строковые ключи
        .map((key) => enumType[key]) // Получаем значения из enum
        .filter((value) => typeof value === 'string') // Убираем нестроковые значения
    ));
}
//# sourceMappingURL=getEnumValues.js.map