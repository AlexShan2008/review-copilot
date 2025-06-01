import fs from 'fs';
import { IGitPlatformService } from './git-platform.interface';

export interface FileContentProvider {
  getFileContent(
    filePath: string,
    context?: {
      owner?: string;
      repo?: string;
      prNumber?: number;
    },
  ): Promise<string | null>;
}

export class LocalFileContentProvider implements FileContentProvider {
  async getFileContent(filePath: string): Promise<string | null> {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading local file:', error);
      return null;
    }
  }
}

export class GitPlatformFileContentProvider implements FileContentProvider {
  constructor(private gitService: IGitPlatformService) {}

  async getFileContent(
    filePath: string,
    context?: {
      owner?: string;
      repo?: string;
      prNumber?: number;
    },
  ): Promise<string | null> {
    if (!context?.owner || !context?.repo || !context?.prNumber) {
      throw new Error(
        'Missing required context for Git platform file content retrieval',
      );
    }

    return this.gitService.getFileContent(
      context.owner,
      context.repo,
      filePath,
      context.prNumber,
    );
  }
}

export class FileContentProviderFactory {
  static createProvider(gitService?: IGitPlatformService): FileContentProvider {
    if (
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.GITLAB_CI === 'true'
    ) {
      if (!gitService) {
        throw new Error('Git service is required for CI environment');
      }
      return new GitPlatformFileContentProvider(gitService);
    }
    return new LocalFileContentProvider();
  }
}
