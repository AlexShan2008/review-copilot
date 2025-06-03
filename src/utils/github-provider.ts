import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { VcsProvider, CommitReviewInfo } from './git-service.interface';

interface GitHubPRInfo {
  owner: string;
  repo: string;
  pull_number: number;
}

export class GithubProvider implements VcsProvider {
  private async getPRInfo(): Promise<GitHubPRInfo | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('Missing GITHUB_TOKEN');
    }

    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) {
      throw new Error('Missing GITHUB_EVENT_PATH');
    }

    const event = require(eventPath);
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

  async getCurrentBranchName(): Promise<string> {
    const headRef = process.env.GITHUB_HEAD_REF;
    if (headRef) {
      return headRef;
    }
    return '';
  }

  async getCurrentCommitMessage(): Promise<string> {
    try {
      if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        const eventPath = process.env.GITHUB_EVENT_PATH;
        if (eventPath) {
          const event = require(eventPath);
          const prTitle = event.pull_request?.title;
          const prBody = event.pull_request?.body;
          return prTitle || prBody || '';
        }
      } else {
        // For push events, fallback to git log if needed
        const { execCommand } = await import('./exec-command');
        const result = await execCommand('git log -1 --pretty=%B');
        return result.stdout.trim();
      }
    } catch (error) {
      console.warn(
        chalk.yellow('Failed to get commit message from GitHub:'),
        error,
      );
    }
    return '';
  }

  async getMergeRequestCommits(baseBranch = 'main'): Promise<string[]> {
    try {
      const prInfo = await this.getPRInfo();
      if (!prInfo) return [];

      const octokit = this.getOctokit();
      const { data: commits } = await octokit.pulls.listCommits({
        ...prInfo,
      });
      return commits.map((commit) => commit.sha);
    } catch (error) {
      console.error(chalk.red('Error getting merge request commits:'), error);
      return [];
    }
  }

  async getCommitMessagesForReview(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    try {
      const prInfo = await this.getPRInfo();
      if (!prInfo) return [];

      const octokit = this.getOctokit();
      const { data: commits } = await octokit.pulls.listCommits({
        ...prInfo,
      });

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

  async getPullRequestChanges(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    try {
      const prInfo = await this.getPRInfo();
      if (!prInfo) return [];

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
