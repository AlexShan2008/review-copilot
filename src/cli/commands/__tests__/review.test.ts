import { ConfigManager } from '../../../config/config-manager';
import { reviewCommand } from '../review';
import { ProviderFactory } from '../../../providers/provider-factory';
import { OpenAIProvider } from '../../../providers/openai-provider';
import { LocalGitProvider } from '../../../utils/local-git-provider';

// Mock dependencies
jest.mock('../../../config/config-manager');
jest.mock('../../../utils/local-git-provider');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
  }));
});

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
      },
      commitMessage: {
        enabled: true,
      },
    },
  };

  let mockProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup ConfigManager mock
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      loadConfig: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    });

    // Setup Provider mock
    mockProvider = {
      review: jest.fn().mockResolvedValue({
        success: true,
        message: 'Review completed successfully',
      }),
    } as unknown as jest.Mocked<OpenAIProvider>;
    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

    // Setup Git provider mock
    (new LocalGitProvider().getCommitsForReview as jest.Mock).mockResolvedValue(
      [mockCommit],
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should successfully review commits', async () => {
      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).toHaveBeenCalled();
    });

    it('should handle no commits scenario', async () => {
      (
        new LocalGitProvider().getCommitsForReview as jest.Mock
      ).mockResolvedValue([]);

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(true);
      expect(mockProvider.review).not.toHaveBeenCalled();
    });

    it('should handle review errors', async () => {
      mockProvider.review.mockRejectedValue(new Error('Review failed'));

      const result = await reviewCommand({ config: 'test-config.yaml' });

      expect(result).toBe(false);
    });
  });

  describe('file filtering', () => {
    it('should only review files matching patterns', async () => {
      const mockCommitWithMultipleFiles = {
        ...mockCommit,
        files: [
          { file: 'src/test.ts', changes: 'typescript code' },
          { file: 'src/ignore.js', changes: 'javascript code' },
        ],
      };

      (
        new LocalGitProvider().getCommitsForReview as jest.Mock
      ).mockResolvedValue([mockCommitWithMultipleFiles]);

      await reviewCommand({ config: 'test-config.yaml' });

      const reviewCall = mockProvider.review.mock.calls[0][1];
      expect(reviewCall).toContain('src/test.ts');
      expect(reviewCall).not.toContain('src/ignore.js');
    });
  });
});
