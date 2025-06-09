import { AIProviderConfig } from '../types/review.types';
import { BaseProvider } from './base-provider';
import { ChatCompletionMessageParam } from 'openai/resources';
import util from 'util';
import { SYSTEM_MESSAGES } from '../constants/ai-messages';
import { Logger } from '../utils/logger';

export class OpenAIProvider extends BaseProvider {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      Logger.info('\n=== OpenAI Review Request ===');
      Logger.gray('Model: ' + this.config.model);
      Logger.gray('BaseURL: ' + this.config.baseURL);
      Logger.gray('API Key: ***[REDACTED]***');
      Logger.gray('Prompt: ' + prompt);
      Logger.gray('Content Length: ' + content.length);
      Logger.gray('Content Preview: ' + content.slice(0, 100) + '...');

      if (!content.trim()) {
        Logger.warning('Warning: Empty content provided');
        return 'No content to review.';
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: SYSTEM_MESSAGES.CODE_REVIEW(this.config.reviewLanguage),
        },
        {
          role: 'user',
          content: `${prompt}\n\nContent to review:\n${content}`,
        },
      ];

      const requestBody = {
        model: this.config.model,
        messages,
        temperature: 0.7,
        stream: false as const,
      };

      Logger.info('\n=== Request Details ===');
      Logger.gray(
        'Request Body: ' +
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

      Logger.info('\n=== Making API Call ===');
      Logger.gray(
        'Request Config: ' +
          JSON.stringify({
            baseURL: this.config.baseURL,
            model: requestBody.model,
          }),
      );

      let response;
      try {
        response = await this.client.chat.completions.create(requestBody);
      } catch (apiError: any) {
        Logger.error('\n=== API Call Failed ===');
        if (apiError.response) {
          Logger.gray(
            'Response Type: ' +
              (apiError.response.headers?.['content-type'] || 'unknown'),
          );
          Logger.gray('Response Status: ' + apiError.response.status);
          Logger.gray(
            'Response Headers: ' + util.inspect(apiError.response.headers),
          );
          Logger.gray('Response Body: ' + util.inspect(apiError.response.data));

          if (
            typeof apiError.response.data === 'string' &&
            apiError.response.data.includes('<!DOCTYPE html>')
          ) {
            Logger.error(
              '\nReceived HTML response instead of JSON. This usually indicates:',
            );
            Logger.warning(
              '1. The baseURL might be incorrect or pointing to a web interface',
            );
            Logger.warning(
              '2. The proxy server might be returning an auth/error page',
            );
            Logger.warning(
              '3. The API endpoint might not be properly configured',
            );
            Logger.warning('\nPlease verify:');
            Logger.warning(
              '- The baseURL is a direct API endpoint (should end with /v1)',
            );
            Logger.warning(
              '- Your API key is correctly set and has proper permissions',
            );
            Logger.warning(
              "- If using a proxy, ensure it's correctly forwarding API requests",
            );
          }
        }
        throw apiError;
      }

      Logger.info('\n=== Response Details ===');
      Logger.gray(
        'Response Object: ' +
          util.inspect(response, {
            colors: true,
            depth: null,
            maxArrayLength: null,
          }),
      );

      let parsedResponse;
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
          Logger.info('\n=== Parsed Response ===');
          Logger.gray(
            'Parsed Response: ' +
              util.inspect(parsedResponse, {
                colors: true,
                depth: null,
                maxArrayLength: null,
              }),
          );
        } catch (parseError) {
          Logger.error('\nError: Failed to parse response string');
          Logger.gray('Parse Error: ' + util.inspect(parseError));
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
        Logger.error('\nError: Invalid Response Format');
        Logger.gray(
          'Response: ' +
            util.inspect(parsedResponse, { colors: true, depth: null }),
        );
        throw new Error('Invalid response format from OpenAI API');
      }

      const result = parsedResponse.choices[0]?.message?.content;
      if (!result) {
        Logger.error('\nError: Empty Response Content');
        Logger.gray(
          'Choice Object: ' +
            util.inspect(parsedResponse.choices[0], {
              colors: true,
              depth: null,
            }),
        );
        throw new Error('Empty response content from OpenAI API');
      }

      Logger.success('\n=== Success ===');
      Logger.gray('Response Content: ' + result);

      return result;
    } catch (error) {
      Logger.error('\n=== Error Details ===');
      Logger.error(
        'Type: ' +
          (error instanceof Error ? error.constructor.name : typeof error),
      );

      if (error instanceof Error) {
        Logger.error('Name: ' + error.name);
        Logger.error('Message: ' + error.message);
        Logger.error('Stack: ' + error.stack);

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
          Logger.error('\nAPI Response Error:');
          Logger.gray('Status: ' + errorObj.response.status);
          Logger.gray('Status Text: ' + errorObj.response.statusText);
          Logger.gray('Headers: ' + util.inspect(errorObj.response.headers));
          Logger.gray(
            'Data: ' +
              util.inspect(errorObj.response.data, {
                colors: true,
                depth: null,
              }),
          );
        }
      }

      throw error;
    }
  }
}
