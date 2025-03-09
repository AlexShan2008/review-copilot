import simpleGit, { SimpleGit } from 'simple-git';
import chalk from 'chalk';
import { execCommand } from './execCommand';

interface GitChange {
  file: string;
  content: string;
}

export async function getGitChanges(): Promise<GitChange[]> {
  const git: SimpleGit = simpleGit();
  const status = await git.status();
  const changes: GitChange[] = [];

  for (const file of [...status.modified, ...status.not_added]) {
    const diff = await git.diff([file]);
    changes.push({
      file,
      content: diff,
    });
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
