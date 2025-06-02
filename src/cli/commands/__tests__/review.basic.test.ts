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
import { setupMocks, mockConfig } from './review.utils';

export {};

describe('reviewCommand - basic functionality', () => {
  it('should successfully review commits', async () => {
    const { mockProvider, mockConfigManager } = setupMocks();

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
    expect(mockConfigManager.loadConfig).toHaveBeenCalledWith(
      'test-config.yaml',
    );
  });

  it('should handle no commits scenario', async () => {
    const { mockProvider } = setupMocks(mockConfig, []);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).not.toHaveBeenCalled();
  });

  it('should handle null commits', async () => {
    const { mockProvider, mockVcsProvider } = setupMocks();
    mockVcsProvider.getPullRequestChanges.mockResolvedValue(null);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).not.toHaveBeenCalled();
  });

  it('should handle review errors gracefully', async () => {
    const { mockProvider } = setupMocks();
    mockProvider.review.mockRejectedValue(new Error('Review failed'));

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
  });

  it('should handle config loading errors', async () => {
    const { mockConfigManager } = setupMocks();
    mockConfigManager.loadConfig.mockRejectedValue(
      new Error('Config not found'),
    );

    const result = await reviewCommand({ config: 'invalid-config.yaml' });

    expect(result).toBe(false);
  });
});
