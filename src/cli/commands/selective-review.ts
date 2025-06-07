import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { SelectiveReviewService } from '../../services/selective-review-service';
import { SelectiveReviewContext } from '../../types/selective-review.types';
import { GitPlatformFactory } from '../../services/git-platform-factory';
import { FileContentProviderFactory } from '../../services/file-content-provider';
import fs from 'fs';

interface SelectiveReviewCommandOptions {
  config: string;
  file: string;
  startLine: number;
  endLine: number;
  comment: string;
  commentId?: number;
  threadId?: string;
}

export async function selectiveReviewCommand(
  options: SelectiveReviewCommandOptions,
): Promise<boolean> {
  let spinner: ora.Ora | undefined;

  try {
    spinner = ora('Starting selective code review...').start();

    // Load configuration
    const configManager = await ConfigManager.getInstance(options.config);

    // Determine if running in CI environment
    const isCI =
      process.env.GITHUB_ACTIONS === 'true' || process.env.GITLAB_CI === 'true';

    let fileContent: string | null = null;
    let prDetails: any = undefined;

    if (isCI) {
      // CI environment, remote pull PR information and file content
      const gitService = GitPlatformFactory.createService();
      prDetails = await gitService.getPRDetails();

      if (!prDetails) {
        if (spinner) spinner.fail('Could not get repository details');
        return false;
      }

      const fileContentProvider =
        FileContentProviderFactory.createProvider(gitService);
      fileContent = await fileContentProvider.getFileContent(options.file, {
        platform: prDetails.platform,
        commitId: prDetails.commitId,
        path: prDetails.path,
        owner: prDetails.owner,
        repo: prDetails.repo,
        pullNumber: prDetails.pullNumber as number,
      });
    } else {
      // Local mode, read local file content
      try {
        fileContent = fs.readFileSync(options.file, 'utf-8');
      } catch (e) {
        if (spinner) spinner.fail(`Could not read local file: ${options.file}`);
        return false;
      }
    }

    if (!fileContent) {
      if (spinner)
        spinner.fail(`Could not get content for file: ${options.file}`);
      return false;
    }

    // Extract the specific lines to review
    const lines = fileContent.split('\n');
    if (options.startLine < 1 || options.endLine > lines.length) {
      if (spinner)
        spinner.fail(
          `Invalid line range: ${options.startLine}-${options.endLine}. File has ${lines.length} lines.`,
        );
      return false;
    }

    // Use inclusive range for selected lines
    const selectedLines = lines.slice(options.startLine - 1, options.endLine);
    const selectedCodeContent = selectedLines.join('\n');

    // Create review context with full file content for better context
    const context: SelectiveReviewContext = {
      filePath: options.file,
      startLine: options.startLine,
      endLine: options.endLine,
      fullFileContent: fileContent, // Always pass the entire file content
      selectedCodeContent,
      triggerComment: options.comment,
      pullNumber: prDetails?.pullNumber,
      owner: prDetails?.owner,
      repo: prDetails?.repo,
      commentId: options.commentId,
      threadId: options.threadId,
    };

    // Process the review
    if (spinner) spinner.text = 'Processing selective review...';
    const reviewService = SelectiveReviewService.getInstance();
    const result = await reviewService.processSelectiveReview(context);

    if (result.success) {
      if (spinner) spinner.succeed('Selective review completed successfully');
    } else {
      if (spinner) spinner.fail('Selective review failed');
      console.error(chalk.red('\nError details:'));
      console.error(chalk.yellow('Error:'), result.error);
    }

    return result.success;
  } catch (error) {
    if (spinner) {
      spinner.fail('Selective review failed');
    }

    if (error instanceof Error) {
      console.error(chalk.red('\nError details:'));
      console.error(chalk.yellow('Message:'), error.message);
      if (error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red('\nUnknown error:'), error);
    }

    return false;
  } finally {
    if (spinner) {
      spinner.stop();
    }
  }
}
