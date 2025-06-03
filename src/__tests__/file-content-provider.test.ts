import fs from 'fs';
import {
  LocalFileContentProvider,
  GitPlatformFileContentProvider,
  FileContentProviderFactory,
} from '../services/file-content-provider';

describe('LocalFileContentProvider', () => {
  it('should return file content if file exists', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('file content');
    const provider = new LocalFileContentProvider();
    const content = await provider.getFileContent('file.txt');
    expect(content).toBe('file content');
  });

  it('should return null and log error if file does not exist', async () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('not found');
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const provider = new LocalFileContentProvider();
    const content = await provider.getFileContent('missing.txt');
    expect(content).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('GitPlatformFileContentProvider', () => {
  const gitServiceMock = {
    getFileContent: jest.fn(),
  };
  const provider = new GitPlatformFileContentProvider(gitServiceMock as any);

  it('should call gitService.getFileContent with correct args', async () => {
    gitServiceMock.getFileContent.mockResolvedValue('remote content');
    const content = await provider.getFileContent('file.txt', {
      owner: 'alex',
      repo: 'repo',
      prNumber: 1,
    });
    expect(gitServiceMock.getFileContent).toHaveBeenCalledWith(
      'alex',
      'repo',
      'file.txt',
      1,
    );
    expect(content).toBe('remote content');
  });

  it('should throw if context is missing', async () => {
    await expect(provider.getFileContent('file.txt', {})).rejects.toThrow(
      'Missing required context for Git platform file content retrieval',
    );
  });
});

describe('FileContentProviderFactory', () => {
  const gitServiceMock = {};
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should return GitPlatformFileContentProvider in CI', () => {
    process.env.GITHUB_ACTIONS = 'true';
    const provider = FileContentProviderFactory.createProvider(
      gitServiceMock as any,
    );
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
