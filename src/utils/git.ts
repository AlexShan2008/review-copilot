import simpleGit, { SimpleGit } from 'simple-git';
import chalk from 'chalk';

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
      content: diff
    });
  }

  return changes;
}

export async function getCurrentBranchName(): Promise<string> {
  try {
    const git: SimpleGit = simpleGit();
    const branch = await git.branch();
    
    if (!branch.current) {
      console.warn(chalk.yellow('Warning: Could not determine current branch name'));
      return '';
    }

    console.log(chalk.blue('Current branch:'), chalk.green(branch.current));
    return branch.current;
  } catch (error) {
    console.error(chalk.red('Error getting branch name:'), error);
    throw new Error(`Failed to get branch name: ${error}`);
  }
}

export async function getCurrentCommitMessage(): Promise<string> {
  try {
    const git: SimpleGit = simpleGit();
    const log = await git.log({ maxCount: 1 });
    
    if (!log.latest?.message) {
      console.warn(chalk.yellow('Warning: No commit message found'));
      return '';
    }

    console.log(chalk.blue('Current commit message:'), chalk.green(log.latest.message));
    return log.latest.message;
  } catch (error) {
    console.error(chalk.red('Error getting commit message:'), error);
    throw new Error(`Failed to get commit message: ${error}`);
  }
} 