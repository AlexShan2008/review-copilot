import { Octokit } from '@octokit/rest';
import fs from 'fs';

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
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(
          fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
        );

        if (eventData.pull_request) {
          return {
            owner: eventData.repository.owner.login,
            repo: eventData.repository.name,
            prNumber: eventData.pull_request.number,
          };
        }
      } catch (error) {
        console.error('Error reading GitHub event data:', error);
      }
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    const prNumber = parseInt(process.env.GITHUB_EVENT_NUMBER || '', 10);

    if (owner && repo && !isNaN(prNumber)) {
      return { owner, repo, prNumber };
    }

    return null;
  }
}
