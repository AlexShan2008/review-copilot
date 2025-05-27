import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit, DefaultLogFields, LogResult } from 'simple-git';
import chalk from 'chalk';
import { execCommand } from './execCommand';

interface GitChange {
  file: string;
  content: string;
}

interface CommitReviewInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
  files: {
    file: string;
    changes: string;
  }[];
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

export async function getMergeRequestCommits(
  baseBranch = 'main',
): Promise<string[]> {
  try {
    const git: SimpleGit = simpleGit();

    if (process.env.GITHUB_ACTIONS === 'true') {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath) {
        const event = require(eventPath);
        const prNumber = event.pull_request?.number;

        if (prNumber) {
          const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
          });

          const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split(
            '/',
          );

          // Get all commits in the PR using GitHub API
          const { data: commits } = await octokit.pulls.listCommits({
            owner,
            repo,
            pull_number: prNumber,
          });

          return commits.map((commit) => commit.sha);
        }
      }
    }

    // For local development, use git log to get commits
    const currentBranch = await getCurrentBranchName();

    // Use git log with range syntax to get all commits
    const logResult = await git.log({
      from: baseBranch,
      to: currentBranch,
      symmetric: false, // Use asymmetric difference to get commits that are in current branch but not in base
    });

    return logResult.all.map((commit) => commit.hash);
  } catch (error) {
    console.error(chalk.red('Error getting merge request commits:'), error);
    return [];
  }
}

export async function getCommitsForReview(
  baseBranch = 'main',
): Promise<CommitReviewInfo[]> {
  try {
    const git: SimpleGit = simpleGit();
    const commits: CommitReviewInfo[] = [];

    if (process.env.GITHUB_ACTIONS === 'true') {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath) {
        const event = require(eventPath);
        const prNumber = event.pull_request?.number;

        if (prNumber) {
          const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
          });

          const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split(
            '/',
          );

          // Get all commits in the PR using GitHub API
          const { data: prCommits } = await octokit.pulls.listCommits({
            owner,
            repo,
            pull_number: prNumber,
          });

          // Get detailed information for each commit
          for (const prCommit of prCommits) {
            const { data: commit } = await octokit.repos.getCommit({
              owner,
              repo,
              ref: prCommit.sha,
            });

            commits.push({
              hash: commit.sha,
              date: commit.commit.author?.date || '',
              message: commit.commit.message,
              author: commit.commit.author?.name || '',
              files:
                commit.files?.map((file) => ({
                  file: file.filename,
                  changes: file.patch || '',
                })) || [],
            });
          }
        }
      }
    } else {
      // For local development, use git log to get commits
      const currentBranch = await getCurrentBranchName();

      // Get all commits between base branch and current branch
      const logResult = await git.log({
        from: baseBranch,
        to: currentBranch,
        symmetric: false,
      });

      // Get detailed information for each commit
      for (const commit of logResult.all) {
        // Get the list of changed files in this commit
        const diffResult = await git.diff([
          `${commit.hash}^`,
          commit.hash,
          '--name-only',
        ]);
        const files = diffResult.split('\n').filter(Boolean);

        const fileChanges = [];

        // Get the specific changes for each file
        for (const file of files) {
          const patch = await git.diff([
            `${commit.hash}^`,
            commit.hash,
            '--',
            file,
          ]);
          fileChanges.push({
            file,
            changes: patch,
          });
        }

        commits.push({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author: commit.author_name,
          files: fileChanges,
        });
      }
    }

    return commits;
  } catch (error) {
    console.error(chalk.red('Error getting commits for review:'), error);
    return [];
  }
}

export async function reviewMergeRequest(baseBranch = 'main') {
  const commits = await getCommitsForReview(baseBranch);

  console.log(chalk.blue('\nStarting Merge Request Review\n'));

  for (const commit of commits) {
    console.log(chalk.green('----------------------------------------'));
    console.log(chalk.yellow('Commit:', commit.hash));
    console.log(chalk.cyan('Author:', commit.author));
    console.log(chalk.cyan('Date:', commit.date));
    console.log(chalk.white('\nMessage:'));
    console.log(commit.message);

    console.log(chalk.white('\nChanged Files:'));
    for (const file of commit.files) {
      console.log(chalk.magenta('\nFile:', file.file));
      console.log(chalk.white('Changes:'));
      console.log(file.changes);
    }
    console.log(chalk.green('----------------------------------------\n'));
  }

  console.log(chalk.blue('Merge Request Review Complete'));

  return commits;
}
