import { Gitlab } from '@gitbeaker/rest';
import {
  IGitPlatformService,
  GitPlatformDetails,
  CreateReviewCommentParams,
  createIssueComment,
  ReplyToCommentParams,
  ReplyToReviewCommentParams,
  GetFileContentParams,
} from './services.types';

export class GitLabService implements IGitPlatformService {
  private client: InstanceType<typeof Gitlab>;

  constructor(token: string) {
    this.client = new Gitlab({
      token,
    });
  }

  async getPRDetails(): Promise<GitPlatformDetails | undefined> {
    const mrIid = process.env.CI_MERGE_REQUEST_IID;
    if (!mrIid) return undefined;

    return {
      owner: process.env.CI_PROJECT_NAMESPACE || '',
      repo: process.env.CI_PROJECT_NAME || '',
      pullNumber: parseInt(mrIid, 10),
      platform: 'gitlab',
      commitId: process.env.CI_COMMIT_SHA || '',
      path: process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || '',
    };
  }

  async createIssueComment({
    owner,
    repo,
    issue_number,
    body,
  }: createIssueComment): Promise<void> {
    await this.client.MergeRequestNotes.create(
      `${owner}/${repo}`,
      issue_number,
      body,
    );
  }

  async createReviewComment(params: CreateReviewCommentParams): Promise<void> {
    await this.client.MergeRequestNotes.create(
      `${params.owner}/${params.repo}`,
      params.pullNumber,
      params.body,
    );
  }

  async replyToComment(params: ReplyToCommentParams): Promise<void> {
    // Get the original comment
    const originalNote = await this.client.MergeRequestNotes.show(
      `${params.owner}/${params.repo}`,
      params.pullNumber,
      params.commentId,
    );

    // Create a reply comment with reference to the original
    const replyComment = `> ${originalNote.body}\n\n${params.comment}`;
    await this.client.MergeRequestNotes.create(
      `${params.owner}/${params.repo}`,
      params.pullNumber,
      replyComment,
    );
  }

  async replyToReviewComment(
    params: ReplyToReviewCommentParams,
  ): Promise<void> {
    // GitLab doesn't have a direct review comment API
    // We'll create a new comment with a reference to the thread
    const replyComment = `> Thread ${params.threadId}\n\n${params.comment}`;
    await this.client.MergeRequestNotes.create(
      `${params.owner}/${params.repo}`,
      params.pullNumber,
      replyComment,
    );
  }

  async getCurrentBranch(): Promise<string> {
    return process.env.CI_COMMIT_REF_NAME || '';
  }

  async getCommitMessage(): Promise<string> {
    return process.env.CI_COMMIT_MESSAGE || '';
  }

  async getFileContent(params: GetFileContentParams): Promise<string | null> {
    try {
      // Get the MR details to get the source branch
      const mr = await this.client.MergeRequests.show(
        `${params.owner}/${params.repo}`,
        params.pullNumber,
      );

      // Ensure source_branch is a string
      const sourceBranch =
        typeof mr.source_branch === 'string'
          ? mr.source_branch
          : String(mr.source_branch);

      // Get the file content from the MR's source branch
      const file = await this.client.RepositoryFiles.show(
        `${params.owner}/${params.repo}`,
        params.filePath,
        sourceBranch,
      );

      if (file.content) {
        return Buffer.from(file.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }
}
