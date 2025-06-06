jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(),
  };
});

import { GitHubService } from '../services/github-service';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import child_process from 'child_process';

const OLD_ENV = process.env;

describe('GitHubService', () => {
  const token = 'fake-token';
  let service: GitHubService;
  let octokitMock: any;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    octokitMock = {
      issues: {
        createComment: jest.fn(),
        getComment: jest.fn(),
      },
      pulls: {
        createReplyForReviewComment: jest.fn(),
        get: jest.fn(),
      },
      repos: {
        getContent: jest.fn(),
      },
    };
    (Octokit as unknown as jest.Mock).mockImplementation(() => octokitMock);
    service = new GitHubService(token);
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  it('should add a PR comment', async () => {
    await service.createIssueComment('owner', 'repo', 1, 'test comment');
    expect(octokitMock.issues.createComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: 'test comment',
    });
  });

  it('should reply to a comment', async () => {
    octokitMock.issues.getComment.mockResolvedValue({
      data: { body: 'original' },
    });
    await service.replyToComment('owner', 'repo', 1, 2, 'reply');
    expect(octokitMock.issues.createComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 1,
      body: '> original\n\nreply',
    });
  });

  it('should reply to a review comment', async () => {
    await service.replyToReviewComment('owner', 'repo', 1, '2', 'review reply');
    expect(octokitMock.pulls.createReplyForReviewComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1,
      comment_id: 2,
      body: 'review reply',
    });
  });

  describe('getPRDetails', () => {
    it('should return PR details from GITHUB_EVENT_PATH', async () => {
      const eventData = {
        pull_request: { number: 123 },
        repository: { owner: { login: 'alex' }, name: 'repo' },
      };
      process.env.GITHUB_EVENT_PATH = '/tmp/event.json';
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(eventData));
      const details = await service.getPRDetails();
      expect(details).toEqual({
        owner: 'alex',
        repo: 'repo',
        prNumber: 123,
        platform: 'github',
      });
    });

    it('should return PR details from env vars', async () => {
      delete process.env.GITHUB_EVENT_PATH;
      process.env.GITHUB_REPOSITORY = 'alex/repo';
      process.env.GITHUB_EVENT_NUMBER = '456';
      const details = await service.getPRDetails();
      expect(details).toEqual({
        owner: 'alex',
        repo: 'repo',
        prNumber: 456,
        platform: 'github',
      });
    });

    it('should return null if no PR details', async () => {
      delete process.env.GITHUB_EVENT_PATH;
      process.env.GITHUB_REPOSITORY = '';
      process.env.GITHUB_EVENT_NUMBER = '';
      const details = await service.getPRDetails();
      expect(details).toBeNull();
    });
  });

  it('should get current branch', async () => {
    jest
      .spyOn(child_process, 'execSync')
      .mockReturnValue(Buffer.from('main\n'));
    const branch = await service.getCurrentBranch();
    expect(branch).toBe('main');
  });

  it('should get commit message', async () => {
    jest
      .spyOn(child_process, 'execSync')
      .mockReturnValue(Buffer.from('commit message\n'));
    const msg = await service.getCommitMessage();
    expect(msg).toBe('commit message');
  });

  it('should get file content from PR', async () => {
    octokitMock.pulls.get.mockResolvedValue({
      data: { head: { sha: 'abc123' } },
    });
    octokitMock.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('hello').toString('base64') },
    });
    const content = await service.getFileContent(
      'owner',
      'repo',
      'file.txt',
      1,
    );
    expect(content).toBe('hello');
  });

  it('should return null if getFileContent fails', async () => {
    octokitMock.pulls.get.mockRejectedValue(new Error('fail'));
    const content = await service.getFileContent(
      'owner',
      'repo',
      'file.txt',
      1,
    );
    expect(content).toBeNull();
  });
});
