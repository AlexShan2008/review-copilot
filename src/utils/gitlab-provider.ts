import { VcsProvider, PullRequestReviewInfo } from './git-service.interface';

export class GitlabProvider implements VcsProvider {
  async getCurrentBranchName(): Promise<string> {
    // TODO: Implement GitLab-specific logic
    return '';
  }
  async getPullRequestFiles(): Promise<PullRequestReviewInfo> {
    // TODO: Implement GitLab-specific logic
    return {
      hash: '',
      date: '',
      message: '',
      author: '',
    };
  }
  async getPullRequestCommits(): Promise<PullRequestReviewInfo> {
    // TODO: Implement GitLab-specific logic for getting commit messages
    return {
      hash: '',
      date: '',
      message: '',
      author: '',
    };
  }
}
