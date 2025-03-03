import OpenAI from 'openai';
import chalk from 'chalk';
import type { AIProviderConfig, IAIProvider } from '../types';

export abstract class BaseProvider implements IAIProvider {
  protected client: OpenAI;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    console.log(chalk.blue('Initializing provider with config:'), {
      model: config.model,
      baseURL: config.baseURL,
      apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : undefined,
    });

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders || {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 60000,
    });
  }

  abstract review(prompt: string, content: string): Promise<string>;
}
