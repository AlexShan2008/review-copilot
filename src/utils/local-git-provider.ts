import simpleGit, { SimpleGit } from 'simple-git';
import { execCommand } from './exec-command';
import {
  VcsProvider,
  PullRequestReviewInfo,
  PullRequestFile,
} from './git-service.interface';

export class LocalGitProvider implements VcsProvider {
  async getCurrentBranchName(): Promise<string> {
    const result = await execCommand('git rev-parse --abbrev-ref HEAD');
    return result.stdout.trim();
  }

  async getPullRequestFiles(): Promise<PullRequestReviewInfo> {
    try {
      const git: SimpleGit = simpleGit();
      const currentBranch = await this.getCurrentBranchName();
      const commits: PullRequestReviewInfo[] = [];
      const logResult = await git.log({
        from: 'main',
        to: currentBranch,
        symmetric: false,
      });
      for (const commit of logResult.all) {
        const diffResult = await git.diff([
          `${commit.hash}^`,
          commit.hash,
          '--name-only',
        ]);
        const files = diffResult.split('\n').filter(Boolean);
        const fileChanges: { file: string; changes: string }[] = [];

        // Limit concurrency for patch fetching
        const concurrency = 3;
        let idx = 0;
        while (idx < files.length) {
          const batch = files.slice(idx, idx + concurrency);
          const patchPromises = batch.map(async (file) => {
            const patch = await git.diff([
              `${commit.hash}^`,
              commit.hash,
              '--',
              file,
            ]);
            return { file, changes: patch };
          });
          const batchResults = await Promise.all(patchPromises);
          fileChanges.push(...batchResults);
          idx += concurrency;
        }

        commits.push({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author: commit.author_name,
          files: fileChanges.map((file) => ({
            filename: file.file,
            changes: file.changes,
          })),
        });
      }

      const reviewInfo: PullRequestReviewInfo = {
        hash: commits[0].hash,
        date: commits[0].date,
        message: commits[0].message,
        author: commits[0].author,
        files: commits
          .map((commit) => commit.files)
          .flat()
          .filter((file): file is PullRequestFile => file !== undefined),
      };

      return reviewInfo;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting commits for review:', error);
      throw new Error('Failed to fetch GitHub PR changes for code review');
    }
  }

  async getPullRequestCommits(): Promise<PullRequestReviewInfo[]> {
    try {
      const git: SimpleGit = simpleGit();
      const currentBranch = await this.getCurrentBranchName();
      const logResult = await git.log({
        from: 'main',
        to: currentBranch,
        symmetric: false,
      });

      return logResult.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        files: [],
      }));
    } catch (error) {
      console.error('Error getting commits for message review:', error);
      return [];
    }
  }
}
