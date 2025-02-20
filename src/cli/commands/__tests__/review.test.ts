import { reviewCommand } from '../review';
import { ConfigManager } from '../../../config/config-manager';
import { OpenAIProvider } from '../../../providers/openai-provider';
import { getGitChanges } from '../../../utils/git';

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
