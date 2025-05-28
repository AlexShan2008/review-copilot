export interface GitChange {
  file: string;
  content: string;
}

export interface CommitReviewInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
  files: {
    file: string;
    changes: string;
  }[];
}

export interface VcsProvider {
  getCurrentBranchName(): Promise<string>;
  getCurrentCommitMessage(): Promise<string>;
  getMergeRequestCommits(baseBranch?: string): Promise<string[]>;
  getCommitsForReview(baseBranch?: string): Promise<CommitReviewInfo[]>;
}
