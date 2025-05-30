import { ProviderFactory } from '../providers/provider-factory';
import { OpenAIProvider } from '../providers/openai-provider';
import { DeepSeekProvider } from '../providers/deepseek-provider';
import { Config } from '../types';

describe('ProviderFactory', () => {
  const mockConfig: Config = {
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        baseURL: 'https://api.openai.com/v1',
      },
      deepseek: {
        enabled: false,
        apiKey: 'test-key-2',
        model: 'deepseek-chat',
        baseURL: 'https://api.deepseek.com/v1',
      },
    },
    ai: {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      baseURL: 'https://api.openai.com/v1',
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
    const deepseekConfig = {
      ...mockConfig,
      providers: {
        openai: { ...mockConfig.providers.openai, enabled: false },
        deepseek: { ...mockConfig.providers.deepseek, enabled: true },
      },
    };
    const provider = ProviderFactory.createProvider(deepseekConfig);
    expect(provider).toBeInstanceOf(DeepSeekProvider);
  });

  it('should throw error when no provider is enabled', () => {
    const noProviderConfig = {
      ...mockConfig,
      providers: {
        openai: { ...mockConfig.providers.openai, enabled: false },
        deepseek: { ...mockConfig.providers.deepseek, enabled: false },
      },
    };
    expect(() => ProviderFactory.createProvider(noProviderConfig)).toThrow(
      'No AI provider is enabled',
    );
  });

  it('should throw error when multiple providers are enabled', () => {
    const multiProviderConfig = {
      ...mockConfig,
      providers: {
        openai: { ...mockConfig.providers.openai, enabled: true },
        deepseek: { ...mockConfig.providers.deepseek, enabled: true },
      },
    };
    expect(() => ProviderFactory.createProvider(multiProviderConfig)).toThrow(
      'Multiple AI providers are enabled',
    );
  });

  it('should validate provider configuration', () => {
    const invalidConfig = {
      ...mockConfig,
      providers: {
        openai: { ...mockConfig.providers.openai, apiKey: '' },
      },
    };
    expect(() => ProviderFactory.validateConfig(invalidConfig)).toThrow(
      'Missing required fields',
    );
  });

  it('should warn about non-standard baseURL', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const nonStandardConfig = {
      ...mockConfig,
      providers: {
        openai: {
          ...mockConfig.providers.openai,
          baseURL: 'https://api.example.com',
        },
      },
    };
    ProviderFactory.validateConfig(nonStandardConfig);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("should typically end with '/v1'"),
    );
    consoleSpy.mockRestore();
  });
});
