import simpleGit, { SimpleGit } from 'simple-git';

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
  const git: SimpleGit = simpleGit();
  const branch = await git.branch();
  return branch.current;
}

export async function getCurrentCommitMessage(): Promise<string> {
  const git: SimpleGit = simpleGit();
  const log = await git.log({ maxCount: 1 });
  return log.latest?.message || '';
} 