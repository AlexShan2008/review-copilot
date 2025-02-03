import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager';
import { OpenAIProvider } from '../../providers/openai-provider';
import { ReviewResult } from '../../types';
import { getGitChanges } from '../../utils/git';


interface ReviewCommandOptions {
  config: string;
}

export async function reviewCommand(options: ReviewCommandOptions): Promise<void> {
  const spinner = ora('Starting code review...').start();

  try {
    // Load configuration
    const configManager = ConfigManager.getInstance();
    await configManager.loadConfig(options.config);
    const config = configManager.getConfig();

    // Initialize AI provider
    const aiProvider = new OpenAIProvider(config.ai);

    // Get git changes
    const changes = await getGitChanges();
    
    if (!changes.length) {
      spinner.info(chalk.yellow('No changes to review.'));
      return;
    }

    spinner.text = 'Analyzing changes...';

    const results: ReviewResult[] = [];

    // Review commit message if enabled
    if (config.rules.commitMessage.enabled) {
      const commitMessage = await getCurrentCommitMessage();
      const result = await aiProvider.review(
        config.rules.commitMessage.prompt,
        commitMessage
      );
      results.push({
        success: !result.includes('ERROR'),
        message: 'Commit Message Review',
        suggestions: [result]
      });
    }

    // Review branch name if enabled
    if (config.rules.branchName.enabled) {
      const branchName = await getCurrentBranchName();
      const result = await aiProvider.review(
        config.rules.branchName.prompt,
        branchName
      );
      results.push({
        success: !result.includes('ERROR'),
        message: 'Branch Name Review',
        suggestions: [result]
      });
    }

    // Review code changes if enabled
    if (config.rules.codeReview.enabled) {
      for (const change of changes) {
        const result = await aiProvider.review(
          config.rules.codeReview.prompt,
          change.content
        );
        results.push({
          success: !result.includes('ERROR'),
          message: `Code Review: ${change.file}`,
          suggestions: [result]
        });
      }
    }

    // Display results
    spinner.stop();
    displayResults(results);

  } catch (error) {
    spinner.fail(chalk.red('Review failed'));
    console.error(error);
    process.exit(1);
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

// Git utility functions (to be implemented in utils/git.ts)
async function getCurrentCommitMessage(): Promise<string> {
  // Implementation needed
  return '';
}

async function getCurrentBranchName(): Promise<string> {
  // Implementation needed
  return '';
} 