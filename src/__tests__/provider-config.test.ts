import { PROVIDER_DEFAULTS } from '../providers/provider-config';

describe('PROVIDER_DEFAULTS', () => {
  it('should have correct defaults for openai', () => {
    expect(PROVIDER_DEFAULTS.openai).toEqual({
      defaultBaseURL: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    });
  });

  it('should have correct defaults for deepseek', () => {
    expect(PROVIDER_DEFAULTS.deepseek).toEqual({
      defaultBaseURL: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
    });
  });
});
