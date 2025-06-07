import { ProviderFactory } from '../providers/provider-factory';
import { OpenAIProvider } from '../providers/openai-provider';
import { DeepSeekProvider } from '../providers/deepseek-provider';
import {
  ProviderFactoryConfig,
  AIProviderConfig as ProviderFactoryAIProviderConfig,
} from '../providers/provider.types';

describe('ProviderFactory', () => {
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

  it('should create OpenAI provider when OpenAI is enabled', () => {
    const provider = ProviderFactory.createProvider(mockConfig);
    expect(provider).toBeInstanceOf(OpenAIProvider);
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
