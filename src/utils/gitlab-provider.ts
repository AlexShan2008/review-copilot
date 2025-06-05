import {
  VcsProvider,
  GitChange,
  CommitReviewInfo,
} from './git-service.interface';

export class GitlabProvider implements VcsProvider {
  async getChanges(): Promise<GitChange[]> {
    // TODO: Implement GitLab-specific logic
    return [];
  }
  async getCurrentBranchName(): Promise<string> {
    // TODO: Implement GitLab-specific logic
    return '';
  }
  async getPullRequestFiles(baseBranch = 'main'): Promise<CommitReviewInfo[]> {
    // TODO: Implement GitLab-specific logic
    return [];
  }
  async getPullRequestCommits(
    baseBranch = 'main',
  ): Promise<CommitReviewInfo[]> {
    // TODO: Implement GitLab-specific logic for getting commit messages
    return [];
  }
}
