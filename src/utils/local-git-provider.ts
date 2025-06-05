import simpleGit, { SimpleGit } from 'simple-git';
import { execCommand } from './exec-command';
import { VcsProvider, CommitReviewInfo } from './git-service.interface';

export class LocalGitProvider implements VcsProvider {
  async getCurrentBranchName(): Promise<string> {
    const result = await execCommand('git rev-parse --abbrev-ref HEAD');
    return result.stdout.trim();
  }

  async getPullRequestFiles(baseBranch = 'main'): Promise<CommitReviewInfo[]> {
    try {
      const git: SimpleGit = simpleGit();
      const commits: CommitReviewInfo[] = [];
      const currentBranch = await this.getCurrentBranchName();
      const logResult = await git.log({
        from: baseBranch,
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
          files: fileChanges,
        });
      }
      return commits;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting commits for review:', error);
      return [];
    }
  }

  async getPullRequestCommits(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    try {
      const git: SimpleGit = simpleGit();
      const commits: CommitReviewInfo[] = [];
      const currentBranch = await this.getCurrentBranchName();
      const logResult = await git.log({
        from: baseBranch,
        to: currentBranch,
        symmetric: false,
      });

      // For commit message review, we only need basic commit info without files
      return logResult.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        files: [], // Empty files array as we don't need file changes for message review
      }));
    } catch (error) {
      console.error('Error getting commits for message review:', error);
      return [];
    }
  }
}
