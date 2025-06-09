import { reviewCommand } from '../review';
import { setupMocks, mockConfig, cleanupMocks, MockOra } from './review.utils';
import { ProviderFactory } from '../../../providers/provider-factory';
import ora from 'ora';

jest.useFakeTimers();

// Mock other dependencies
jest.mock('../../../config/config-manager');
jest.mock('../../../utils/vcs-factory');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('../../../services/git-platform-factory');
jest.mock('micromatch', () => ({
  isMatch: jest.fn((file: string, pattern: string) => {
    if (pattern === '**/*.ts') return file.endsWith('.ts');
    if (pattern === '**/*.{ts,tsx,js,jsx}')
      return /\.(ts|tsx|js|jsx)$/.test(file);
    return true;
  }),
}));

describe('reviewCommand - basic functionality', () => {
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

  afterEach(() => {
    mockSpinner._cleanup();
    jest.clearAllTimers();
    jest.resetModules();
    cleanupMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should successfully review commits and code changes', async () => {
    const { mockProvider, mockConfigManager, mockVcsProvider } = setupMocks();

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockConfigManager.getConfig).toHaveBeenCalled();
    expect(ProviderFactory.createProvider).toHaveBeenCalled();
    expect(mockVcsProvider.getCurrentBranchName).toHaveBeenCalled();
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
    expect(mockProvider.review).toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should handle no commits scenario', async () => {
    const { mockProvider, mockVcsProvider } = setupMocks(mockConfig, []);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
    expect(mockProvider.review).not.toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should respect disabled rules', async () => {
    const disabledConfig = {
      ...mockConfig,
      rules: {
        ...mockConfig.rules,
        codeChanges: { ...mockConfig.rules.codeChanges, enabled: false },
        commitMessage: { ...mockConfig.rules.commitMessage, enabled: false },
        branchName: { ...mockConfig.rules.branchName, enabled: false },
      },
    };

    const { mockProvider } = setupMocks(disabledConfig);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).not.toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should format branch name in outputReviewResults', async () => {
    const { formatReviewResultsAsMarkdown } = require('../helpers');

    const results = {
      branchName: [
        {
          success: true,
          suggestions: [
            { message: 'Branch name is good', reviewType: 'general' },
          ],
          error: undefined,
        },
      ],
    };
    const markdown = formatReviewResultsAsMarkdown(results.branchName, {
      type: 'branchName',
      branchName: 'feature/test',
    });
    expect(markdown).toContain('**Branch:** `feature/test`');
    expect(markdown).toContain('Branch name is good');
  });

  it('should format commit SHA as link in outputReviewResults', async () => {
    const { formatReviewResultsAsMarkdown } = require('../helpers');
    const prDetails = { owner: 'owner', repo: 'repo', pullNumber: 1 };
    const commits = [
      {
        hash: 'abc1234',
        message: 'feat: add feature',
        author: 'Test',
        date: '2024-01-01',
      },
      {
        hash: 'def5678',
        message: 'fix: bug fix',
        author: 'Test',
        date: '2024-01-02',
      },
    ];
    const results = [
      {
        success: true,
        suggestions: [{ message: 'Good commit', reviewType: 'general' }],
        error: undefined,
      },
    ];
    const markdown = formatReviewResultsAsMarkdown(results, {
      type: 'commitMessages',
      commits,
      prDetails,
    });
    expect(markdown).toContain('[abc1234](');
    expect(markdown).toContain('[def5678](');
    expect(markdown).toContain('feat: add feature');
    expect(markdown).toContain('fix: bug fix');
  });
});
