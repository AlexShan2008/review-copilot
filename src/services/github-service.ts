import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
  ): Promise<void> {
    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }

  async getPRDetails(): Promise<{
    owner: string;
    repo: string;
    prNumber: number;
  } | null> {
    const owner = process.env.GITHUB_REPOSITORY_OWNER;
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
    const prNumber = process.env.GITHUB_EVENT_NUMBER;

    if (owner && repo && prNumber) {
      return {
        owner,
        repo,
        prNumber: parseInt(prNumber, 10),
      };
    }

    return null;
  }
}
