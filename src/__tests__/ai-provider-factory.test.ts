import { AIProviderFactory } from '../providers/ai-provider-factory';
import { OpenAIProvider } from '../providers/openai-provider';
import { DeepSeekProvider } from '../providers/deepseek-provider';

jest.mock('../providers/openai-provider');
jest.mock('../providers/deepseek-provider');

describe('AIProviderFactory', () => {
  const openaiConfig = {
    provider: 'openai',
    apiKey: 'key',
    model: '',
    baseURL: '',
    reviewLanguage: 'en',
  };
  const deepseekConfig = {
    provider: 'deepseek',
    apiKey: 'key',
    model: '',
    baseURL: '',
    reviewLanguage: 'en',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an OpenAIProvider for openai config', () => {
    const provider = AIProviderFactory.createProvider(openaiConfig as any);
    expect(OpenAIProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        apiKey: 'key',
        reviewLanguage: 'en',
      }),
    );
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create a DeepSeekProvider for deepseek config', () => {
    const provider = AIProviderFactory.createProvider(deepseekConfig as any);
    expect(DeepSeekProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'deepseek',
        apiKey: 'key',
        reviewLanguage: 'en',
      }),
    );
    expect(provider).toBeInstanceOf(DeepSeekProvider);
  });

  it('should throw for unsupported provider', () => {
    expect(() =>
      AIProviderFactory.createProvider({ provider: 'foo' } as any),
    ).toThrow('Unsupported AI provider: foo');
  });
});
