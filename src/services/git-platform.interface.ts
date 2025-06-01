export interface GitPlatformDetails {
  owner: string;
  repo: string;
  prNumber: number;
  platform: 'github' | 'gitlab';
}

export interface IGitPlatformService {
  getPRDetails(): Promise<GitPlatformDetails | null>;
  addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void>;
  replyToComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: number,
    comment: string,
  ): Promise<void>;
  replyToReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    threadId: string,
    comment: string,
  ): Promise<void>;
  getCurrentBranch(): Promise<string>;
  getCommitMessage(): Promise<string>;
  getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    prNumber: number,
  ): Promise<string | null>;
}
