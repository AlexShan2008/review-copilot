import { BaseProvider } from '../providers/base-provider';
import { AIProviderConfig } from '../types/review.types';
import OpenAI from 'openai';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('chalk', () => ({
  blue: jest.fn((str) => str),
}));

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

  let consoleSpy: jest.SpyInstance;
  let mockOpenAI: jest.MockedClass<typeof OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should initialize OpenAI client with config', () => {
    new TestProvider(mockConfig);

    expect(mockOpenAI).toHaveBeenCalledWith({
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

    expect(mockOpenAI).toHaveBeenCalledWith(
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

    expect(mockOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 60000,
      }),
    );
  });

  it('should mask API key in logs', () => {
    new TestProvider(mockConfig);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        apiKey: expect.stringContaining('***'),
      }),
    );
  });

  it('should handle undefined API key in logs', () => {
    const configWithoutApiKey = { ...mockConfig, apiKey: '' };

    new TestProvider(configWithoutApiKey);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        apiKey: undefined,
      }),
    );
  });
});
