import OpenAI from 'openai';
import { AIProvider } from '../types';

export class OpenAIProvider {
  private client: OpenAI;

  constructor(config: AIProvider) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async review(prompt: string, content: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional code reviewer. Provide clear, concise, and actionable feedback.',
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