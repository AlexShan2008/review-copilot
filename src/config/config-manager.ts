import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { Config } from '../types';

const providerSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string(),
  model: z.string(),
  baseURL: z.string(),
  defaultHeaders: z.record(z.string()).optional(),
  timeout: z.number().optional(),
});

const configSchema = z.object({
  providers: z.record(providerSchema),
  ai: z
    .object({
      provider: z.enum(['openai', 'deepseek']),
      apiKey: z.string(),
      model: z.string(),
      baseURL: z.string().optional(),
    })
    .optional(),
  triggers: z.array(
    z.object({
      on: z.enum(['pull_request', 'merge_request', 'push']),
      actions: z.array(z.string()).optional(),
    }),
  ),
  rules: z.object({
    commitMessage: z.object({
      enabled: z.boolean(),
      pattern: z.string().optional(),
      prompt: z.string(),
    }),
    branchName: z.object({
      enabled: z.boolean(),
      pattern: z.string().optional(),
      prompt: z.string(),
    }),
    codeChanges: z.object({
      enabled: z.boolean(),
      filePatterns: z.array(z.string()).optional(),
      prompt: z.string(),
    }),
  }),
  customReviewPoints: z
    .array(
      z.object({
        name: z.string(),
        prompt: z.string(),
      }),
    )
    .optional(),
});

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private replaceEnvVariables(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\${([^}]+)}/g, (_, key) => process.env[key] || '');
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceEnvVariables(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceEnvVariables(value);
      }
      return result;
    }

    return obj;
  }

  public async loadConfig(
    path: string = '.review-copilot.yaml',
  ): Promise<Config> {
    try {
      const configFile = await readFile(path, 'utf8');
      const parsedConfig = parse(configFile);

      // Replace environment variables before validation
      const configWithEnv = this.replaceEnvVariables(parsedConfig);

      const validatedConfig = configSchema.parse(configWithEnv);
      this.config = validatedConfig as Config;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error}`);
    }
  }

  public getConfig(): Config {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    return this.config;
  }
}
