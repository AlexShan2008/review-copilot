import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { ProviderFactory } from '../../providers/provider-factory';
import { ReviewResult } from '../../types';
import { getCurrentBranchName, getCommitsForReview } from '../../utils/git';
import micromatch from 'micromatch';
import { GitPlatformFactory } from '../../services/git-platform-factory';

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
  const result = await aiProvider.review(prompt, content);
  results.push({
    success: result?.success ?? false,
    message: `${reviewType} Review`,
    suggestions: [result],
    errors: [],
  });
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

    spinner.text = 'Getting all commits in MR...';
    const commits = await getCommitsForReview(options.baseBranch || 'main');

    if (!commits.length) {
      spinner.info('No commits to review.');
      spinner.succeed('Review completed');
      return true;
    }

    console.log(chalk.blue(`\nFound ${commits.length} commits to review`));

    spinner.text = 'Analyzing commits...';
    const results: ReviewResult[] = [];

    for (const commit of commits) {
      console.log(chalk.green('\n----------------------------------------'));
      console.log(chalk.yellow('Reviewing commit:', commit.hash));
      console.log(chalk.cyan('Author:', commit.author));
      console.log(chalk.cyan('Date:', commit.date));
      console.log(chalk.white('\nMessage:'), commit.message);

      // Review code changes if enabled
      if (config.rules.codeChanges.enabled) {
        const patterns = config.rules.codeChanges.filePatterns ?? [
          '**/*.{ts,tsx,js,jsx}',
        ];

        const filteredFiles = commit.files.filter((change) => {
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

        console.log(chalk.blue('\nFiles to review in this commit:'));
        filteredFiles.forEach((change) => {
          console.log(
            chalk.gray(`- ${change.file} (${change.changes.length} bytes)`),
          );
        });

        if (filteredFiles.length > 0) {
          const MAX_FILE_SIZE = 50000;
          const truncatedFiles = filteredFiles.map((change) => ({
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
            `Code Review (Commit: ${commit.hash.slice(0, 7)})`,
            results,
          );
        }
      }

      // Review commit message if enabled
      if (config.rules.commitMessage.enabled) {
        await processReview(
          aiProvider,
          config.rules.commitMessage.prompt,
          commit.message,
          `Commit Message Review (${commit.hash.slice(0, 7)})`,
          results,
        );
      }
    }

    // Review branch name if enabled (only once for the whole MR)
    if (config.rules.branchName.enabled) {
      const branchName = await getCurrentBranchName();
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

      try {
        const errorDetails = error.message.split('Details: ')[1];
        if (errorDetails) {
          const errorObj = JSON.parse(errorDetails);
          if (errorObj.error) {
            console.error(chalk.yellow('\nOpenAI Error:'));
            console.error(chalk.gray('Type:'), errorObj.error.type);
            console.error(chalk.gray('Code:'), errorObj.error.code);
            console.error(chalk.gray('Message:'), errorObj.error.message);
          }
        }
      } catch (parseError) {
        // Ignore JSON parse errors for non-OpenAI errors
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

  const allPassed = results.every(
    (result) =>
      result.success &&
      (!result.suggestions || result.suggestions.length === 0) &&
      (!result.errors || result.errors.length === 0),
  );

  if (allPassed) {
    console.log(chalk.green('🎉 All checks passed! Code looks great!\n'));
  }

  results.forEach((result) => {
    // const icon = result.success ? '✅' : '❌';
    console.log(`${chalk.bold(result.message)}`);

    if (result.suggestions?.length) {
      result.suggestions.forEach((suggestion) => {
        console.log(chalk.gray('  └─ ') + suggestion);
      });
    }

    if (result.errors?.length) {
      result.errors.forEach((error) => {
        console.log(chalk.red('  └─ ') + error);
      });
    }

    console.log(''); // Empty line for readability
  });
}

function formatReviewComment(results: ReviewResult[]): string {
  let comment = '## 🤖 ReviewCopilot Report\n\n';

  results.forEach((result) => {
    // const icon = result.success ? '✅' : '❌';
    comment += `### ${result.message}\n\n`;

    if (result.suggestions?.length) {
      result.suggestions.forEach((suggestion) => {
        comment += `- ${suggestion}\n`;
      });
    }

    if (result.errors?.length) {
      result.errors.forEach((error) => {
        comment += `- ❗ ${error}\n`;
      });
    }

    comment += '\n';
  });

  return comment;
}
