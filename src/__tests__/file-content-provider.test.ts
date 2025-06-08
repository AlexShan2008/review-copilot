import fs from 'fs';
import {
  LocalFileContentProvider,
  GitPlatformFileContentProvider,
  FileContentProviderFactory,
} from '../services/file-content-provider';
import {
  GitPlatformDetails,
  IGitPlatformService,
} from '../services/services.types';

describe('LocalFileContentProvider', () => {
  let provider: LocalFileContentProvider;
  let fsSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new LocalFileContentProvider();
    fsSpy = jest.spyOn(fs, 'readFileSync');
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // 确保所有mock都被清理
    jest.clearAllMocks();
    errorSpy.mockRestore();
    fsSpy.mockRestore();

    // 清理provider实例
    provider = null as any;
  });

  afterAll(() => {
    // 完全恢复所有mock
    jest.restoreAllMocks();
  });

  it('should return file content if file exists', async () => {
    fsSpy.mockReturnValue('file content');
    const content = await provider.getFileContent('file.txt');
    expect(content).toBe('file content');
    expect(fsSpy).toHaveBeenCalledWith('file.txt', 'utf8');
  });

  it('should return null and log error if file does not exist', async () => {
    fsSpy.mockImplementation(() => {
      throw new Error('not found');
    });
    const content = await provider.getFileContent('missing.txt');
    expect(content).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('GitPlatformFileContentProvider', () => {
  let gitServiceMock: { getFileContent: jest.Mock };
  let provider: GitPlatformFileContentProvider;

  beforeEach(() => {
    gitServiceMock = {
      getFileContent: jest.fn(),
    };
    provider = new GitPlatformFileContentProvider(gitServiceMock as any);
  });

  afterEach(() => {
    // Clean up mocks after each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore all mocks after all tests
    jest.restoreAllMocks();
  });

  it('should call gitService.getFileContent with correct args', async () => {
    const mockContent = 'remote content';
    gitServiceMock.getFileContent.mockResolvedValue(mockContent);

    const context: GitPlatformDetails = {
      owner: 'alex',
      repo: 'repo',
      pullNumber: 1,
      platform: 'github',
      commitId: 'abc123',
      path: 'main',
    };

    const content = await provider.getFileContent('file.txt', context);

    expect(gitServiceMock.getFileContent).toHaveBeenCalledWith({
      owner: context.owner,
      repo: context.repo,
      filePath: 'file.txt',
      pullNumber: context.pullNumber,
    });
    expect(content).toBe(mockContent);
  });

  it('should throw if context is missing', async () => {
    const invalidContext = {} as GitPlatformDetails;

    await expect(
      provider.getFileContent('file.txt', invalidContext),
    ).rejects.toThrow(
      'Missing required context for Git platform file content retrieval',
    );
  });
});

describe('FileContentProviderFactory', () => {
  let gitServiceMock: IGitPlatformService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    gitServiceMock = {
      getFileContent: jest.fn(),
    } as unknown as IGitPlatformService;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return GitPlatformFileContentProvider in CI', () => {
    process.env.GITHUB_ACTIONS = 'true';
    const provider = FileContentProviderFactory.createProvider(gitServiceMock);
    expect(provider).toBeInstanceOf(GitPlatformFileContentProvider);
  });

  it('should throw if gitService is missing in CI', () => {
    process.env.GITHUB_ACTIONS = 'true';
    expect(() => FileContentProviderFactory.createProvider()).toThrow(
      'Git service is required for CI environment',
    );
  });

  it('should return LocalFileContentProvider outside CI', () => {
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    const provider = FileContentProviderFactory.createProvider();
    expect(provider).toBeInstanceOf(LocalFileContentProvider);
  });
});
