// VCS (Version Control System) provider interface and shared types

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
  getChanges(): Promise<GitChange[]>;
  getCurrentBranchName(): Promise<string>;
  getCurrentCommitMessage(): Promise<string>;
  getMergeRequestCommits(baseBranch?: string): Promise<string[]>;
  getCommitsForReview(baseBranch?: string): Promise<CommitReviewInfo[]>;
}
