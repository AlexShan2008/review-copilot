export interface PullRequestFile {
  filename: string;
  changes: string;
}
export interface PullRequestReviewInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
  files?: PullRequestFile[];
}

export interface VcsProvider {
  getCurrentBranchName(): Promise<string>;
  getPullRequestFiles(): Promise<PullRequestReviewInfo>;
  getPullRequestCommits(): Promise<PullRequestReviewInfo>;
}
