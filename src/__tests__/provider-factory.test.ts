import { ProviderFactory } from '../providers/provider-factory';
import { DeepSeekProvider } from '../providers/deepseek-provider';
import {
  ProviderFactoryConfig,
  AIProviderConfig as ProviderFactoryAIProviderConfig,
  IAIProvider,
} from '../providers/provider.types';
import OpenAI from 'openai';
import chalk from 'chalk';

// Mock chalk
jest.mock('chalk', () => ({
  blue: jest.fn((str) => str),
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
}));

// Mock OpenAI client with a simpler implementation
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('ProviderFactory', () => {
  let provider: IAIProvider;
  let mockOpenAI: jest.MockedClass<typeof OpenAI>;
  let mockChalk: jest.Mocked<typeof chalk>;
  const mockConfig: ProviderFactoryConfig = {
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        baseURL: 'https://api.openai.com/v1',
        reviewLanguage: 'en' as const,
      } as ProviderFactoryAIProviderConfig,
      deepseek: {
        enabled: false,
        apiKey: 'test-key-2',
        model: 'deepseek-chat',
        baseURL: 'https://api.deepseek.com/v1',
        reviewLanguage: 'en' as const,
      } as ProviderFactoryAIProviderConfig,
    },
    triggers: [],
    rules: {
      commitMessage: {
        enabled: true,
        pattern: '',
        prompt: '',
      },
      branchName: {
        enabled: true,
        pattern: '',
        prompt: '',
      },
      codeChanges: {
        enabled: true,
        filePatterns: [],
        prompt: '',
      },
    },
    customReviewPoints: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
    mockChalk = chalk as jest.Mocked<typeof chalk>;
  });

  afterEach(() => {
    if (provider) {
      // @ts-ignore - accessing private property for cleanup
      if (provider.client) {
        // @ts-ignore - accessing private property for cleanup
        provider.client = null;
      }
      provider = null as any;
    }
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create OpenAI provider when OpenAI is enabled', () => {
    provider = ProviderFactory.createProvider(mockConfig);
    expect(provider.constructor.name).toBe('OpenAIProvider');
    expect(mockOpenAI).toHaveBeenCalledWith({
      apiKey: (mockConfig.providers.openai as ProviderFactoryAIProviderConfig)
        .apiKey,
      baseURL: (mockConfig.providers.openai as ProviderFactoryAIProviderConfig)
        .baseURL,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    expect(mockChalk.blue).toHaveBeenCalled();
  });

  it('should create DeepSeek provider when DeepSeek is enabled', () => {
    const deepseekConfig: ProviderFactoryConfig = {
      ...mockConfig,
      providers: {
        openai: {
          enabled: false,
          apiKey: 'test-key',
          model: 'gpt-4o-mini',
          baseURL: 'https://api.openai.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
        deepseek: {
          enabled: true,
          apiKey: 'test-key-2',
          model: 'deepseek-chat',
          baseURL: 'https://api.deepseek.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
      },
    };
    const provider = ProviderFactory.createProvider(deepseekConfig);
    expect(provider).toBeInstanceOf(DeepSeekProvider);
  });

  it('should throw error when no provider is enabled', () => {
    const noProviderConfig: ProviderFactoryConfig = {
      ...mockConfig,
      providers: {
        openai: {
          enabled: false,
          apiKey: 'test-key',
          model: 'gpt-4o-mini',
          baseURL: 'https://api.openai.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
        deepseek: {
          enabled: false,
          apiKey: 'test-key-2',
          model: 'deepseek-chat',
          baseURL: 'https://api.deepseek.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
      },
    };
    expect(() => ProviderFactory.createProvider(noProviderConfig)).toThrow(
      'No AI provider is enabled',
    );
  });

  it('should throw error when multiple providers are enabled', () => {
    const multiProviderConfig: ProviderFactoryConfig = {
      ...mockConfig,
      providers: {
        openai: {
          enabled: true,
          apiKey: 'test-key',
          model: 'gpt-4o-mini',
          baseURL: 'https://api.openai.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
        deepseek: {
          enabled: true,
          apiKey: 'test-key-2',
          model: 'deepseek-chat',
          baseURL: 'https://api.deepseek.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
      },
    };
    expect(() => ProviderFactory.createProvider(multiProviderConfig)).toThrow(
      'Multiple AI providers are enabled',
    );
  });

  it('should validate provider configuration', () => {
    const invalidConfig: ProviderFactoryConfig = {
      ...mockConfig,
      providers: {
        openai: {
          enabled: true,
          apiKey: '',
          model: 'gpt-4o-mini',
          baseURL: 'https://api.openai.com/v1',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
      },
    };
    expect(() => ProviderFactory.validateConfig(invalidConfig)).toThrow(
      'Missing required fields',
    );
  });

  it('should warn about non-standard baseURL', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const nonStandardConfig: ProviderFactoryConfig = {
      ...mockConfig,
      providers: {
        openai: {
          enabled: true,
          apiKey: 'test-key',
          model: 'gpt-4o-mini',
          baseURL: 'https://api.example.com',
          reviewLanguage: 'en' as const,
        } as ProviderFactoryAIProviderConfig,
      },
    };
    ProviderFactory.validateConfig(nonStandardConfig);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("should typically end with '/v1'"),
    );
    consoleSpy.mockRestore();
  });
});
