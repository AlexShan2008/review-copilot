import { IGitPlatformService } from './git-platform.interface';
import { GitHubService } from './github-service';
import { GitLabService } from './gitlab-service';

export class GitPlatformFactory {
  static createService(): IGitPlatformService {
    if (process.env.GITHUB_ACTIONS === 'true') {
      return new GitHubService(process.env.GITHUB_TOKEN!);
    }

    if (process.env.GITLAB_CI === 'true') {
      return new GitLabService(process.env.GITLAB_TOKEN!);
    }

    throw new Error('Unsupported CI platform');
  }
}
