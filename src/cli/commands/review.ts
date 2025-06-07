import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { ProviderFactory } from '../../providers/provider-factory';
import micromatch from 'micromatch';
import { GitPlatformFactory } from '../../services/git-platform-factory';
import { getVcsProvider } from '../../utils/vcs-factory';
import EnvironmentHelpers from '../../utils/environment-helpers';
import {
  outputReviewResults,
  ReviewCommandOptions,
  ReviewContext,
} from './helpers';
import { CodeReviewResult, CodeReviewSuggestion } from '../../types';
import { LineSpecificReviewService } from '../../services/line-specific-review.service';
import { PullRequestFile } from '../../utils/git-service.interface';

export async function initializeReviewContext(
  options: ReviewCommandOptions,
  spinner: ora.Ora,
): Promise<ReviewContext> {
  spinner.text = 'Loading configuration...';
  const configManager = ConfigManager.getInstance();
  await configManager.loadConfig(options.config);
  const config = configManager.getConfig();

  spinner.text = 'Initializing AI provider...';
  const aiProvider = ProviderFactory.createProvider(config);
  const vcs = getVcsProvider();

  let gitService;
  let prDetails;

  if (EnvironmentHelpers.isCI) {
    spinner.text = 'Getting PR details...';
    gitService = GitPlatformFactory.createService();
    prDetails = await gitService.getPRDetails();
  }

  return {
    aiProvider,
    config,
    vcs,
    gitService,
    prDetails,
    spinner,
  };
}

export async function reviewCommand(
  options: ReviewCommandOptions,
): Promise<boolean> {
  const spinner = ora('Starting code review...').start();

  try {
    const context = await initializeReviewContext(options, spinner);

    if (context.config.rules.branchName.enabled) {
      const results = await reviewBranchName(context);
      await outputReviewResults(context, {
        branchName: [
          {
            success: results.success,
            suggestions: results.suggestions,
            error: results.error,
          },
        ],
      });
    }

    if (context.config.rules.commitMessage.enabled) {
      const results = await reviewCommitMessages(context, options.baseBranch);
      await outputReviewResults(context, {
        commitMessages: [
          {
            success: results.success,
            suggestions: results.suggestions,
            error: results.error,
          },
        ],
      });
    }

    if (context.config.rules.codeChanges.enabled) {
      const results = await reviewCodeChanges(context);
      console.log('results========reviewCodeChanges', results);
      await outputReviewResults(context, {
        codeChanges: [
          {
            success: results.success,
            suggestions: results.suggestions,
            error: results.error,
          },
        ],
      });
    }

    spinner.succeed('Code review completed successfully');
    return true;
  } catch (error) {
    await handleReviewError(spinner, error);
    return false;
  } finally {
    spinner.stop();
  }
}

function buildSuccessResult(
  suggestions: CodeReviewSuggestion[],
): CodeReviewResult {
  return {
    success: true,
    suggestions,
    error: undefined,
  };
}

function buildErrorResult(error: unknown): CodeReviewResult {
  return {
    success: false,
    suggestions: [],
    error: {
      message:
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error',
    },
  };
}

async function withReviewErrorHandling(
  fn: () => Promise<CodeReviewResult>,
  fallbackMessage = 'Unknown error',
): Promise<CodeReviewResult> {
  try {
    return await fn();
  } catch (error) {
    return buildErrorResult(error);
  }
}

export async function reviewBranchName(
  context: ReviewContext,
): Promise<CodeReviewResult> {
  return withReviewErrorHandling(async () => {
    context.spinner.text = 'Reviewing branch name...';
    const branchName = await context.vcs.getCurrentBranchName();
    if (!branchName) {
      return buildErrorResult('Could not get current branch name');
    }
    console.log(chalk.blue(`\nReviewing branch: ${chalk.yellow(branchName)}`));
    const result = await context.aiProvider.review(
      context.config.rules.branchName.prompt,
      branchName,
    );
    return buildSuccessResult([{ message: result, reviewType: 'general' }]);
  }, 'Unknown error in branch name review');
}

export async function reviewCommitMessages(
  context: ReviewContext,
  baseBranch?: string,
): Promise<CodeReviewResult> {
  return withReviewErrorHandling(async () => {
    context.spinner.text = 'Getting commit messages...';
    // Note: getPullRequestCommits may not take an argument, fix as needed
    const commits = await context.vcs.getPullRequestCommits();
    if (!Array.isArray(commits) || commits.length === 0) {
      console.log(chalk.gray('\nNo commit messages to review.'));
      return buildSuccessResult([]);
    }
    console.log(
      chalk.blue(`\nFound ${commits.length} commit message(s) to review:`),
    );
    const results: CodeReviewResult[] = [];
    for (const [index, commit] of commits.entries()) {
      context.spinner.text = `Reviewing commit ${index + 1}/${commits.length}...`;
      console.log(chalk.green('\n' + '─'.repeat(50)));
      console.log(
        chalk.yellow(`📝 Commit ${index + 1}: ${commit.hash.slice(0, 7)}`),
      );
      console.log(chalk.cyan(`👤 Author: ${commit.author}`));
      console.log(chalk.cyan(`📅 Date: ${commit.date}`));
      console.log(chalk.white(`💬 Message: ${commit.message}`));
      try {
        const result = await context.aiProvider.review(
          context.config.rules.commitMessage.prompt,
          commit.message,
        );
        results.push(
          buildSuccessResult([
            {
              message:
                typeof result === 'string'
                  ? result
                  : result?.message || JSON.stringify(result),
              reviewType: 'general',
            },
          ]),
        );
      } catch (error) {
        results.push(
          buildErrorResult(
            `Commit ${commit.hash.slice(0, 7)} - ${commit.author}`,
          ),
        );
      }
    }
    return buildSuccessResult(results.flatMap((result) => result.suggestions));
  }, 'Failed to get commit messages');
}

export async function reviewCodeChanges(
  context: ReviewContext,
): Promise<CodeReviewResult> {
  return withReviewErrorHandling(async () => {
    context.spinner.text = 'Getting code changes...';
    const pullRequestReviewInfo = await context.vcs.getPullRequestFiles();
    if (!pullRequestReviewInfo) {
      console.log(chalk.gray('\nNo code changes to review.'));
      return buildSuccessResult([
        {
          message: 'No code changes found',
          file: '',
          line: 0,
          severity: 'info',
          reviewType: 'general',
        },
      ]);
    }
    console.log(chalk.green('\n' + '='.repeat(60)));
    console.log(chalk.blue('📁 Reviewing PR Code Changes:'));
    console.log(chalk.yellow(`📋 PR Title: ${pullRequestReviewInfo.message}`));
    console.log(chalk.yellow(`🔍 Head Commit: ${pullRequestReviewInfo.hash}`));
    console.log(chalk.cyan(`👤 Author: ${pullRequestReviewInfo.author}`));
    console.log(chalk.cyan(`📅 Last Updated: ${pullRequestReviewInfo.date}`));
    const { filteredFiles, skippedFiles } = await filterAndProcessFiles(
      context,
      pullRequestReviewInfo.files || [],
    );
    if (filteredFiles.length === 0) {
      return buildSuccessResult([
        {
          message: `No files matched the review patterns. ${skippedFiles} file(s) skipped.`,
          file: '',
          line: 0,
          severity: 'info',
          reviewType: 'general',
        },
      ]);
    }
    context.spinner.text = 'Analyzing code changes...';
    console.log('filteredFiles========', filteredFiles);
    console.log('context.prDetails========', context.prDetails);
    console.log('context.gitService========', context.gitService);
    // Enhanced: Use line-specific review service if we have PR details and git service
    if (context.prDetails && context.gitService) {
      try {
        console.log(chalk.blue('\n🔍 Performing line-specific code review...'));
        const lineSpecificService = new LineSpecificReviewService(
          context.aiProvider,
          context.gitService,
        );
        // Fix: Map filteredFiles to required format for performLineSpecificReview
        const filesForLineReview = filteredFiles.map((f) => ({
          file: f.filename,
          changes: f.changes,
        }));
        const reviewResult =
          await lineSpecificService.performLineSpecificReview(
            filesForLineReview,
            pullRequestReviewInfo.hash,
            context.prDetails.owner,
            context.prDetails.repo,
            context.prDetails.pullNumber,
            context.config.rules.codeChanges.prompt,
          );
        console.log(
          chalk.green(
            `✅ Posted ${reviewResult.commentsPosted} line-specific comments`,
          ),
        );
        console.log(
          chalk.blue(
            `📋 Found ${reviewResult.generalSuggestions.length} general suggestions`,
          ),
        );
        // Return combined results
        return buildSuccessResult([
          ...reviewResult.generalSuggestions,
          ...reviewResult.lineSpecificSuggestions,
        ]);
      } catch (error) {
        console.warn(
          chalk.yellow(
            '⚠️  Line-specific review failed, falling back to general review',
          ),
        );
        console.error(
          chalk.gray(error instanceof Error ? error.message : 'Unknown error'),
        );
      }
    }
    // Fallback: Use traditional general review
    const reviewContent = prepareCodeReviewFilesContent(filteredFiles);
    try {
      const aiResult = await context.aiProvider.review(
        context.config.rules.codeChanges.prompt,
        reviewContent,
      );
      return buildSuccessResult([
        {
          message: aiResult,
          reviewType: 'general',
        },
      ]);
    } catch (error) {
      return buildErrorResult(error);
    }
  }, 'Unknown error in code changes review');
}

export async function filterAndProcessFiles(
  context: ReviewContext,
  files: PullRequestFile[],
) {
  const patterns = context.config.rules.codeChanges.filePatterns || [];

  const normalizedFiles = files.map((f) => ({
    ...f,
    changes: typeof f.changes === 'string' ? f.changes : '',
  }));

  const filteredFiles = normalizedFiles.filter((change) => {
    const isIgnored = patterns
      .filter((pattern: string) => pattern.startsWith('!'))
      .some((pattern: string) => {
        const cleanPattern = pattern.slice(1);
        return micromatch.isMatch(change.filename, cleanPattern, { dot: true });
      });

    if (isIgnored) {
      console.log(chalk.gray(`⏭️  Ignored: ${change.filename}`));
      return false;
    }

    const isIncluded = patterns
      .filter((pattern: string) => !pattern.startsWith('!'))
      .some((pattern: string) =>
        micromatch.isMatch(change.filename, pattern, { dot: true }),
      );

    if (!isIncluded) {
      console.log(
        chalk.gray(`⏭️  Skipped: ${change.filename} (not matching patterns)`),
      );
    } else {
      const changeLength = change.changes.length;
      console.log(
        chalk.green(`✅ Included: ${change.filename} (${changeLength} bytes)`),
      );
    }

    return isIncluded;
  });

  return {
    filteredFiles,
    skippedFiles: normalizedFiles.length - filteredFiles.length,
  };
}

export function prepareCodeReviewFilesContent(
  files: PullRequestFile[],
): string {
  const MAX_FILE_SIZE = 50000;
  const MAX_TOTAL_SIZE = 100000;

  const truncatedFiles = files.map((change) => ({
    ...change,
    changes:
      change.changes.length > MAX_FILE_SIZE
        ? change.changes.slice(0, MAX_FILE_SIZE) +
          '\n... (content truncated for size limit)'
        : change.changes,
  }));

  const combinedContent = truncatedFiles
    .map((change) => `File: ${change.filename}\n${change.changes}\n`)
    .join('\n---\n\n');

  return combinedContent.length > MAX_TOTAL_SIZE
    ? combinedContent.slice(0, MAX_TOTAL_SIZE) +
        '\n... (content truncated for total size limit)'
    : combinedContent;
}

export async function handleReviewError(
  spinner: ora.Ora,
  error: unknown,
): Promise<void> {
  spinner.fail('Review failed');

  if (error instanceof Error) {
    console.error(chalk.red('\n❌ Error Details:'));
    console.error(chalk.yellow('Message:'), error.message);

    const message = error.message;
    const errorDetails = message.split('Details: ')[1];
    if (errorDetails) {
      try {
        const errorObj = JSON.parse(errorDetails);
        if (errorObj.error) {
          console.error(chalk.yellow('\n🤖 AI Provider Error:'));
          console.error(chalk.gray('Type:'), errorObj.error.type);
          console.error(chalk.gray('Code:'), errorObj.error.code);
          console.error(chalk.gray('Message:'), errorObj.error.message);
        }
      } catch {
        console.error(chalk.gray('Raw error details:'), errorDetails);
      }
    }

    if (error.stack) {
      console.error(chalk.gray('\n📋 Stack Trace:'));
      console.error(chalk.gray(error.stack));
    }
  } else {
    console.error(chalk.red('\n❌ Unknown Error:'), error);
  }
}
