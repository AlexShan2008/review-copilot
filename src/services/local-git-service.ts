import {
  IGitPlatformService,
  GitPlatformDetails,
  CreateReviewCommentParams,
  createIssueComment,
} from './git-platform.interface';
import { execSync } from 'child_process';
import fs from 'fs';

export class LocalGitService implements IGitPlatformService {
  async getPRDetails(): Promise<GitPlatformDetails | null> {
    // In local development, we'll use the current branch and repository info
    try {
      const remoteUrl = execSync('git config --get remote.origin.url')
        .toString()
        .trim();
      const branch = execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim();

      // Parse remote URL to get owner and repo
      // Handle both HTTPS and SSH URLs
      let owner: string, repo: string;
      if (remoteUrl.startsWith('https://')) {
        const parts = remoteUrl.replace('https://', '').split('/');
        owner = parts[parts.length - 2];
        repo = parts[parts.length - 1].replace('.git', '');
      } else {
        // SSH URL format: git@github.com:owner/repo.git
        const parts = remoteUrl.split(':')[1].split('/');
        owner = parts[0];
        repo = parts[1].replace('.git', '');
      }

      // For local development, we'll use a dummy PR number
      return {
        owner,
        repo,
        prNumber: 1, // Dummy PR number for local development
        platform: 'github', // Default to GitHub for local development
      };
    } catch (error) {
      console.error('Error getting local git details:', error);
      return null;
    }
  }

  async createIssueComment({
    owner,
    repo,
    issue_number,
    body,
  }: createIssueComment): Promise<void> {
    // In local development, just log the comment
    console.log('\n=== Review Comment ===');
    console.log(body);
    console.log('=====================\n');
  }

  async createReviewComment(params: CreateReviewCommentParams): Promise<void> {
    // In local development, just log the comment
    console.log('\n=== Review Comment ===');
    console.log(params.body);
    console.log('=====================\n');
  }

  async replyToComment(
    owner: string,
    repo: string,
    prNumber: number,
    commentId: number,
    comment: string,
  ): Promise<void> {
    // In local development, just log the reply
    console.log('\n=== Reply to Comment ===');
    console.log(`Comment ID: ${commentId}`);
    console.log(comment);
    console.log('=====================\n');
  }

  async replyToReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    threadId: string,
    comment: string,
  ): Promise<void> {
    // In local development, just log the review reply
    console.log('\n=== Reply to Review Comment ===');
    console.log(`Thread ID: ${threadId}`);
    console.log(comment);
    console.log('=====================\n');
  }

  async getCurrentBranch(): Promise<string> {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }

  async getCommitMessage(): Promise<string> {
    return execSync('git log -1 --pretty=%B').toString().trim();
  }

  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    prNumber: number,
  ): Promise<string | null> {
    try {
      // In local development, read the file directly from the filesystem
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
      return null;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }
}
