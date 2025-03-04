import OpenAI from 'openai';
import { AIProviderConfig } from '../types';
import { BaseProvider } from './base-provider';
import chalk from 'chalk';
import { ChatCompletionMessageParam } from 'openai/resources';
import util from 'util';
import { SYSTEM_MESSAGES } from '../constants/ai-messages';

export class OpenAIProvider extends BaseProvider {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      console.log(chalk.blue('\n=== OpenAI Review Request ==='));
      console.log(chalk.gray('Model:'), this.config.model);
      console.log(chalk.gray('BaseURL:'), this.config.baseURL);
      console.log(chalk.gray('API Key:'), '***[REDACTED]***');
      console.log(chalk.gray('Prompt:'), prompt);
      console.log(chalk.gray('Content Length:'), content.length);
      console.log(
        chalk.gray('Content Preview:'),
        content.slice(0, 100) + '...',
      );

      if (!content.trim()) {
        console.log(chalk.yellow('Warning: Empty content provided'));
        return 'No content to review.';
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: SYSTEM_MESSAGES.CODE_REVIEW,
        },
        {
          role: 'user',
          content: `${prompt}\n\nContent to review:\n${content}`,
        },
      ];

      const requestBody = {
        model: this.config.model || 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        stream: false as const,
      };

      console.log(chalk.blue('\n=== Request Details ==='));
      console.log(
        chalk.gray('Request Body:'),
        util.inspect(
          {
            ...requestBody,
            messages: requestBody.messages.map((msg) => ({
              ...msg,
              content: msg.content
                ? msg.content.length > 100
                  ? msg.content.slice(0, 100) + '...'
                  : msg.content
                : '[NO CONTENT]',
            })),
          },
          {
            colors: true,
            depth: 2,
            maxArrayLength: 2,
          },
        ),
      );

      console.log(chalk.blue('\n=== Making API Call ==='));
      console.log(chalk.gray('Request Config:'), {
        baseURL: this.config.baseURL,
        model: requestBody.model,
      });

      let response;
      try {
        response = await this.client.chat.completions.create(requestBody);
      } catch (apiError: any) {
        console.error(chalk.red('\n=== API Call Failed ==='));
        if (apiError.response) {
          console.error(
            chalk.gray('Response Type:'),
            apiError.response.headers?.['content-type'] || 'unknown',
          );
          console.error(
            chalk.gray('Response Status:'),
            apiError.response.status,
          );
          console.error(
            chalk.gray('Response Headers:'),
            apiError.response.headers,
          );
          console.error(chalk.gray('Response Body:'), apiError.response.data);

          // 如果返回的是 HTML，很可能是代理或认证问题
          if (
            typeof apiError.response.data === 'string' &&
            apiError.response.data.includes('<!DOCTYPE html>')
          ) {
            console.error(
              chalk.red(
                '\nReceived HTML response instead of JSON. This usually indicates:',
              ),
            );
            console.error(
              chalk.yellow(
                '1. The baseURL might be incorrect or pointing to a web interface',
              ),
            );
            console.error(
              chalk.yellow(
                '2. The proxy server might be returning an auth/error page',
              ),
            );
            console.error(
              chalk.yellow(
                '3. The API endpoint might not be properly configured',
              ),
            );
            console.error(chalk.yellow('\nPlease verify:'));
            console.error(
              chalk.yellow(
                '- The baseURL is a direct API endpoint (should end with /v1)',
              ),
            );
            console.error(
              chalk.yellow(
                '- Your API key is correctly set and has proper permissions',
              ),
            );
            console.error(
              chalk.yellow(
                "- If using a proxy, ensure it's correctly forwarding API requests",
              ),
            );
          }
        }
        throw apiError;
      }

      console.log(chalk.blue('\n=== Response Details ==='));
      console.log(
        chalk.gray('Response Object:'),
        util.inspect(response, {
          colors: true,
          depth: null,
          maxArrayLength: null,
        }),
      );

      // 如果响应是字符串，尝试解析它
      let parsedResponse;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
          console.log(chalk.blue('\n=== Parsed Response ==='));
          console.log(
            chalk.gray('Parsed Response:'),
            util.inspect(parsedResponse, {
              colors: true,
              depth: null,
              maxArrayLength: null,
            }),
          );
        } catch (parseError) {
          console.error(chalk.red('\nError: Failed to parse response string'));
          console.error(chalk.gray('Parse Error:'), parseError);
          throw new Error('Failed to parse OpenAI API response');
        }
      } else {
        parsedResponse = response;
      }

      if (
        !parsedResponse ||
        !parsedResponse.choices ||
        parsedResponse.choices.length === 0
      ) {
        console.error(chalk.red('\nError: Invalid Response Format'));
        console.error(
          chalk.gray('Response:'),
          util.inspect(parsedResponse, { colors: true, depth: null }),
        );
        throw new Error('Invalid response format from OpenAI API');
      }

      const result = parsedResponse.choices[0]?.message?.content;
      if (!result) {
        console.error(chalk.red('\nError: Empty Response Content'));
        console.error(
          chalk.gray('Choice Object:'),
          util.inspect(parsedResponse.choices[0], {
            colors: true,
            depth: null,
          }),
        );
        throw new Error('Empty response content from OpenAI API');
      }

      console.log(chalk.green('\n=== Success ==='));
      console.log(chalk.gray('Response Content:'), result);

      return result;
    } catch (error) {
      console.error(chalk.red('\n=== Error Details ==='));
      console.error(
        chalk.red('Type:'),
        error instanceof Error ? error.constructor.name : typeof error,
      );

      if (error instanceof Error) {
        console.error(chalk.red('Name:'), error.name);
        console.error(chalk.red('Message:'), error.message);
        console.error(chalk.red('Stack:'), error.stack);

        const errorMessage = error.message;
        if (errorMessage.includes('401')) {
          throw new Error(
            'OpenAI API authentication failed. Please check your API key and ensure it has the correct permissions.',
          );
        } else if (errorMessage.includes('404')) {
          throw new Error(
            'OpenAI API endpoint not found. Please verify the baseURL configuration.',
          );
        } else if (errorMessage.includes('429')) {
          throw new Error(
            'OpenAI API rate limit exceeded. Please check your API quota and try again later.',
          );
        } else if (errorMessage.includes('500')) {
          throw new Error(
            'OpenAI API internal server error. Please try again later or contact support if the issue persists.',
          );
        }

        // Log any additional error properties
        const errorObj = error as any;
        if (errorObj.response) {
          console.error(chalk.red('\nAPI Response Error:'));
          console.error(chalk.gray('Status:'), errorObj.response.status);
          console.error(
            chalk.gray('Status Text:'),
            errorObj.response.statusText,
          );
          console.error(chalk.gray('Headers:'), errorObj.response.headers);
          console.error(
            chalk.gray('Data:'),
            util.inspect(errorObj.response.data, { colors: true, depth: null }),
          );
        }
      }

      throw error;
    }
  }
}
