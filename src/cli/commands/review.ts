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
import { CodeReviewResult } from '../../types';

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
      const results = await reviewCodeChanges(context, options.baseBranch);
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

export async function reviewBranchName(
  context: ReviewContext,
): Promise<CodeReviewResult> {
  context.spinner.text = 'Reviewing branch name...';

  try {
    const branchName = await context.vcs.getCurrentBranchName();
    if (!branchName) {
      return {
        success: false,
        suggestions: [],
        error: {
          message: 'Could not get current branch name',
        },
      };
    }

    console.log(chalk.blue(`\nReviewing branch: ${chalk.yellow(branchName)}`));

    const result = await context.aiProvider.review(
      context.config.rules.branchName.prompt,
      branchName,
    );

    return {
      success: Boolean(result),
      suggestions: [
        {
          message: result,
        },
      ],
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      suggestions: [],
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error in branch name review',
      },
    };
  }
}

export async function reviewCommitMessages(
  context: ReviewContext,
  baseBranch?: string,
): Promise<CodeReviewResult> {
  context.spinner.text = 'Getting commit messages...';

  try {
    const commits = await context.vcs.getPullRequestCommits(
      baseBranch || 'main',
    );

    if (!Array.isArray(commits) || commits.length === 0) {
      console.log(chalk.gray('\nNo commit messages to review.'));
      return {
        success: true,
        suggestions: [],
        error: undefined,
      };
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

        results.push({
          success: Boolean(result),
          suggestions: [
            {
              message:
                typeof result === 'string'
                  ? result
                  : result?.message || JSON.stringify(result),
            },
          ],
          error: undefined,
        });
      } catch (error) {
        results.push({
          success: false,
          suggestions: [],
          error: {
            message: `Commit ${commit.hash.slice(0, 7)} - ${commit.author}`,
          },
        });
      }
    }

    return {
      success: true,
      suggestions: results.flatMap((result) => result.suggestions),
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      suggestions: [],
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get commit messages',
      },
    };
  }
}

export async function reviewCodeChanges(
  context: ReviewContext,
  baseBranch?: string,
): Promise<CodeReviewResult> {
  context.spinner.text = 'Getting code changes...';

  try {
    const prChanges = await context.vcs.getPullRequestFiles(
      baseBranch || 'main',
    );

    if (!Array.isArray(prChanges) || prChanges.length === 0) {
      console.log(chalk.gray('\nNo code changes to review.'));
      return {
        success: true,
        suggestions: [
          {
            message: 'No code changes found',
            file: '',
            line: 0,
            severity: 'info',
          },
        ],
        error: undefined,
      };
    }

    const commit = prChanges[0];
    console.log(chalk.green('\n' + '='.repeat(60)));
    console.log(chalk.blue('📁 Reviewing PR Code Changes:'));
    console.log(chalk.yellow(`📋 PR Title: ${commit.message}`));
    console.log(chalk.yellow(`🔍 Head Commit: ${commit.hash}`));
    console.log(chalk.cyan(`👤 Author: ${commit.author}`));
    console.log(chalk.cyan(`📅 Last Updated: ${commit.date}`));

    const { filteredFiles, skippedFiles } = await filterAndProcessFiles(
      context,
      commit.files || [],
    );

    if (filteredFiles.length === 0) {
      return {
        success: true,
        suggestions: [
          {
            message: `No files matched the review patterns. ${skippedFiles} file(s) skipped.`,
            file: '',
            line: 0,
            severity: 'info',
          },
        ],
        error: undefined,
      };
    }

    context.spinner.text = 'Analyzing code changes...';
    const reviewContent = prepareCodeReviewContent(filteredFiles);

    try {
      const aiResult = await context.aiProvider.review(
        context.config.rules.codeChanges.prompt,
        reviewContent,
      );

      return {
        success: true,
        suggestions: [
          {
            message: aiResult.suggestions,
          },
        ],
        error: undefined,
      };
    } catch (error) {
      return {
        success: false,
        suggestions: [],
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error in code changes review',
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      suggestions: [],
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error in code changes review',
      },
    };
  }
}

export async function filterAndProcessFiles(
  context: ReviewContext,
  files: any[],
) {
  const patterns = context.config.rules.codeChanges.filePatterns ?? [
    '**/*.{ts,tsx,js,jsx}',
  ];

  const normalizedFiles = files.map((f) => ({
    ...f,
    changes: typeof f.changes === 'string' ? f.changes : '',
  }));

  const filteredFiles = normalizedFiles.filter((change) => {
    const isIgnored = patterns
      .filter((pattern: string) => pattern.startsWith('!'))
      .some((pattern: string) => {
        const cleanPattern = pattern.slice(1);
        return micromatch.isMatch(change.file, cleanPattern, { dot: true });
      });

    if (isIgnored) {
      console.log(chalk.gray(`⏭️  Ignored: ${change.file}`));
      return false;
    }

    const isIncluded = patterns
      .filter((pattern: string) => !pattern.startsWith('!'))
      .some((pattern: string) =>
        micromatch.isMatch(change.file, pattern, { dot: true }),
      );

    if (!isIncluded) {
      console.log(
        chalk.gray(`⏭️  Skipped: ${change.file} (not matching patterns)`),
      );
    } else {
      const changeLength = change.changes.length;
      console.log(
        chalk.green(`✅ Included: ${change.file} (${changeLength} bytes)`),
      );
    }

    return isIncluded;
  });

  return {
    filteredFiles,
    skippedFiles: normalizedFiles.length - filteredFiles.length,
  };
}

export function prepareCodeReviewContent(files: any[]): string {
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
    .map((change) => `File: ${change.file}\n${change.changes}\n`)
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
