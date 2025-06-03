import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { ProviderFactory } from '../../providers/provider-factory';
import { ReviewResult } from '../../types';
import micromatch from 'micromatch';
import { GitPlatformFactory } from '../../services/git-platform-factory';
import { getVcsProvider } from '../../utils/vcs-factory';

interface ReviewCommandOptions {
  config: string;
  baseBranch?: string;
}

async function processReview(
  aiProvider: any,
  prompt: string,
  content: string,
  reviewType: string,
  results: ReviewResult[],
): Promise<void> {
  try {
    const result = await aiProvider.review(prompt, content);
    // If we get a result, consider it a successful review
    results.push({
      success: result?.success ?? false,
      message: `${reviewType} Review`,
      suggestions: result
        ? [
            {
              message:
                typeof result === 'string'
                  ? result
                  : result?.message
                    ? result.message
                    : JSON.stringify(result),
              severity: 'info',
            },
          ]
        : [],
      errors: [],
    });
  } catch (error) {
    // If there's an error, add it to the results
    results.push({
      success: false,
      message: `${reviewType} Review`,
      suggestions: [],
      errors: [
        {
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ],
    });
  }
}

export async function reviewCommand(
  options: ReviewCommandOptions,
): Promise<boolean> {
  let spinner: ora.Ora | undefined;
  try {
    spinner = ora('Starting code review...').start();
    const configManager = ConfigManager.getInstance();
    await configManager.loadConfig(options.config);
    const config = configManager.getConfig();

    spinner.text = 'Initializing AI provider...';
    const aiProvider = ProviderFactory.createProvider(config);
    const vcs = getVcsProvider();
    const results: ReviewResult[] = [];

    // Review commit messages if enabled
    if (config.rules.commitMessage.enabled) {
      spinner.text = 'Getting commit messages for review...';
      const commits = await vcs.getCommitMessagesForReview(
        options.baseBranch || 'main',
      );

      if (Array.isArray(commits) && commits.length > 0) {
        console.log(
          chalk.blue(`\nFound ${commits.length} commit messages to review`),
        );

        for (const commit of commits) {
          console.log(
            chalk.green('\n----------------------------------------'),
          );
          console.log(chalk.yellow('Reviewing commit:', commit.hash));
          console.log(chalk.cyan('Author:', commit.author));
          console.log(chalk.cyan('Date:', commit.date));
          console.log(chalk.white('\nMessage:'), commit.message);

          await processReview(
            aiProvider,
            config.rules.commitMessage.prompt,
            commit.message,
            `Commit Message Review (${commit.hash.slice(0, 7)})`,
            results,
          );
        }
      } else {
        spinner.info('No commit messages to review.');
      }
    }

    // Review code changes if enabled
    if (config.rules.codeChanges.enabled) {
      spinner.text = 'Getting PR changes for code review...';
      const prChanges = await vcs.getPullRequestChanges(
        options.baseBranch || 'main',
      );

      if (Array.isArray(prChanges) && prChanges.length > 0) {
        const commit = prChanges[0]; // We only need the final state for code review
        console.log(chalk.green('\n----------------------------------------'));
        console.log(chalk.blue('\nReviewing PR changes:'));
        console.log(chalk.yellow('Head commit:', commit.hash));
        console.log(chalk.cyan('Author:', commit.author));
        console.log(chalk.cyan('Last updated:', commit.date));

        const patterns = config.rules.codeChanges.filePatterns ?? [
          '**/*.{ts,tsx,js,jsx}',
        ];

        const files = Array.isArray(commit.files) ? commit.files : [];
        // Normalize files to always have a string 'changes' property
        const normalizedFiles = files.map((f) => ({
          ...f,
          changes: typeof f.changes === 'string' ? f.changes : '',
        }));
        const filteredFiles = normalizedFiles.filter((change) => {
          const isIgnored = patterns
            .filter((pattern) => pattern.startsWith('!'))
            .some((pattern) => {
              const cleanPattern = pattern.slice(1);
              return micromatch.isMatch(change.file, cleanPattern, {
                dot: true,
              });
            });

          if (isIgnored) {
            console.log(chalk.yellow(`Ignoring file: ${change.file}`));
            return false;
          }

          const isIncluded = patterns
            .filter((pattern) => !pattern.startsWith('!'))
            .some((pattern) =>
              micromatch.isMatch(change.file, pattern, { dot: true }),
            );

          if (!isIncluded) {
            console.log(
              chalk.yellow(
                `File not matching include patterns: ${change.file}`,
              ),
            );
          }

          return isIncluded;
        });

        console.log(chalk.blue('\nFiles to review:'));
        filteredFiles.forEach((change) => {
          if (typeof change.changes !== 'string') {
            console.error('DEBUG: change.changes is not a string', change);
          }
          const changeLength =
            typeof change.changes === 'string' ? change.changes.length : 0;
          console.log(chalk.gray(`- ${change.file} (${changeLength} bytes)`));
        });

        if (filteredFiles.length > 0) {
          const MAX_FILE_SIZE = 50000;
          const truncatedFiles = filteredFiles.map((change) => ({
            ...change,
            changes:
              typeof change.changes === 'string' &&
              change.changes.length > MAX_FILE_SIZE
                ? change.changes.slice(0, MAX_FILE_SIZE) +
                  '\n... (content truncated for size limit)'
                : typeof change.changes === 'string'
                  ? change.changes
                  : '',
          }));

          const combinedContent = truncatedFiles
            .map((change) => `File: ${change.file}\n${change.changes}\n`)
            .join('\n---\n\n');

          const MAX_TOTAL_SIZE = 100000;
          const finalContent =
            combinedContent.length > MAX_TOTAL_SIZE
              ? combinedContent.slice(0, MAX_TOTAL_SIZE) +
                '\n... (content truncated for total size limit)'
              : combinedContent;

          await processReview(
            aiProvider,
            config.rules.codeChanges.prompt,
            finalContent,
            'Code Review',
            results,
          );
        }
      } else {
        spinner.info('No code changes to review.');
      }
    }

    // Review branch name if enabled (only once for the whole MR)
    if (config.rules.branchName.enabled) {
      const branchName = await vcs.getCurrentBranchName();
      if (branchName) {
        await processReview(
          aiProvider,
          config.rules.branchName.prompt,
          branchName,
          'Branch Name',
          results,
        );
      }
    }

    // Display results
    spinner.stop();
    if (results.length > 0) {
      displayResults(results);

      if (
        process.env.GITHUB_ACTIONS === 'true' ||
        process.env.GITLAB_CI === 'true'
      ) {
        const gitService = GitPlatformFactory.createService();
        const prDetails = await gitService.getPRDetails();

        if (prDetails) {
          spinner.text = 'Posting review comments...';
          await gitService.addPRComment(
            prDetails.owner,
            prDetails.repo,
            prDetails.prNumber,
            formatReviewComment(results),
          );
          spinner.succeed('Review comments posted');
        }
      }
    } else {
      spinner.succeed('No issues found');
    }

    return true;
  } catch (error) {
    if (spinner) {
      spinner.fail('Review failed');
    }

    if (error instanceof Error) {
      console.error(chalk.red('\nError details:'));
      console.error(chalk.yellow('Message:'), error.message);

      const message = typeof error.message === 'string' ? error.message : '';
      const errorDetails = message.split('Details: ')[1];
      if (typeof errorDetails === 'string' && errorDetails.length > 0) {
        const errorObj = JSON.parse(errorDetails);
        if (errorObj.error) {
          console.error(chalk.yellow('\nOpenAI Error:'));
          console.error(chalk.gray('Type:'), errorObj.error.type);
          console.error(chalk.gray('Code:'), errorObj.error.code);
          console.error(chalk.gray('Message:'), errorObj.error.message);
        }
      }

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

function displayResults(results: ReviewResult[]): void {
  console.log('\n📝 Review Results:\n');

  const allPassed = results.every((result) => result.success);

  if (allPassed) {
    console.log(chalk.green('🎉 All checks passed! Code looks great!\n'));
  }

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${chalk.bold(result.message)}`);

    if (result.suggestions?.length) {
      result.suggestions.forEach((suggestion) => {
        const severity =
          suggestion.severity === 'error'
            ? chalk.red
            : suggestion.severity === 'warning'
              ? chalk.yellow
              : chalk.gray;
        console.log(severity('  └─ ') + suggestion.message);
      });
    }

    if (result.errors?.length) {
      result.errors.forEach((error) => {
        console.log(chalk.red('  └─ ') + error.message);
      });
    }

    console.log(''); // Empty line for readability
  });
}

function formatReviewComment(results: ReviewResult[]): string {
  let comment = '## 🤖 ReviewCopilot Report\n\n';

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    comment += `### ${icon} ${result.message}\n\n`;

    if (result.suggestions?.length) {
      result.suggestions.forEach((suggestion) => {
        const severity =
          suggestion.severity === 'error'
            ? '❗'
            : suggestion.severity === 'warning'
              ? '⚠️'
              : '💡';
        comment += `- ${severity} ${suggestion.message}\n`;
      });
    }

    if (result.errors?.length) {
      result.errors.forEach((error) => {
        comment += `- ❗ ${error.message}\n`;
      });
    }

    comment += '\n';
  });

  return comment;
}
