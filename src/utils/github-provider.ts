import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { VcsProvider, CommitReviewInfo } from './git-service.interface';

interface GitHubPRInfo {
  owner: string;
  repo: string;
  pull_number: number;
}

export class GithubProvider implements VcsProvider {
  // Cache for PR commits to avoid redundant API calls, with expiration
  private cachedCommits: { data: any[]; timestamp: number } | null = null;
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private async getPRInfo(): Promise<GitHubPRInfo | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('Missing GITHUB_TOKEN');
    }

    const eventPath = process.env.GITHUB_EVENT_PATH;
    // Validate eventPath is absolute for security
    if (!eventPath || !path.isAbsolute(eventPath)) {
      throw new Error('Invalid event path');
    }

    // Securely read and parse the event payload
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const pull_number = event.pull_request?.number;
    if (!pull_number) {
      throw new Error('Missing PR number in event payload');
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    return { owner, repo, pull_number };
  }

  private getOctokit(): Octokit {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('Missing GITHUB_TOKEN');
    }
    return new Octokit({ auth: token });
  }

  // Helper to fetch and cache PR commits with expiration
  private async getCommits(): Promise<any[]> {
    if (
      !this.cachedCommits ||
      Date.now() - this.cachedCommits.timestamp > this.CACHE_TTL_MS
    ) {
      const prInfo = await this.getPRInfo();
      if (!prInfo) throw new Error('Failed to get PR info');

      const octokit = this.getOctokit();

      const response = await octokit.pulls.listCommits({
        ...prInfo,
      });
      this.cachedCommits = { data: response.data, timestamp: Date.now() };
    }
    return this.cachedCommits.data;
  }

  async getCurrentBranchName(): Promise<string> {
    const headRef = process.env.GITHUB_HEAD_REF;
    if (headRef) {
      return headRef;
    }
    return '';
  }

  async getPullRequestCommits(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    try {
      const commits = await this.getCommits();
      // For commit message review, we only need basic commit info without files
      return commits.map((commit) => ({
        hash: commit.sha,
        date: commit.commit.author?.date || '',
        message: commit.commit.message,
        author: commit.commit.author?.name || '',
        files: [], // Empty files array as we don't need file changes for message review
      }));
    } catch (error) {
      console.error(
        chalk.red('Error getting commits for message review:'),
        error,
      );
      throw new Error('Failed to fetch GitHub commits for message review');
    }
  }

  async getPullRequestFiles(baseBranch = 'main'): Promise<CommitReviewInfo[]> {
    try {
      const prInfo = await this.getPRInfo();
      if (!prInfo) throw new Error('Failed to get PR info');

      const octokit = this.getOctokit();

      // Get PR details
      const { data: pullRequest } = await octokit.pulls.get({
        ...prInfo,
      });

      // Get all file changes in the PR
      const { data: files } = await octokit.pulls.listFiles({
        ...prInfo,
      });

      // For code review, we only need the final state of changes
      const commitInfo: CommitReviewInfo = {
        hash: pullRequest.head.sha,
        date: pullRequest.updated_at,
        message: pullRequest.title,
        author: pullRequest.user?.login || '',
        files: files.map((file) => ({
          file: file.filename,
          changes: file.patch || '',
        })),
      };

      return [commitInfo];
    } catch (error) {
      console.error(
        chalk.red('Error getting PR changes for code review:'),
        error,
      );
      throw new Error('Failed to fetch GitHub PR changes for code review');
    }
  }
}
