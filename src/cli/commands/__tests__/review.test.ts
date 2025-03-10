import { ConfigManager } from '../../../config/config-manager';
import { reviewCommand } from '../review';
import {
  getGitChanges,
  getCurrentBranchName,
  getCurrentCommitMessage,
} from '../../../utils/git';
import { ProviderFactory } from '../../../providers/provider-factory';
import { OpenAIProvider } from '../../../providers/openai-provider';
import type { Ora } from 'ora';

jest.mock('../../../config/config-manager');
jest.mock('../../../utils/git');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('ora', () => {
  const mockSpinner: Ora = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(function (this: Ora) {
      jest.clearAllTimers();
      return this;
    }),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    frame: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    stopAndPersist: jest.fn().mockReturnThis(),
    text: '',
    isSpinning: false,
    prefixText: '',
    color: 'white',
    spinner: { interval: 100, frames: ['|'] },
    indent: 0,
  };

  return jest.fn(() => mockSpinner);
});

describe('review-copilot CLI', () => {
  let mockInstance: jest.Mocked<ConfigManager>;
  let mockProvider: jest.Mocked<OpenAIProvider>;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigManager with complete interface
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
          deepseek: {
            enabled: false,
            apiKey: 'test-key-2',
            model: 'deepseek-chat',
            baseURL: 'https://api.deepseek.com/v1',
          },
        },
        rules: {
          commitMessage: {
            enabled: true,
            pattern: '^feat|fix|docs',
            prompt: 'Review commit',
          },
          branchName: {
            enabled: true,
            pattern: '^feature/',
            prompt: 'Review branch',
          },
          codeChanges: {
            enabled: true,
            filePatterns: ['**/*.ts'],
            prompt: 'Review code',
          },
        },
      }),
      getInstance: jest.fn().mockReturnValue(mockInstance),
    } as unknown as jest.Mocked<ConfigManager>;

    (ConfigManager.getInstance as jest.Mock).mockReturnValue(mockInstance);

    // Mock Provider with complete interface
    mockProvider = {
      review: jest.fn().mockResolvedValue({
        success: true,
        message: 'No issues found',
      }),
      init: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OpenAIProvider>;

    (ProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);

    // Mock Git Utils with realistic values
    (getGitChanges as jest.Mock).mockResolvedValue([
      {
        file: 'src/test.ts',
        content: 'export function test() { return true; }',
      },
    ]);
    (getCurrentBranchName as jest.Mock).mockResolvedValue('feature/test-123');
    (getCurrentCommitMessage as jest.Mock).mockResolvedValue(
      'feat: add test feature',
    );
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
