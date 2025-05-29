import { ConfigManager } from '../../../config/config-manager';
import { reviewCommand } from '../review';
import { ProviderFactory } from '../../../providers/provider-factory';
import { OpenAIProvider } from '../../../providers/openai-provider';
import { getVcsProvider } from '../../../utils/vcs-factory';

// Mock dependencies
jest.mock('../../../config/config-manager');
jest.mock('../../../utils/vcs-factory');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('../../../services/git-platform-factory');

// Enhanced mock for ora with proper cleanup
const mockOraInstance = {
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  text: '',
};

jest.mock('ora', () => jest.fn(() => mockOraInstance));

// Mock chalk to prevent memory issues with colors
jest.mock('chalk', () => ({
  blue: jest.fn((str) => str),
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  cyan: jest.fn((str) => str),
  white: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  red: jest.fn((str) => str),
  bold: jest.fn((str) => str),
}));

describe('reviewCommand', () => {
  // Setup test data
  const mockCommit = {
    hash: 'abc123',
    date: '2024-01-01',
    message: 'feat: test commit',
    author: 'Test Author',
    files: [
      {
        file: 'src/test.ts',
        changes: 'test code changes',
      },
    ],
  };

  const mockConfig = {
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4',
      },
    },
    rules: {
      codeChanges: {
        enabled: true,
        filePatterns: ['**/*.ts'],
        prompt: 'Review this code',
      },
      commitMessage: {
        enabled: true,
        prompt: 'Review this commit message',
      },
      branchName: {
        enabled: false,
        prompt: 'Review this branch name',
      },
    },
  };

  let mockProvider: jest.Mocked<OpenAIProvider>;
  let mockConfigManager: any;
  let mockVcsProvider: any;
  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock console methods to prevent memory leaks from logging
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console methods
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset mock implementations
    mockOraInstance.start.mockClear();
    mockOraInstance.stop.mockClear();
    mockOraInstance.succeed.mockClear();
    mockOraInstance.fail.mockClear();
    mockOraInstance.info.mockClear();

    // Setup ConfigManager mock
    mockConfigManager = {
      loadConfig: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    };
    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockConfigManager);

    // Setup Provider mock
    mockProvider = {
      review: jest.fn().mockResolvedValue({
        success: true,
        message: 'Review completed successfully',
      }),
    } as unknown as jest.Mocked<OpenAIProvider>;
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

    // Setup VCS provider mock
    mockVcsProvider = {
      getPullRequestChanges: jest.fn().mockResolvedValue([mockCommit]),
      getCurrentBranchName: jest.fn().mockResolvedValue('feature/test'),
    };
    (getVcsProvider as jest.Mock).mockReturnValue(mockVcsProvider);

    // Mock environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();

    // Ensure all timers are cleared
    jest.clearAllTimers();

    // Clean up any remaining promises
    return new Promise((resolve) => setImmediate(resolve));
  });

  describe('basic functionality', () => {
    it('should successfully review commits', async () => {
      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).toHaveBeenCalled();
      expect(mockOraInstance.start).toHaveBeenCalled();
      expect(mockOraInstance.stop).toHaveBeenCalled();
      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith(
        'test-config.yaml',
      );
    });

    it('should handle no commits scenario', async () => {
      mockVcsProvider.getPullRequestChanges.mockResolvedValue([]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).not.toHaveBeenCalled();
      expect(mockOraInstance.start).toHaveBeenCalled();
      expect(mockOraInstance.succeed).toHaveBeenCalled();
    });

    it('should handle null/undefined commits', async () => {
      mockVcsProvider.getPullRequestChanges.mockResolvedValue(null);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).not.toHaveBeenCalled();
      expect(mockOraInstance.info).toHaveBeenCalledWith(
        'No commits to review.',
      );
    });

    it('should handle review errors gracefully', async () => {
      const testError = new Error('Review failed');
      mockProvider.review.mockRejectedValue(testError);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(false);
      expect(mockOraInstance.start).toHaveBeenCalled();
      expect(mockOraInstance.fail).toHaveBeenCalledWith('Review failed');
    });

    it('should handle config loading errors', async () => {
      mockConfigManager.loadConfig.mockRejectedValue(
        new Error('Config not found'),
      );

      const result = await reviewCommand({ config: 'invalid-config.yaml' });

      expect(result).toBe(false);
      expect(mockOraInstance.fail).toHaveBeenCalled();
    });
  });

  describe('file filtering', () => {
    it('should only review files matching patterns', async () => {
      const mockCommitWithMultipleFiles = {
        ...mockCommit,
        files: [
          { file: 'src/test.ts', changes: 'typescript code' },
          { file: 'src/ignore.js', changes: 'javascript code' },
          { file: 'README.md', changes: 'documentation' },
        ],
      };

      mockVcsProvider.getPullRequestChanges.mockResolvedValue([
        mockCommitWithMultipleFiles,
      ]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).toHaveBeenCalled();

      // Check that only .ts files are reviewed
      const reviewCalls = mockProvider.review.mock.calls;
      const codeReviewCall = reviewCalls.find((call) =>
        call[1].includes('src/test.ts'),
      );
      expect(codeReviewCall).toBeDefined();
      expect(codeReviewCall?.[1]).not.toContain('src/ignore.js');
      expect(codeReviewCall?.[1]).not.toContain('README.md');
    });

    it('should handle files with non-string changes', async () => {
      const mockCommitWithInvalidChanges = {
        ...mockCommit,
        files: [
          { file: 'src/test.ts', changes: null },
          { file: 'src/valid.ts', changes: 'valid typescript code' },
        ],
      };

      mockVcsProvider.getPullRequestChanges.mockResolvedValue([
        mockCommitWithInvalidChanges,
      ]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).toHaveBeenCalled();
    });

    it('should truncate large files', async () => {
      const largeContent = 'a'.repeat(60000); // Larger than MAX_FILE_SIZE
      const mockCommitWithLargeFile = {
        ...mockCommit,
        files: [{ file: 'src/large.ts', changes: largeContent }],
      };

      mockVcsProvider.getPullRequestChanges.mockResolvedValue([
        mockCommitWithLargeFile,
      ]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);

      // Verify content was truncated
      const reviewCall = mockProvider.review.mock.calls[0];
      expect(reviewCall[1]).toContain('content truncated for size limit');
    });
  });

  describe('different review types', () => {
    it('should review commit messages when enabled', async () => {
      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);

      // Should have both code and commit message reviews
      expect(mockProvider.review).toHaveBeenCalledTimes(2);

      const calls = mockProvider.review.mock.calls;
      const commitMessageCall = calls.find(
        (call) => call[0] === 'Review this commit message',
      );
      expect(commitMessageCall).toBeDefined();
      expect(commitMessageCall?.[1]).toBe('feat: test commit');
    });

    it('should skip disabled review types', async () => {
      const configWithDisabledCommitReview = {
        ...mockConfig,
        rules: {
          ...mockConfig.rules,
          commitMessage: {
            enabled: false,
            prompt: 'Review this commit message',
          },
        },
      };

      mockConfigManager.getConfig.mockReturnValue(
        configWithDisabledCommitReview,
      );

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);

      // Should only have code review, not commit message review
      expect(mockProvider.review).toHaveBeenCalledTimes(1);

      const calls = mockProvider.review.mock.calls;
      const codeReviewCall = calls.find(
        (call) => call[0] === 'Review this code',
      );
      expect(codeReviewCall).toBeDefined();
    });

    it('should review branch name when enabled', async () => {
      const configWithBranchReview = {
        ...mockConfig,
        rules: {
          ...mockConfig.rules,
          branchName: {
            enabled: true,
            prompt: 'Review this branch name',
          },
        },
      };

      mockConfigManager.getConfig.mockReturnValue(configWithBranchReview);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockVcsProvider.getCurrentBranchName).toHaveBeenCalled();

      // Should have code, commit message, and branch name reviews
      expect(mockProvider.review).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle provider creation errors', async () => {
      (ProviderFactory.createProvider as jest.Mock).mockImplementation(() => {
        throw new Error('Provider creation failed');
      });

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(false);
      expect(mockOraInstance.fail).toHaveBeenCalled();
    });

    it('should handle VCS provider errors', async () => {
      mockVcsProvider.getPullRequestChanges.mockRejectedValue(
        new Error('Git error'),
      );

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(false);
      expect(mockOraInstance.fail).toHaveBeenCalled();
    });

    it('should handle errors with detailed OpenAI error info', async () => {
      const openAIError = new Error(
        'API Error Details: {"error":{"type":"invalid_request_error","code":"invalid_api_key","message":"Invalid API key"}}',
      );
      mockProvider.review.mockRejectedValue(openAIError);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(false);
      expect(mockOraInstance.fail).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
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

      mockConfigManager.getConfig.mockReturnValue(configWithEmptyPatterns);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      // Should use default patterns
      expect(mockProvider.review).toHaveBeenCalled();
    });

    it('should handle commits with no files', async () => {
      const commitWithNoFiles = {
        ...mockCommit,
        files: [],
      };

      mockVcsProvider.getPullRequestChanges.mockResolvedValue([
        commitWithNoFiles,
      ]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      // Should still review commit message
      expect(mockProvider.review).toHaveBeenCalledTimes(1);
    });

    it('should handle baseBranch parameter', async () => {
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
});
