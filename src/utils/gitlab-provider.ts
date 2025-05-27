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
  async getCurrentCommitMessage(): Promise<string> {
    // TODO: Implement GitLab-specific logic
    return '';
  }
  async getMergeRequestCommits(baseBranch = 'main'): Promise<string[]> {
    // TODO: Implement GitLab-specific logic
    return [];
  }
  async getCommitsForReview(baseBranch = 'main'): Promise<CommitReviewInfo[]> {
    // TODO: Implement GitLab-specific logic
    return [];
  }
}
