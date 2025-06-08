import { selectiveReviewCommand } from '../selective-review';
import { ConfigManager } from '../../../config/config-manager';
import { SelectiveReviewService } from '../../../services/selective-review-service';
import { GitPlatformFactory } from '../../../services/git-platform-factory';
import { FileContentProviderFactory } from '../../../services/file-content-provider';
import ora from 'ora';
import { MockOra } from './review.utils';
import { cleanupMocks } from './review.utils';

jest.useFakeTimers();

describe('selectiveReviewCommand', () => {
  let configManagerMock: any;
  let gitServiceMock: any;
  let fileContentProviderMock: any;
  let reviewServiceMock: any;
  const mockSpinner = (ora as unknown as MockOra).mockSpinnerInstance;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    configManagerMock = { loadConfig: jest.fn() };
    gitServiceMock = { getPRDetails: jest.fn() };
    fileContentProviderMock = { getFileContent: jest.fn() };
    reviewServiceMock = { processSelectiveReview: jest.fn() };
    jest.spyOn(ConfigManager, 'getInstance').mockReturnValue(configManagerMock);
    jest
      .spyOn(GitPlatformFactory, 'createService')
      .mockReturnValue(gitServiceMock);
    jest
      .spyOn(FileContentProviderFactory, 'createProvider')
      .mockReturnValue(fileContentProviderMock);
    jest
      .spyOn(SelectiveReviewService, 'getInstance')
      .mockReturnValue(reviewServiceMock);

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

    // Cleanup spinner
    mockSpinner._cleanup();
    mockSpinner.stop();

    // Clear all mocks and timers
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.resetModules();

    // Cleanup any other mocks
    cleanupMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const baseOptions = {
    config: 'config.yaml',
    file: 'file.ts',
    startLine: 1,
    endLine: 2,
    comment: 'review this',
  };

  it('should fail if PR details are missing', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue(null);
    const promise = selectiveReviewCommand(baseOptions);
    jest.runAllTimers();
    const result = await promise;
    expect(result).toBe(false);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should fail if file content is missing', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue(null);
    const promise = selectiveReviewCommand(baseOptions);
    jest.runAllTimers();
    const result = await promise;
    expect(result).toBe(false);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should fail if line range is invalid', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue('line1\nline2');
    const promise = selectiveReviewCommand({
      ...baseOptions,
      startLine: 1,
      endLine: 10,
    });
    jest.runAllTimers();
    const result = await promise;
    expect(result).toBe(false);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});
