import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import {
  AIProviderType,
  ProviderFactoryConfig,
  TriggerConfig,
} from '../providers/provider.types';
import { ReviewLanguage } from '../constants/ai-messages';

const providerSchema = z
  .object({
    enabled: z.boolean(),
    apiKey: z.string(),
    model: z.string(),
    baseURL: z.string(),
    defaultHeaders: z.record(z.string()).optional(),
    timeout: z.number().optional(),
    reviewLanguage: z.enum(['en', 'zh', 'ja', 'ko'] as const).optional(),
  })
  .transform((config) => ({
    enabled: config.enabled,
    apiKey: config.apiKey,
    model: config.model,
    baseURL: config.baseURL,
    reviewLanguage: config.reviewLanguage as ReviewLanguage | undefined,
  }));

const triggerSchema = z.object({
  on: z.enum(['pull_request', 'merge_request', 'push'] as const),
  actions: z.array(z.string()).optional(),
}) satisfies z.ZodType<TriggerConfig>;

const configSchema = z
  .object({
    providers: z.record(z.string(), providerSchema).transform((providers) => {
      const enabledProvider =
        (Object.entries(providers).find(
          ([_, p]) => p.enabled,
        )?.[0] as AIProviderType) || 'openai';
      if (!['openai', 'deepseek'].includes(enabledProvider)) {
        throw new Error(`Unsupported provider type: ${enabledProvider}`);
      }
      return { [enabledProvider]: providers[enabledProvider] };
    }),
    triggers: z.array(triggerSchema),
    rules: z.object({
      commitMessage: z
        .object({
          enabled: z.boolean(),
          pattern: z.string().optional(),
          prompt: z.string(),
        })
        .transform((rule) => ({
          ...rule,
          pattern: rule.pattern || '',
        })),
      branchName: z
        .object({
          enabled: z.boolean(),
          pattern: z.string().optional(),
          prompt: z.string(),
        })
        .transform((rule) => ({
          ...rule,
          pattern: rule.pattern || '',
        })),
      codeChanges: z
        .object({
          enabled: z.boolean(),
          filePatterns: z.array(z.string()).optional(),
          prompt: z.string(),
        })
        .transform((rule) => ({
          ...rule,
          filePatterns: rule.filePatterns || [],
        })),
    }),
    customReviewPoints: z
      .array(
        z.object({
          name: z.string(),
          prompt: z.string(),
        }),
      )
      .optional()
      .transform((points) => points || []),
  })
  .transform((config) => ({
    providers: config.providers,
    triggers: config.triggers,
    rules: config.rules,
    customReviewPoints: config.customReviewPoints,
  }));

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ProviderFactoryConfig | null = null;
  private configPromise: Promise<ProviderFactoryConfig> | null = null;

  private constructor() {}

  public static async getInstance(configPath?: string): Promise<ConfigManager> {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
      await ConfigManager.instance.loadConfig(configPath);
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

  private async loadConfig(
    path: string = '.review-copilot.yaml',
  ): Promise<ProviderFactoryConfig> {
    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = (async () => {
      try {
        const configFile = await readFile(path, 'utf8');
        const parsedConfig = parse(configFile);
        const configWithEnv = this.replaceEnvVariables(parsedConfig);
        this.config = configSchema.parse(configWithEnv);
        return this.config;
      } catch (error) {
        // Reset the promise on error
        this.configPromise = null;
        this.config = null;
        throw new Error('Failed to load config');
      }
    })();

    return this.configPromise;
  }

  public getConfig(): ProviderFactoryConfig {
    if (!this.config) {
      throw new Error(
        'Config not loaded. Please ensure getInstance() was and awaited.',
      );
    }
    return this.config;
  }
}
