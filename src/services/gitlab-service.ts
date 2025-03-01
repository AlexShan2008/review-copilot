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

  async getCurrentBranch(): Promise<string> {
    return process.env.CI_COMMIT_REF_NAME || '';
  }

  async getCommitMessage(): Promise<string> {
    return process.env.CI_COMMIT_MESSAGE || '';
  }
}
