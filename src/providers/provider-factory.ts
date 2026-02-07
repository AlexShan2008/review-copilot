import {
  IAIProvider,
  AIProviderType,
  ProviderFactoryConfig,
  AIProviderConfig as ProviderFactoryAIProviderConfig,
} from './provider.types';
import { AIProviderConfig, AI_PROVIDER_CONFIG } from '../types/review.types';
import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';
import chalk from 'chalk';

export class ProviderFactory {
  static createProvider(config: ProviderFactoryConfig): IAIProvider {
    if (!config.providers) {
      throw new Error(
        'No providers configuration found. Please update your configuration to use the new format.',
      );
    }

    const enabledProviders = Object.entries(config.providers).filter(
      ([_, providerConfig]) => providerConfig?.enabled,
    );

    if (enabledProviders.length === 0) {
      throw new Error(
        'No AI provider is enabled in the configuration. Please enable one provider in the providers section.',
      );
    }

    if (enabledProviders.length > 1) {
      throw new Error(
        'Multiple AI providers are enabled. Please enable only one provider.',
      );
    }

    const [providerName, providerConfig] = enabledProviders[0];
    if (!providerConfig) {
      throw new Error(
        `Provider configuration for ${providerName} is undefined`,
      );
    }

    // Ensure all required fields are present
    const requiredFields: Array<keyof ProviderFactoryAIProviderConfig> = [
      'apiKey',
      'model',
      'baseURL',
    ];
    const missingFields = requiredFields.filter(
      (field) => !providerConfig[field],
    );
    if (missingFields.length > 0) {
      const providerKey = providerName.toLowerCase() as keyof typeof AI_PROVIDER_CONFIG;
      const envVarName = AI_PROVIDER_CONFIG[providerKey]?.envKey || 'API_KEY';
      const errorMessage = missingFields.includes('apiKey')
        ? `Missing required fields for ${providerName} provider: ${missingFields.join(', ')}. Please set the ${envVarName} environment variable.`
        : `Missing required fields for ${providerName} provider: ${missingFields.join(', ')}`;
      throw new Error(errorMessage);
    }

    console.log(chalk.blue(`Using ${providerName} as AI provider`));

    const { enabled, ...providerSettings } = providerConfig;
    const settings: AIProviderConfig = {
      ...providerSettings,
      provider: providerName.toLowerCase() as AIProviderType,
    };

    this.validateProviderConfig(providerName, settings);

    switch (providerName.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(settings);
      case 'deepseek':
        return new DeepSeekProvider(settings);
      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }

  static validateConfig(config: ProviderFactoryConfig): void {
    if (!config.providers) {
      throw new Error('No providers configuration found');
    }

    Object.entries(config.providers).forEach(([name, providerConfig]) => {
      if (providerConfig?.enabled) {
        const settings: AIProviderConfig = {
          ...providerConfig,
          provider: name.toLowerCase() as AIProviderType,
        };
        this.validateProviderConfig(name, settings);
      }
    });
  }

  private static validateProviderConfig(
    name: string,
    config: AIProviderConfig,
  ): void {
    const requiredFields: Array<keyof AIProviderConfig> = [
      'apiKey',
      'model',
      'baseURL',
      'provider',
    ];
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields for ${name} provider: ${missingFields.join(
          ', ',
        )}`,
      );
    }

    // Validate baseURL format
    if (!config.baseURL.endsWith('/v1')) {
      console.warn(
        chalk.yellow(
          `Warning: ${name} provider baseURL should typically end with '/v1'`,
        ),
      );
    }
  }
}
