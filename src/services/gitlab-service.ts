import { Gitlab } from '@gitbeaker/rest';
import {
  IGitPlatformService,
  GitPlatformDetails,
} from './git-platform.interface';

export class GitLabService implements IGitPlatformService {
  private client: InstanceType<typeof Gitlab>;

  constructor(token: string) {
    this.client = new Gitlab({
      token,
    });
  }

  async getPRDetails(): Promise<GitPlatformDetails | null> {
    const mrIid = process.env.CI_MERGE_REQUEST_IID;
    if (!mrIid) return null;

    return {
      owner: process.env.CI_PROJECT_NAMESPACE || '',
      repo: process.env.CI_PROJECT_NAME || '',
      prNumber: parseInt(mrIid, 10),
      platform: 'gitlab',
    };
  }

  async addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void> {
    await this.client.MergeRequestNotes.create(
      `${owner}/${repo}`,
      prNumber,
      comment,
    );
  }

  async replyToComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: number,
    comment: string,
  ): Promise<void> {
    // Get the original comment
    const originalNote = await this.client.MergeRequestNotes.show(
      `${owner}/${repo}`,
      prNumber,
      commentId,
    );

    // Create a reply comment with reference to the original
    const replyComment = `> ${originalNote.body}\n\n${comment}`;
    await this.client.MergeRequestNotes.create(
      `${owner}/${repo}`,
      prNumber,
      replyComment,
    );
  }

  async replyToReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    threadId: string,
    comment: string,
  ): Promise<void> {
    // GitLab doesn't have a direct review comment API
    // We'll create a new comment with a reference to the thread
    const replyComment = `> Thread ${threadId}\n\n${comment}`;
    await this.client.MergeRequestNotes.create(
      `${owner}/${repo}`,
      prNumber,
      replyComment,
    );
  }

  async getCurrentBranch(): Promise<string> {
    return process.env.CI_COMMIT_REF_NAME || '';
  }

  async getCommitMessage(): Promise<string> {
    return process.env.CI_COMMIT_MESSAGE || '';
  }

  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    prNumber: number,
  ): Promise<string | null> {
    try {
      // Get the MR details to get the source branch
      const mr = await this.client.MergeRequests.show(
        `${owner}/${repo}`,
        prNumber,
      );

      // Ensure source_branch is a string
      const sourceBranch =
        typeof mr.source_branch === 'string'
          ? mr.source_branch
          : String(mr.source_branch);

      // Get the file content from the MR's source branch
      const file = await this.client.RepositoryFiles.show(
        `${owner}/${repo}`,
        filePath,
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
