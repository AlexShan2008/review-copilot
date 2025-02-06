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

interface ReviewCommandOptions {
  config: string;
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
    // if (config.rules.commitMessage.enabled) {
    //   const commitMessage = await getCurrentCommitMessage();
    //   const result = await aiProvider.review(
    //     config.rules.commitMessage.prompt,
    //     commitMessage,
    //   );
    //   results.push({
    //     success: !result.includes('ERROR'),
    //     message: 'Commit Message Review',
    //     suggestions: [result],
    //   });
    // }

    // Review branch name if enabled
    if (config.rules.branchName.enabled) {
      const branchName = await getCurrentBranchName();
      const result = await aiProvider.review(
        config.rules.branchName.prompt,
        branchName,
      );
      results.push({
        success: !result.includes('ERROR'),
        message: 'Branch Name Review',
        suggestions: [result],
      });
    }

    // Review code changes if enabled
    // if (config.rules.codeReview.enabled) {
    //   for (const change of changes) {
    //     const result = await aiProvider.review(
    //       config.rules.codeReview.prompt,
    //       change.content,
    //     );
    //     results.push({
    //       success: !result.includes('ERROR'),
    //       message: `Code Review: ${change.file}`,
    //       suggestions: [result],
    //     });
    //   }
    // }

    // Display results
    spinner.stop();
    displayResults(results);

    console.log('Config:', config);
    console.log('Changes:', changes);
    console.log('Review result:', results);

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
