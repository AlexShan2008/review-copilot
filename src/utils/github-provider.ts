import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { VcsProvider, CommitReviewInfo } from './git-service.interface';

export class GithubProvider implements VcsProvider {
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
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath) {
        const event = require(eventPath);
        const prNumber = event.pull_request?.number;
        if (prNumber) {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split(
            '/',
          );
          const { data: commits } = await octokit.pulls.listCommits({
            owner,
            repo,
            pull_number: prNumber,
          });
          return commits.map((commit) => commit.sha);
        }
      }
    } catch (error) {
      console.error(chalk.red('Error getting merge request commits:'), error);
    }
    return [];
  }

  async getPullRequestChanges(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    try {
      if (!process.env.GITHUB_TOKEN) {
        throw new Error('Missing GITHUB_TOKEN');
      }

      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (!eventPath) {
        return [];
      }

      const event = require(eventPath);
      const prNumber = event.pull_request?.number;
      if (!prNumber) {
        return [];
      }

      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');

      const { data: pullRequest } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
      });

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
      console.error(chalk.red('Error getting commits for review:'), error);
      return [];
    }
  }
}
