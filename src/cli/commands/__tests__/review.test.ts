import { ConfigManager } from '../../../config/config-manager';
import { reviewCommand } from '../review';
import {
  getGitChanges,
  getCurrentBranchName,
  getCurrentCommitMessage,
} from '../../../utils/git';
import { ProviderFactory } from '../../../providers/provider-factory';
import { OpenAIProvider } from '../../../providers/openai-provider';

jest.mock('../../../config/config-manager');
jest.mock('../../../utils/git');
jest.mock('../../../providers/provider-factory');

describe('review-copilot CLI', () => {
  let mockInstance: jest.Mocked<ConfigManager>;
  let mockProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigManager
    mockInstance = {
      loadConfig: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockReturnValue({
        providers: {
          openai: {
            enabled: true,
            apiKey: 'test-key',
            model: 'gpt-4',
            baseURL: 'https://api.openai.com/v1',
          },
        },
        rules: {
          commitMessage: { enabled: true, pattern: '', prompt: '' },
          branchName: { enabled: true, pattern: '', prompt: '' },
          codeChanges: { enabled: true, filePatterns: ['**/*.ts'], prompt: '' },
        },
      }),
      getInstance: jest.fn().mockReturnValue(mockInstance),
    } as unknown as jest.Mocked<ConfigManager>;

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockInstance);

    // Mock Provider
    mockProvider = {
      review: jest.fn().mockResolvedValue('No issues found'),
    } as unknown as jest.Mocked<OpenAIProvider>;

    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

    // Mock Git Utils
    (getGitChanges as jest.Mock).mockResolvedValue([
      { file: 'src/test.ts', content: 'test content' },
    ]);
    (getCurrentBranchName as jest.Mock).mockResolvedValue('feature/test');
    (getCurrentCommitMessage as jest.Mock).mockResolvedValue(
      'feat: test commit',
    );
  });

  it('should successfully review changes', async () => {
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(true);
    expect(mockInstance.loadConfig).toHaveBeenCalledWith(
      '.review-copilot.yaml',
    );
    expect(mockProvider.review).toHaveBeenCalled();
  });

  it('should handle no changes scenario', async () => {
    (getGitChanges as jest.Mock).mockResolvedValueOnce([]);
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const testError = new Error('Test error');
    mockProvider.review.mockRejectedValueOnce(testError);
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(false);
  });
});

describe('Review Command File Patterns', () => {
  let mockProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigManager
    const mockConfig = {
      providers: {
        openai: {
          enabled: true,
          apiKey: 'test-key',
          model: 'gpt-4',
          baseURL: 'https://api.openai.com/v1',
        },
      },
      rules: {
        codeChanges: {
          enabled: true,
          filePatterns: ['**/*.ts'],
          prompt: 'Review code',
        },
      },
    };

    const mockInstance = {
      loadConfig: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockReturnValue(mockConfig),
      getInstance: jest.fn().mockReturnThis(),
    };

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockInstance);

    // Mock Provider
    mockProvider = {
      review: jest.fn().mockResolvedValue('No issues found'),
    } as unknown as jest.Mocked<OpenAIProvider>;

    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

    // Mock Git Utils
    (getGitChanges as jest.Mock).mockResolvedValue([
      { file: 'src/test.ts', content: 'test content' },
      { file: 'src/index.js', content: 'js content' },
    ]);
  });

  it('should filter files based on filePatterns', async () => {
    const options = { config: '.review-copilot.yaml' };
    await reviewCommand(options);

    expect(mockProvider.review).toHaveBeenCalled();
    const reviewContent = mockProvider.review.mock.calls[0][1];
    expect(reviewContent).toContain('src/test.ts');
    expect(reviewContent).not.toContain('src/index.js');
  });
});
