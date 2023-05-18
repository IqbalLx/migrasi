export function readenv(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (value !== undefined) return value;

  if (defaultValue !== undefined) return defaultValue;

  throw Error(`key ${key} not present in environments`);
}
