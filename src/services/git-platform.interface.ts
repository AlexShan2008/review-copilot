export interface GitPlatformDetails {
  owner: string;
  repo: string;
  prNumber: number;
  platform: 'github' | 'gitlab';
}

export interface CreateReviewCommentParams {
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
  commitId: string;
  path: string;
  position?: number;
  line?: number;
  side?: 'LEFT' | 'RIGHT';
  startLine?: number;
  startSide?: 'LEFT' | 'RIGHT';
  inReplyTo?: number;
}

export interface createIssueComment {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

export interface IGitPlatformService {
  getPRDetails(): Promise<GitPlatformDetails | null>;
  createIssueComment(params: createIssueComment): Promise<void>;
  replyToComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: number,
    comment: string,
  ): Promise<void>;
  createReviewComment(params: CreateReviewCommentParams): Promise<void>;
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
