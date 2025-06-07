export interface GitPlatformDetails {
  owner: string;
  repo: string;
  pullNumber: number;
  platform: 'github' | 'gitlab';
  commitId: string;
  path: string;
}

export interface ReplyToCommentParams {
  owner: string;
  repo: string;
  pullNumber: number;
  commentId: number;
  comment: string;
}

export interface CreateReviewCommentParams {
  owner: string;
  repo: string;
  pullNumber: number;
  body: string;
  commitId: string;
  path: string;
  line?: number;
  side?: 'LEFT' | 'RIGHT';
  startLine?: number;
  startSide?: 'LEFT' | 'RIGHT';
  inReplyTo?: number;
  subjectType?: 'line' | 'file';
}

export interface ReplyToReviewCommentParams {
  owner: string;
  repo: string;
  pullNumber: number;
  threadId: string;
  comment: string;
}

export interface createIssueComment {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

export interface GetFileContentParams {
  owner: string;
  repo: string;
  filePath: string;
  pullNumber: number;
}

export interface IGitPlatformService {
  getPRDetails(): Promise<GitPlatformDetails | null>;
  createIssueComment(params: createIssueComment): Promise<void>;
  replyToComment(params: ReplyToCommentParams): Promise<void>;
  createReviewComment(params: CreateReviewCommentParams): Promise<void>;
  replyToReviewComment(params: ReplyToReviewCommentParams): Promise<void>;
  getCurrentBranch(): Promise<string>;
  getCommitMessage(): Promise<string>;
  getFileContent(params: GetFileContentParams): Promise<string | null>;
}
