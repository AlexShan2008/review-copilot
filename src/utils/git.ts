import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';
import chalk from 'chalk';
import { execCommand } from './execCommand';

interface GitChange {
  file: string;
  content: string;
}

export async function getGitChanges(): Promise<GitChange[]> {
  const changes: GitChange[] = [];

  if (process.env.GITHUB_ACTIONS === 'true') {
    try {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath) {
        const event = require(eventPath);
        const prNumber = event.pull_request?.number;

        if (prNumber) {
          console.log(chalk.blue('\nFetching PR files from GitHub API...'));

          const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
          });

          // Get repository information from environment
          const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split(
            '/',
          );

          // Fetch files changed in PR
          const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
          });

          console.log(chalk.gray('Files changed in PR:'), files.length);

          // Get diff for each file
          for (const file of files) {
            const git: SimpleGit = simpleGit();
            try {
              // Use file patch directly from GitHub API
              changes.push({
                file: file.filename,
                content: file.patch || '',
              });
            } catch (error) {
              console.warn(
                chalk.yellow(`Failed to get diff for ${file.filename}:`),
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('Error fetching PR files:'), error);
    }
  }

  // If no changes found from GitHub API, fallback to local git
  if (changes.length === 0) {
    const git: SimpleGit = simpleGit();
    const status = await git.status();

    for (const file of [...status.modified, ...status.not_added]) {
      const diff = await git.diff([file]);
      changes.push({
        file,
        content: diff,
      });
    }
  }

  return changes;
}

export async function getCurrentBranchName(): Promise<string> {
  if (process.env.GITHUB_ACTIONS === 'true') {
    // For GitHub Actions, get the actual PR branch name
    const headRef = process.env.GITHUB_HEAD_REF;
    if (headRef) {
      return headRef;
    }
  }

  // Fallback to git command for local development
  const result = await execCommand('git rev-parse --abbrev-ref HEAD');
  return result.stdout.trim();
}

export async function getCurrentCommitMessage(): Promise<string> {
  if (process.env.GITHUB_ACTIONS === 'true') {
    // For GitHub Actions
    try {
      if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        // For PR events
        const eventPath = process.env.GITHUB_EVENT_PATH;
        if (eventPath) {
          const event = require(eventPath);
          const prTitle = event.pull_request?.title;
          const prBody = event.pull_request?.body;
          return prTitle || prBody || '';
        }
      } else {
        // For push events
        const result = await execCommand('git log -1 --pretty=%B');
        return result.stdout.trim();
      }
    } catch (error) {
      console.warn(
        chalk.yellow('Failed to get commit message from GitHub:'),
        error,
      );
    }
  }

  // Fallback to git log for local development
  const result = await execCommand('git log -1 --pretty=%B');
  return result.stdout.trim();
}
