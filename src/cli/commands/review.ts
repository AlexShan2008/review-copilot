import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { AIProviderFactory } from '../../providers/ai-provider-factory';
import { ReviewResult, AIProviderType } from '../../types';
import {
  getGitChanges,
  getCurrentBranchName,
  getCurrentCommitMessage,
} from '../../utils/git';
import { GitHubService } from '../../services/github-service';
import micromatch from 'micromatch';

interface ReviewCommandOptions {
  config: string;
}

function hasReviewSuggestions(result: string): boolean {
  const suggestionPatterns = [
    /suggested\s+to\s+/i,
    /should\s+be\s+/i,
    /incorrect\s+.*,\s+use/i,
    /does\s+not\s+follow\s+.*\s+convention/i,
    /recommend\s+.*\s+instead/i,
    /consider\s+using/i,
    /could\s+be\s+improved/i,
  ];

  return suggestionPatterns.some((pattern) => pattern.test(result));
}

async function processReview(
  aiProvider: any,
  prompt: string,
  content: string,
  reviewType: string,
  results: ReviewResult[],
): Promise<void> {
  const result = await aiProvider.review(prompt, content);
  if (hasReviewSuggestions(result)) {
    results.push({
      success: false,
      message: `${reviewType} Review`,
      suggestions: [result],
    });
  }
}

export async function reviewCommand(
  options: ReviewCommandOptions,
): Promise<boolean> {
  const spinner = ora('Starting code review...').start();

  try {
    const configManager = ConfigManager.getInstance();
    await configManager.loadConfig(options.config);
    const config = configManager.getConfig();

    spinner.text = 'Initializing AI provider...';
    const aiProvider = AIProviderFactory.createProvider({
      provider: config.ai.provider as AIProviderType,
      apiKey: config.ai.apiKey,
      baseURL: config.ai.baseURL,
      model: config.ai.model,
    });

    spinner.text = 'Getting git changes...';
    const changes = await getGitChanges();

    if (!changes.length) {
      spinner.info(chalk.yellow('No changes to review.'));
      return true;
    }

    spinner.text = 'Analyzing changes...';

    const results: ReviewResult[] = [];

    // Review commit message if enabled
    if (config.rules.commitMessage.enabled) {
      const commitMessage = await getCurrentCommitMessage();
      await processReview(
        aiProvider,
        config.rules.commitMessage.prompt,
        commitMessage,
        'Commit Message',
        results,
      );
    }

    // Review branch name if enabled
    if (config.rules.branchName.enabled) {
      const branchName = await getCurrentBranchName();
      await processReview(
        aiProvider,
        config.rules.branchName.prompt,
        branchName,
        'Branch Name',
        results,
      );
    }

    // Review code changes if enabled
    if (config.rules.codeChanges.enabled) {
      const patterns = config.rules.codeChanges.filePatterns ?? [
        '**/*.{ts,tsx,js,jsx}',
      ];
      const filteredChanges = changes.filter((change) =>
        micromatch.isMatch(change.file, patterns, { dot: true }),
      );

      if (filteredChanges.length === 0) {
        spinner.info(chalk.yellow('No matching files to review.'));
        return true;
      }

      const combinedContent = filteredChanges
        .map((change) => `File: ${change.file}\n${change.content}\n`)
        .join('\n---\n\n');

      console.log('Combined content:', combinedContent);

      await processReview(
        aiProvider,
        config.rules.codeChanges.prompt,
        combinedContent,
        'Code',
        results,
      );
    }

    // Display results only if there are any errors
    spinner.stop();
    if (results.length > 0) {
      displayResults(results);

      const comment = formatReviewComment(results);

      if (process.env.GITHUB_ACTIONS === 'true') {
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
          throw new Error('GITHUB_TOKEN is required in CI environment');
        }

        const github = new GitHubService(githubToken);
        const prDetails = await github.getPRDetails();

        if (prDetails) {
          spinner.text = 'Posting review comments to GitHub PR...';
          await github.addPRComment(
            prDetails.owner,
            prDetails.repo,
            prDetails.prNumber,
            comment,
          );
          spinner.succeed('Review comments posted to GitHub PR');
        }
      } else {
        displayResults(results);
      }
    }

    return true;
  } catch (error) {
    spinner.fail(chalk.red('Review failed'));

    if (error instanceof Error) {
      console.error(chalk.red('\nError details:'));
      console.error(chalk.yellow('Message:'), error.message);

      const errorObj = JSON.parse(error.message.split('Details: ')[1] || '{}');
      if (errorObj.error) {
        console.error(chalk.yellow('\nOpenAI Error:'));
        console.error(chalk.gray('Type:'), errorObj.error.type);
        console.error(chalk.gray('Code:'), errorObj.error.code);
        console.error(chalk.gray('Message:'), errorObj.error.message);
      }

      if (error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red('\nUnknown error:'), error);
    }

    return false;
  }
}

function displayResults(results: ReviewResult[]): void {
  console.log('\n📝 Review Results:\n');

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${chalk.bold(result.message)}`);

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
    const icon = result.success ? '✅' : '❌';
    comment += `### ${icon} ${result.message}\n\n`;

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
