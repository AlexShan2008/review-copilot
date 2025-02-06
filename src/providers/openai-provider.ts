import OpenAI from 'openai';
import { AIProviderConfig, IAIProvider } from '../types';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
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
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI review failed: ${error}`);
    }
  }
}
