import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const defaultConfig = `# AI Provider Configuration
providers:
  openai:
    enabled: false
    apiKey: \${AI_API_KEY_OPENAI}
    model: gpt-4o-mini
    baseURL: https://api.openai.com/v1
    reviewLanguage: 'zh'

  deepseek:
    enabled: true
    apiKey: \${AI_API_KEY_DEEPSEEK}
    model: deepseek-chat
    baseURL: https://api.deepseek.com/v1
    reviewLanguage: 'zh'

# Review Triggers
triggers:
  - on: pull_request
  - on: merge_request
  - on: push

# Code Review Rules
rules:
  commitMessage:
    enabled: true
    pattern: '^(feat|fix|docs|style|refactor|test|chore|ci)(\\(.+\\))?: .{1,50}'
    prompt: |
      Review this commit message and ensure it follows conventional commits format.
      Format: <type>(<scope>): <description>
      Types: feat, fix, docs, style, refactor, test, chore, ci

  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
    prompt: |
      Verify branch name follows the pattern:
      <type>/<ticket-id>-<description>
      Types: feature, bugfix, hotfix, release

  codeChanges:
    enabled: true
    filePatterns:
      # Include patterns
      - '**/*.{ts,tsx}'
      - '**/*.{js,jsx}'
      - '**/*.{json}'
      - '**/*.{yaml}'
      - '**/*.{yml}'
      # Exclude patterns
      - '!package-lock.json'
      - '!**/package-lock.json'
      - '!yarn.lock'
      - '!**/yarn.lock'
      - '!pnpm-lock.yaml'
      - '!**/pnpm-lock.yaml'
      - '!**/dist/**'
      - '!**/node_modules/**'
      - '!**/*.min.js'
      - '!**/*.bundle.js'
    prompt: |
      Review the code changes for:
      1. Code style and formatting
      2. Potential bugs and issues
      3. Performance considerations
      4. Security vulnerabilities
      5. Best practices compliance

# Custom Review Points
customReviewPoints:
  - name: 'Security Check'
    prompt: 'Review code for security vulnerabilities...'
  - name: 'Performance Review'
    prompt: 'Analyze code for performance bottlenecks...'
`;

export async function initCommand(): Promise<void> {
  const spinner = ora('Initializing ReviewCopilot configuration...').start();

  try {
    const configPath = path.join(process.cwd(), '.review-copilot.yaml');

    if (existsSync(configPath)) {
      spinner.succeed(chalk.blue('Using existing configuration file'));
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
    console.log(
      chalk.blue('2. Customize the configuration in .review-copilot.yaml'),
    );
    console.log(
      chalk.blue('3. Run `review-copilot review` to start reviewing code\n'),
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to create configuration file'));
    console.error(error);
    throw new Error('process.exit');
  }
}
