jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
    stop: jest.fn(),
    text: '',
  };
  return () => spinner;
});

import { selectiveReviewCommand } from '../selective-review';
import { ConfigManager } from '../../../config/config-manager';
import { SelectiveReviewService } from '../../../services/selective-review-service';
import { GitPlatformFactory } from '../../../services/git-platform-factory';
import { FileContentProviderFactory } from '../../../services/file-content-provider';

describe('selectiveReviewCommand', () => {
  let configManagerMock: any;
  let gitServiceMock: any;
  let fileContentProviderMock: any;
  let reviewServiceMock: any;

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
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    const result = await selectiveReviewCommand(baseOptions);
    expect(result).toBe(false);
  });

  it('should fail if file content is missing', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue(null);
    const result = await selectiveReviewCommand(baseOptions);
    expect(result).toBe(false);
  });

  it('should fail if line range is invalid', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue('line1\nline2');
    const result = await selectiveReviewCommand({
      ...baseOptions,
      startLine: 1,
      endLine: 10,
    });
    expect(result).toBe(false);
  });

  it('should succeed if reviewService returns success', async () => {
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue('line1\nline2');
    reviewServiceMock.processSelectiveReview.mockResolvedValue({
      success: true,
    });
    const result = await selectiveReviewCommand({
      ...baseOptions,
      startLine: 1,
      endLine: 2,
    });
    expect(result).toBe(true);
  });

  it('should fail and log errors if reviewService returns errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    gitServiceMock.getPRDetails.mockResolvedValue({
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
    });
    fileContentProviderMock.getFileContent.mockResolvedValue('line1\nline2');
    reviewServiceMock.processSelectiveReview.mockResolvedValue({
      success: false,
      errors: ['err1', 'err2'],
    });
    const result = await selectiveReviewCommand({
      ...baseOptions,
      startLine: 1,
      endLine: 2,
    });
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should handle unexpected errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    gitServiceMock.getPRDetails.mockImplementation(() => {
      throw new Error('unexpected');
    });
    const result = await selectiveReviewCommand(baseOptions);
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
