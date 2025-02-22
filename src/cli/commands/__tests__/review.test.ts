import { reviewCommand } from '../review';
import { ConfigManager } from '../../../config/config-manager';
import { OpenAIProvider } from '../../../providers/openai-provider';
import { getGitChanges } from '../../../utils/git';
import micromatch from 'micromatch';

jest.mock('../../../config/config-manager');
jest.mock('../../../providers/openai-provider');
jest.mock('../../../utils/git');

describe('review-copilot CLI', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock OpenAIProvider
    (OpenAIProvider as jest.Mock).mockImplementation(() => ({
      review: jest.fn().mockResolvedValue('AI Review Result'),
    }));

    mockInstance = {
      loadConfig: jest.fn().mockResolvedValue({}),
      getConfig: jest.fn().mockReturnValue({
        ai: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
        rules: {
          commitMessage: { enabled: false },
          branchName: { enabled: false },
          codeChanges: { enabled: true, prompt: 'test prompt' },
        },
      }),
      config: {},
      replaceEnvVariables: jest.fn().mockImplementation((str) => str),
    };

    jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(mockInstance);

    // Mock getGitChanges
    (getGitChanges as jest.Mock).mockResolvedValue([
      { file: 'test.ts', content: 'test content' },
    ]);
  });

  it('should successfully review changes', async () => {
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(true);
    expect(mockInstance.loadConfig).toHaveBeenCalledWith(
      '.review-copilot.yaml',
    );
  });

  it('should handle no changes scenario', async () => {
    (getGitChanges as jest.Mock).mockResolvedValue([]);
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    mockInstance.loadConfig.mockRejectedValue(new Error('Test error'));
    const options = { config: '.review-copilot.yaml' };
    const result = await reviewCommand(options);

    expect(result).toBe(false);
  });
});

describe('Review Command File Patterns', () => {
  let mockReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReview = jest.fn().mockResolvedValue('AI Review Result');
    (OpenAIProvider as jest.Mock).mockImplementation(() => ({
      review: mockReview,
    }));
  });

  it('should filter files based on filePatterns', async () => {
    // Mock git changes
    const mockChanges = [
      { file: 'src/test.ts', content: 'test content' },
      { file: 'src/index.js', content: 'js content' },
      { file: 'dist/test.js', content: 'should be ignored' },
    ];
    (getGitChanges as jest.Mock).mockResolvedValue(mockChanges);

    // Mock config
    const mockConfig = {
      ai: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      },
      rules: {
        commitMessage: { enabled: false },
        branchName: { enabled: false },
        codeChanges: {
          enabled: true,
          filePatterns: [
            '**/*.{ts,tsx}',
            '**/*.{js,jsx}',
            '!**/dist/**',
            '!**/node_modules/**',
          ],
          prompt: 'test prompt',
        },
      },
    };

    const mockInstance = {
      loadConfig: jest.fn().mockResolvedValue({}),
      getConfig: jest.fn().mockReturnValue(mockConfig),
      replaceEnvVariables: jest.fn().mockImplementation((str) => str),
    } as unknown as ConfigManager;

    jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(mockInstance);

    const options = { config: '.review-copilot.yaml' };
    await reviewCommand(options);

    // Verify review was called
    expect(mockReview).toHaveBeenCalled();
    const reviewContent = mockReview.mock.calls[0][1];
    expect(reviewContent).toContain('src/test.ts');
    expect(reviewContent).not.toContain('src/index.js');
    expect(reviewContent).not.toContain('dist/test.js');
  });
});
