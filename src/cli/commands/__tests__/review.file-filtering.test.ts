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
jest.mock('micromatch', () => ({
  isMatch: jest.fn((file: string, pattern: string) => {
    if (pattern === '**/*.ts') return file.endsWith('.ts');
    if (pattern === '**/*.{ts,tsx,js,jsx}')
      return /\.(ts|tsx|js|jsx)$/.test(file);
    return true;
  }),
}));

describe('reviewCommand - file filtering', () => {
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
    mockSpinner.stop();
    cleanupMocks();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterAll(() => {
    cleanupMocks();
  });

  it('should handle empty file patterns', async () => {
    const { mockVcsProvider } = setupMocks();
    const result = await reviewCommand({ config: '.review-copilot.yaml' });

    expect(result).toBe(true);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
  });

  it('should handle commits with no files', async () => {
    const { mockVcsProvider } = setupMocks(mockConfig, [
      {
        ...mockCommit,
        files: [],
      },
    ]);
    const result = await reviewCommand({ config: '.review-copilot.yaml' });

    expect(result).toBe(true);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
  });

  it('should handle baseBranch parameter', async () => {
    const { mockVcsProvider } = setupMocks();
    const result = await reviewCommand({
      config: '.review-copilot.yaml',
      baseBranch: 'main',
    });

    expect(result).toBe(true);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalledWith(
      expect.any(Object),
      'main',
    );
  });

  it('should only review files matching patterns', async () => {
    const multiFileCommit = {
      ...mockCommit,
      files: [
        { filename: 'src/test.ts', changes: 'typescript code' },
        { filename: 'src/ignore.js', changes: 'javascript code' },
        { filename: 'README.md', changes: 'documentation' },
      ],
    };
    const { mockProvider } = setupMocks(mockConfig, [multiFileCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should handle files with invalid changes', async () => {
    const invalidCommit = {
      ...mockCommit,
      files: [
        { filename: 'src/test.ts', changes: '' },
        { filename: 'src/valid.ts', changes: 'valid typescript code' },
      ],
    };
    const { mockProvider } = setupMocks(mockConfig, [invalidCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockProvider.review).toHaveBeenCalled();
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should truncate large files', async () => {
    const largeCommit = {
      ...mockCommit,
      files: [{ filename: 'src/large.ts', changes: 'a'.repeat(60000) }],
    };
    const { mockProvider } = setupMocks(mockConfig, [largeCommit]);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    const reviewCall = mockProvider.review.mock.calls[0];
    expect(reviewCall[1]).toContain('content truncated for size limit');
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});
