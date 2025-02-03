import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { Config } from '../types';

const configSchema = z.object({
  ai: z.object({
    name: z.string(),
    provider: z.string(),
    apiKey: z.string(),
    model: z.string(),
  }),
  triggers: z.array(
    z.object({
      on: z.enum(['pull_request', 'merge_request', 'push']),
      actions: z.array(z.string()).optional(),
    })
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
    codeReview: z.object({
      enabled: z.boolean(),
      prompt: z.string(),
    }),
  }),
  customReviewPoints: z
    .array(
      z.object({
        name: z.string(),
        prompt: z.string(),
      })
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

  public async loadConfig(path: string = '.reviewai.yaml'): Promise<Config> {
    try {
      const configFile = await readFile(path, 'utf8');
      const parsedConfig = parse(configFile);
      const validatedConfig = configSchema.parse(parsedConfig);
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