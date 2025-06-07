import { Octokit } from '@octokit/rest';
import fs from 'fs';
import {
  CreateReviewCommentParams,
  IGitPlatformService,
  GitPlatformDetails,
  createIssueComment,
  GetFileContentParams,
  ReplyToReviewCommentParams,
  ReplyToCommentParams,
} from './services.types';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { ConfigManager } from '../config/config-manager';
import { GitPlatformFactory } from './git-platform-factory';
import { SelectiveReviewService } from './selective-review-service';
import { SelectiveReviewContext } from '../types/selective-review.types';

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
    pullNumber: pullNumber,
    body,
    commitId,
    path,
    line,
    side,
    startLine,
    startSide,
    inReplyTo,
    subjectType,
  }: CreateReviewCommentParams): Promise<void> {
    await this.client.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      body,
      commit_id: commitId,
      path,
      line,
      side,
      start_line: startLine,
      start_side: startSide,
      in_reply_to: inReplyTo,
      subject_type: subjectType,
    });
  }

  async replyToComment(params: ReplyToCommentParams): Promise<void> {
    // GitHub doesn't have a direct reply-to-comment API
    // Instead, we'll create a new comment with a reference to the original
    const { data: originalComment } = await this.client.issues.getComment({
      owner: params.owner,
      repo: params.repo,
      comment_id: params.commentId,
    });

    const replyComment = `> ${originalComment.body}\n\n${params.comment}`;
    await this.client.issues.createComment({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.pullNumber,
      body: replyComment,
    });
  }

  async replyToReviewComment(
    params: ReplyToReviewCommentParams,
  ): Promise<void> {
    await this.client.pulls.createReplyForReviewComment({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
      comment_id: parseInt(params.threadId, 10),
      body: params.comment,
    });
  }

  async getPRDetails(): Promise<GitPlatformDetails | undefined> {
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(
          fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
        );

        if (eventData.pull_request) {
          return {
            owner: eventData.repository.owner.login,
            repo: eventData.repository.name,
            pullNumber: eventData.pull_request.number,
            platform: 'github',
            commitId: eventData.pull_request.head.sha,
            path: eventData.pull_request.head.path,
          };
        }
      } catch (error) {
        console.error('Error reading GitHub event data:', error);
      }
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    const pullNumber = parseInt(process.env.GITHUB_EVENT_NUMBER || '', 10);

    if (owner && repo && !isNaN(pullNumber)) {
      return {
        owner,
        repo,
        pullNumber,
        platform: 'github',
        commitId: '',
        path: '',
      };
    }

    return undefined;
  }

  async getCurrentBranch(): Promise<string> {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }

  async getCommitMessage(): Promise<string> {
    return execSync('git log -1 --pretty=%B').toString().trim();
  }

  async getFileContent(params: GetFileContentParams): Promise<string | null> {
    try {
      // Get the PR details to get the head SHA
      const { data: pullRequest } = await this.client.pulls.get({
        owner: params.owner,
        repo: params.repo,
        pull_number: params.pullNumber,
      });

      // Get the file content from the PR's head branch
      const { data: fileData } = await this.client.repos.getContent({
        owner: params.owner,
        repo: params.repo,
        path: params.filePath,
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
