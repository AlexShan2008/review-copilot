import { BaseProvider } from '../providers/base-provider';
import { AIProviderConfig } from '../types/review.types';
import OpenAI from 'openai';

jest.mock('openai');

class TestProvider extends BaseProvider {
  async review(prompt: string, content: string): Promise<string> {
    return 'test review';
  }
}

describe('BaseProvider', () => {
  const mockConfig: AIProviderConfig = {
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    defaultHeaders: {
      'X-Custom-Header': 'test',
    },
    timeout: 30000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize OpenAI client with config', () => {
    new TestProvider(mockConfig);
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: mockConfig.apiKey,
      baseURL: mockConfig.baseURL,
      defaultHeaders: mockConfig.defaultHeaders,
      timeout: mockConfig.timeout,
    });
  });

  it('should use default headers if not provided', () => {
    const configWithoutHeaders = { ...mockConfig };
    delete configWithoutHeaders.defaultHeaders;
    new TestProvider(configWithoutHeaders);
    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('should use default timeout if not provided', () => {
    const configWithoutTimeout = { ...mockConfig };
    delete configWithoutTimeout.timeout;
    new TestProvider(configWithoutTimeout);
    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 60000,
      }),
    );
  });

  it('should mask API key in logs', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    new TestProvider(mockConfig);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        apiKey: expect.stringContaining('***'),
      }),
    );
    consoleSpy.mockRestore();
  });
});
