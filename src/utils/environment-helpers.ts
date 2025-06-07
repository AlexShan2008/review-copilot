class EnvironmentHelpers {
  static get isGitHubActions(): boolean {
    return process.env.GITHUB_ACTIONS === 'true';
  }

  static get isGitLabCI(): boolean {
    return process.env.GITLAB_CI === 'true';
  }

  static get isCI(): boolean {
    return this.isGitHubActions || this.isGitLabCI;
  }
}

export default EnvironmentHelpers;
