import { Config, IAIProvider, ProviderConfig, AIProviderType } from '../types';
import { OpenAIProvider } from './openai-provider';
import { DeepSeekProvider } from './deepseek-provider';
import chalk from 'chalk';

export class ProviderFactory {
  static createProvider(config: Config): IAIProvider {
    const enabledProviders = Object.entries(config.providers).filter(
      ([_, providerConfig]) => providerConfig.enabled,
    );

    if (enabledProviders.length === 0) {
      throw new Error('No AI provider is enabled in the configuration');
    }

    if (enabledProviders.length > 1) {
      throw new Error(
        'Multiple AI providers are enabled. Please enable only one provider.',
      );
    }

    const [providerName, providerConfig] = enabledProviders[0];
    console.log(chalk.blue(`Using ${providerName} as AI provider`));

    const { enabled, ...providerSettings } = providerConfig;
    const settings = {
      ...providerSettings,
      provider: providerName.toLowerCase() as AIProviderType,
    };

    switch (providerName.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(settings);
      case 'deepseek':
        return new DeepSeekProvider(settings);
      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }

  static validateConfig(config: Config): void {
    if (!config.providers) {
      throw new Error('No providers configuration found');
    }

    // 验证每个 provider 的配置
    Object.entries(config.providers).forEach(([name, providerConfig]) => {
      if (providerConfig.enabled) {
        this.validateProviderConfig(name, providerConfig);
      }
    });
  }

  private static validateProviderConfig(
    name: string,
    config: ProviderConfig,
  ): void {
    const requiredFields: Array<keyof ProviderConfig> = [
      'apiKey',
      'model',
      'baseURL',
    ];
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields for ${name} provider: ${missingFields.join(
          ', ',
        )}`,
      );
    }

    // 验证 baseURL 格式
    if (!config.baseURL.endsWith('/v1')) {
      console.warn(
        chalk.yellow(
          `Warning: ${name} provider baseURL should typically end with '/v1'`,
        ),
      );
    }
  }
}
