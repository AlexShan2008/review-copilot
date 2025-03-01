import { Octokit } from '@octokit/rest';
import fs from 'fs';
import {
  IGitPlatformService,
  GitPlatformDetails,
} from './git-platform.interface';
import { execSync } from 'child_process';

export class GitHubService implements IGitPlatformService {
  private client: Octokit;

  constructor(token: string) {
    this.client = new Octokit({ auth: token });
  }

  async addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
  ): Promise<void> {
    await this.client.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }

  async getPRDetails(): Promise<GitPlatformDetails | null> {
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
            platform: 'github',
          };
        }
      } catch (error) {
        console.error('Error reading GitHub event data:', error);
      }
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    const prNumber = parseInt(process.env.GITHUB_EVENT_NUMBER || '', 10);

    if (owner && repo && !isNaN(prNumber)) {
      return {
        owner,
        repo,
        prNumber,
        platform: 'github',
      };
    }

    return null;
  }

  async getCurrentBranch(): Promise<string> {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }

  async getCommitMessage(): Promise<string> {
    return execSync('git log -1 --pretty=%B').toString().trim();
  }
}
