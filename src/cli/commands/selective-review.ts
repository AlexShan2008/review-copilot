import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { SelectiveReviewService } from '../../services/selective-review-service';
import { SelectiveReviewContext } from '../../types/selective-review';
import { GitPlatformFactory } from '../../services/git-platform-factory';
import { FileContentProviderFactory } from '../../services/file-content-provider';

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
    const configManager = ConfigManager.getInstance();
    await configManager.loadConfig(options.config);

    // Get PR details for context
    const gitService = GitPlatformFactory.createService();
    const prDetails = await gitService.getPRDetails();

    if (!prDetails) {
      if (spinner) spinner.fail('Could not get repository details');
      return false;
    }

    // Get file content using the appropriate provider
    const fileContentProvider =
      FileContentProviderFactory.createProvider(gitService);
    const fileContent = await fileContentProvider.getFileContent(
      options.file,
      process.env.GITHUB_ACTIONS === 'true' || process.env.GITLAB_CI === 'true'
        ? {
            owner: prDetails.owner,
            repo: prDetails.repo,
            prNumber: prDetails.prNumber,
          }
        : undefined,
    );

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

    // Fix: Use inclusive range for GitHub's 1-based line numbers
    const selectedLines = lines.slice(options.startLine - 1, options.endLine);
    const selectedCodeContent = selectedLines.join('\n');

    // Create review context with full file content for better context
    const context: SelectiveReviewContext = {
      filePath: options.file,
      startLine: options.startLine,
      endLine: options.endLine,
      fullFileContent: fileContent, // Pass the entire file content
      selectedCodeContent,
      triggerComment: options.comment,
      prNumber: prDetails.prNumber,
      owner: prDetails.owner,
      repo: prDetails.repo,
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
      result.errors.forEach((error) => {
        console.error(chalk.yellow('Error:'), error);
      });
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
