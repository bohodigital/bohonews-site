export function semanticJson(value) {
  if (Array.isArray(value)) return value.map(semanticJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, semanticJson(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(semanticJson(value), null, 2)}\n`;
}
