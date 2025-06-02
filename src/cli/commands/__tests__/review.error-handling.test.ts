jest.mock('../../../config/config-manager', () => ({
  ConfigManager: {
    getInstance: jest.fn(),
  },
}));
jest.mock('../../../utils/vcs-factory', () => ({
  getVcsProvider: jest.fn(),
}));
jest.mock('../../../providers/provider-factory', () => ({
  ProviderFactory: {
    createProvider: jest.fn(),
  },
}));
jest.mock('../../../providers/openai-provider', () => ({
  OpenAIProvider: jest.fn(),
}));
jest.mock('../../../services/git-platform-factory', () => ({
  GitPlatformFactory: {
    createService: jest.fn(),
  },
}));
jest.mock('micromatch', () => ({
  isMatch: jest.fn((file: string, pattern: string) => {
    if (pattern === '**/*.ts') return file.endsWith('.ts');
    if (pattern === '**/*.{ts,tsx,js,jsx}')
      return /\.(ts|tsx|js|jsx)$/.test(file);
    return true;
  }),
}));
jest.mock('ora', () =>
  jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
  })),
);
jest.mock('chalk', () => ({
  blue: jest.fn((str: any) => String(str)),
  green: jest.fn((str: any) => String(str)),
  yellow: jest.fn((str: any) => String(str)),
  cyan: jest.fn((str: any) => String(str)),
  white: jest.fn((str: any) => String(str)),
  gray: jest.fn((str: any) => String(str)),
  red: jest.fn((str: any) => String(str)),
  bold: jest.fn((str: any) => String(str)),
}));

import { reviewCommand } from '../review';
import { setupMocks } from './review.utils';
import { ProviderFactory } from '../../../providers/provider-factory';

describe('reviewCommand - error handling', () => {
  it('should handle provider creation errors', async () => {
    setupMocks();
    (ProviderFactory.createProvider as jest.Mock).mockImplementation(() => {
      throw new Error('Provider creation failed');
    });

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(false);
  });

  it('should handle VCS provider errors', async () => {
    const { mockVcsProvider } = setupMocks();
    mockVcsProvider.getPullRequestChanges.mockRejectedValue(
      new Error('Git error'),
    );

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(false);
  });

  it('should handle OpenAI errors', async () => {
    const { mockProvider } = setupMocks();
    const openAIError = new Error(
      'API Error Details: {"error":{"type":"invalid_request_error"}}',
    );
    mockProvider.review.mockRejectedValue(openAIError);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
  });
});
