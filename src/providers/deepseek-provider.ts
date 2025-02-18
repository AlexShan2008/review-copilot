import OpenAI from 'openai';
import chalk from 'chalk';
import { AIProviderConfig, IAIProvider } from '../types';
import { ChatCompletionMessageParam, ChatCompletion } from 'openai/resources';

export class DeepSeekProvider implements IAIProvider {
  private client: OpenAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    console.log(chalk.blue('Initializing DeepSeek provider with config:'), {
      model: config.model,
      baseURL: config.baseURL,
      apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : undefined,
    });

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      defaultQuery: undefined,
      timeout: 30000,
    });
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      console.log(chalk.blue('\nSending request to DeepSeek:'));
      console.log(chalk.gray('Model:'), this.config.model);
      console.log(chalk.gray('BaseURL:'), this.config.baseURL);
      console.log(chalk.gray('Prompt:'), prompt);
      console.log(chalk.gray('Content:'), content);

      if (!content.trim()) {
        return 'No content to review.';
      }

      const requestBody = {
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional code reviewer. Provide clear, concise, and actionable feedback.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nContent to review:\n${content}`,
          },
        ],
        temperature: 0.7,
        stream: false,
      };

      console.log(
        chalk.gray('Request body:'),
        JSON.stringify(requestBody, null, 2),
      );

      const response = (await this.client.chat.completions.create(
        JSON.parse(JSON.stringify(requestBody)),
      )) as ChatCompletion;

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Empty response from DeepSeek API');
      }

      const result = response.choices[0].message.content;
      console.log(chalk.green('\nReceived response from DeepSeek'));
      console.log(chalk.gray('Response:'), result);

      return result;
    } catch (error) {
      console.error(chalk.red('\nDeepSeek API Error:'), error);

      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('401')) {
          throw new Error(
            'DeepSeek API authentication failed. Please check your API key.',
          );
        } else if (errorMessage.includes('404')) {
          throw new Error(
            'DeepSeek API endpoint not found. Please check the API URL.',
          );
        } else if (errorMessage.includes('429')) {
          throw new Error(
            'DeepSeek API rate limit exceeded. Please try again later.',
          );
        } else if (errorMessage.includes('500')) {
          throw new Error(
            'DeepSeek API internal server error. Please try again later.',
          );
        }

        console.error(chalk.red('Error details:'), {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }

      throw error;
    }
  }
}
