export interface GitPlatformDetails {
  owner: string;
  repo: string;
  prNumber: number;
  platform: 'github' | 'gitlab';
}

export interface IGitPlatformService {
  getPRDetails(): Promise<GitPlatformDetails | null>;
  addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void>;
  getCurrentBranch(): Promise<string>;
  getCommitMessage(): Promise<string>;
}
