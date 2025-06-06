import { Octokit } from '@octokit/rest';
import fs from 'fs';
import {
  CreateReviewCommentParams,
  IGitPlatformService,
  GitPlatformDetails,
  createIssueComment,
} from './git-platform.interface';
import { execSync } from 'child_process';

export class GitHubService implements IGitPlatformService {
  private client: Octokit;

  constructor(token: string) {
    this.client = new Octokit({ auth: token });
  }

  async createIssueComment({
    owner,
    repo,
    issue_number,
    body,
  }: createIssueComment): Promise<void> {
    await this.client.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  }

  async createReviewComment({
    owner,
    repo,
    prNumber,
    body,
    commitId,
    path,
    position,
    line,
    side,
    startLine,
    startSide,
  }: CreateReviewCommentParams): Promise<void> {
    await this.client.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      body,
      commit_id: commitId,
      path,
      position,
      line,
      side,
      start_line: startLine,
      start_side: startSide,
    });
  }

  async replyToComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: number,
    comment: string,
  ): Promise<void> {
    // GitHub doesn't have a direct reply-to-comment API
    // Instead, we'll create a new comment with a reference to the original
    const { data: originalComment } = await this.client.issues.getComment({
      owner,
      repo,
      comment_id: commentId,
    });

    const replyComment = `> ${originalComment.body}\n\n${comment}`;
    await this.client.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: replyComment,
    });
  }

  async replyToReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    threadId: string,
    comment: string,
  ): Promise<void> {
    await this.client.pulls.createReplyForReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      comment_id: parseInt(threadId, 10),
      body: comment,
    });
  }

  async getPRDetails(): Promise<GitPlatformDetails | null> {
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(
          fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
        );

        if (eventData.pull_request) {
          return {
            owner: eventData.repository.owner.login,
            repo: eventData.repository.name,
            prNumber: eventData.pull_request.number,
            platform: 'github',
          };
        }
      } catch (error) {
        console.error('Error reading GitHub event data:', error);
      }
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    const prNumber = parseInt(process.env.GITHUB_EVENT_NUMBER || '', 10);

    if (owner && repo && !isNaN(prNumber)) {
      return {
        owner,
        repo,
        prNumber,
        platform: 'github',
      };
    }

    return null;
  }

  async getCurrentBranch(): Promise<string> {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }

  async getCommitMessage(): Promise<string> {
    return execSync('git log -1 --pretty=%B').toString().trim();
  }

  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    prNumber: number,
  ): Promise<string | null> {
    try {
      // Get the PR details to get the head SHA
      const { data: pullRequest } = await this.client.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      // Get the file content from the PR's head branch
      const { data: fileData } = await this.client.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: pullRequest.head.sha,
      });

      if ('content' in fileData && fileData.content) {
        return Buffer.from(fileData.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }
}
