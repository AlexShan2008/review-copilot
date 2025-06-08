import { reviewCommand } from '../review';
import {
  setupMocks,
  mockConfig,
  mockCommit,
  cleanupMocks,
  MockOra,
} from './review.utils';
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

describe('reviewCommand - file filtering', () => {
  const mockSpinner = (ora as unknown as MockOra).mockSpinnerInstance;

  beforeAll(() => {
    jest.useFakeTimers();
  });

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
    // Run any pending timers first
    jest.runAllTimers();

    // Cleanup
    mockSpinner._cleanup();
    mockSpinner.stop();
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.resetModules();
    cleanupMocks();
  });

  it('should handle empty file patterns', async () => {
    const { mockVcsProvider } = setupMocks();
    const promise = reviewCommand({ config: '.review-copilot.yaml' });

    // Run all timers and wait for promises
    jest.runAllTimers();
    const result = await promise;

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
    const promise = reviewCommand({ config: '.review-copilot.yaml' });

    // Run all timers and wait for promises
    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe(true);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockVcsProvider.getPullRequestFiles).toHaveBeenCalled();
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
});
