import { VcsProvider } from './git-service.interface';
import { GithubProvider } from './github-provider';
import { GitlabProvider } from './gitlab-provider';
import { LocalGitProvider } from './local-git-provider';

export function getVcsProvider(): VcsProvider {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return new GithubProvider();
  }
  if (process.env.GITLAB_CI === 'true') {
    return new GitlabProvider();
  }
  return new LocalGitProvider();
}
