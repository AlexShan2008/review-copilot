import { IGitPlatformService } from './services.types';
import { GitHubService } from './github-service';
import { GitLabService } from './gitlab-service';
import { LocalGitService } from './local-git-service';
import EnvironmentHelpers from '../utils/environment-helpers';

export class GitPlatformFactory {
  static createService(): IGitPlatformService {
    if (EnvironmentHelpers.isGitHubActions) {
      return new GitHubService(process.env.GITHUB_TOKEN!);
    }

    if (EnvironmentHelpers.isGitLabCI) {
      return new GitLabService(process.env.GITLAB_TOKEN!);
    }

    // For local development, use LocalGitService
    return new LocalGitService();
  }
}
