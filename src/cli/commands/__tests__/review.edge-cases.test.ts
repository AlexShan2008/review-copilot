import { reviewCommand } from '../review';
import {
  setupMocks,
  mockConfig,
  mockCommit,
  cleanupMocks,
  MockOra,
} from './review.utils';
import { ProviderFactory } from '../../../providers/provider-factory';
import ora from 'ora';

// Mock other dependencies
jest.mock('../../../config/config-manager');
jest.mock('../../../utils/vcs-factory');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('../../../services/git-platform-factory');

describe('reviewCommand - edge cases', () => {
  const mockSpinner = (ora as unknown as MockOra).mockSpinnerInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset spinner mock state
    Object.values(mockSpinner).forEach((mock) => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        (mock as jest.Mock).mockClear();
      }
    });
  });

  afterEach(async () => {
    mockSpinner._cleanup();
    jest.clearAllTimers();
    jest.resetModules();
    cleanupMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

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
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should handle commits with no files', async () => {
    const noFilesCommit = { ...mockCommit, files: [] };
    const { mockProvider } = setupMocks(mockConfig, [noFilesCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalledTimes(1);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should handle baseBranch parameter', async () => {
    const { mockVcsProvider } = setupMocks();

    const result = await reviewCommand({
      config: 'test-config.yaml',
      baseBranch: 'develop',
    });

    expect(result).toBe(true);
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});
