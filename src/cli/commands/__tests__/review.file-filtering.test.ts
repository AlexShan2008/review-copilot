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

export {};

describe('reviewCommand - file filtering', () => {
  it('should only review files matching patterns', async () => {
    const multiFileCommit = {
      ...mockCommit,
      files: [
        { file: 'src/test.ts', changes: 'typescript code' },
        { file: 'src/ignore.js', changes: 'javascript code' },
        { file: 'README.md', changes: 'documentation' },
      ],
    };
    const { mockProvider } = setupMocks(mockConfig, [multiFileCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
  });

  it('should handle files with invalid changes', async () => {
    const invalidCommit = {
      ...mockCommit,
      files: [
        { file: 'src/test.ts', changes: '' },
        { file: 'src/valid.ts', changes: 'valid typescript code' },
      ],
    };
    const { mockProvider } = setupMocks(mockConfig, [invalidCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
  });

  it('should truncate large files', async () => {
    const largeCommit = {
      ...mockCommit,
      files: [{ file: 'src/large.ts', changes: 'a'.repeat(60000) }],
    };
    const { mockProvider } = setupMocks(mockConfig, [largeCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    const reviewCall = mockProvider.review.mock.calls[0];
    expect(reviewCall[1]).toContain('content truncated for size limit');
  });
});
