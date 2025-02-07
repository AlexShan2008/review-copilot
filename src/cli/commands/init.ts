import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const defaultConfig = `# AI Provider Configuration
ai:
  provider: openai                    # Support: openai, deepseek, anthropic, gemini
  apiKey: \${AI_API_KEY_OPENAI}      # Use AI_API_KEY_{PROVIDER} format
  model: gpt-3.5-turbo               # Default model for OpenAI
  # baseURL: optional_api_endpoint   # Optional base URL for API endpoint

# Review Triggers
triggers:
  - on: pull_request
  - on: merge_request
  - on: push

# Code Review Rules
rules:
  commitMessage:
    enabled: true
    pattern: '^(feat|fix|docs|style|refactor|test|chore)(?:\([^)]+\))?: .{1,50}'
    prompt: |
      Review this commit message and ensure it follows conventional commits format.
      Format: <type>(<scope>): <description>
      Types: feat, fix, docs, style, refactor, test, chore

  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
    prompt: |
      Verify branch name follows the pattern:
      <type>/<ticket-id>-<description>
      Types: feature, bugfix, hotfix, release

  codeReview:
    enabled: true
    prompt: |
      Review the code changes for:
      1. Code style and formatting
      2. Potential bugs and issues
      3. Performance considerations
      4. Security vulnerabilities
      5. Best practices compliance

# Custom Review Points
customReviewPoints:
  - name: "Security Check"
    prompt: "Review code for security vulnerabilities..."
  - name: "Performance Review"
    prompt: "Analyze code for performance bottlenecks..."
`;

export async function initCommand(): Promise<void> {
  const spinner = ora('Initializing ReviewAI configuration...').start();

  try {
    const configPath = path.join(process.cwd(), '.reviewai.yaml');

    if (existsSync(configPath)) {
      spinner.fail(chalk.yellow('Configuration file already exists!'));
      console.log(
        chalk.blue(
          'To overwrite, please remove the existing .reviewai.yaml file first.',
        ),
      );
      return;
    }

    await writeFile(configPath, defaultConfig, 'utf8');
    spinner.succeed(chalk.green('Configuration file created successfully!'));

    console.log('\nNext steps:');
    console.log(
      chalk.blue(
        '1. Set your OpenAI API key in .env or as environment variable',
      ),
    );
    console.log(chalk.blue('2. Customize the configuration in .reviewai.yaml'));
    console.log(
      chalk.blue('3. Run `reviewai review` to start reviewing code\n'),
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to create configuration file'));
    console.error(error);
    process.exit(1);
  }
}
