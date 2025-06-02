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
import { setupMocks, mockConfig, mockCommit } from './review.utils';

describe('reviewCommand - edge cases', () => {
  it('should handle empty file patterns', async () => {
    const configWithEmptyPatterns = {
      ...mockConfig,
      rules: {
        ...mockConfig.rules,
        codeChanges: {
          enabled: true,
          filePatterns: [],
          prompt: 'Review this code',
        },
      },
    };
    const { mockProvider } = setupMocks(configWithEmptyPatterns);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
  });

  it('should handle commits with no files', async () => {
    const noFilesCommit = { ...mockCommit, files: [] };
    const { mockProvider } = setupMocks(mockConfig, [noFilesCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalledTimes(1);
  });

  it('should handle baseBranch parameter', async () => {
    const { mockVcsProvider } = setupMocks();

    const result = await reviewCommand({
      config: 'test-config.yaml',
      baseBranch: 'develop',
    });

    expect(result).toBe(true);
    expect(mockVcsProvider.getPullRequestChanges).toHaveBeenCalledWith(
      'develop',
    );
  });
});
