import { AIProviderConfig } from '../types';
import { BaseProvider } from './base-provider';
import chalk from 'chalk';
import { SYSTEM_MESSAGES } from '../constants/ai-messages';

export class DeepSeekProvider extends BaseProvider {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  private formatContent(prompt: string, content: string): string {
    return JSON.stringify(
      `${prompt}. Content to review:\n${content}`
        .replace(/\n{1,}/g, ' ')
        .trim(),
    );
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      console.log(chalk.blue('\nSending request to DeepSeek:'));
      console.log(chalk.gray('Model:'), this.config.model);
      console.log(chalk.gray('BaseURL:'), this.config.baseURL);
      console.log(chalk.gray('Prompt:'), prompt.slice(0, 100) + '...');
      console.log(chalk.gray('Content:'), JSON.stringify(content));

      if (!content.trim()) {
        return 'No content to review.';
      }

      const requestBody = {
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system' as const,
            content: SYSTEM_MESSAGES.CODE_REVIEW,
          },
          {
            role: 'user' as const,
            content: this.formatContent(prompt, content),
          },
        ],
        temperature: 0.5,
        stream: false as const,
        max_tokens: 8192,
      };

      console.log(chalk.gray('Request body:'), requestBody);

      const response = await this.client.chat.completions.create(requestBody);

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
