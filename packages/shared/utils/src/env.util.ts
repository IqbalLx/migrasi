export type ConfigKey = {
  [key: string]: { envKey: string; default?: string };
};

export function readenv(configKey: ConfigKey[string]): string {
  const value = process.env[configKey.envKey];

  if (value !== undefined) return value;

  if (configKey.default !== undefined) return configKey.default;

  throw Error(`key ${configKey.envKey} not present in environments`);
}

export function validateenv(configKey: ConfigKey[string]): void {
  const value = process.env[configKey.envKey];

  if (value !== undefined) return;

  if (configKey.default !== undefined) return;

  throw Error(`key ${configKey.envKey} not present in environments`);
}
