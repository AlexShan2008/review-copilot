#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { reviewCommand } from './commands/review';
import { selectiveReviewCommand } from './commands/selective-review';
import { version } from '../../package.json';

const program = new Command();

program
  .name('review-copilot')
  .description('AI-powered code review assistant')
  .version(version);

program
  .command('init')
  .description('Initialize ReviewCopilot configuration')
  .action(initCommand);

program
  .command('review')
  .description('Review all changes in the current PR')
  .option(
    '-c, --config <path>',
    'Path to the config file',
    '.review-copilot.yaml',
  )
  .option(
    '-b, --base-branch <branch>',
    'Base branch to compare against',
    'main',
  )
  .action(async (options) => {
    const success = await reviewCommand(options);
    if (!success) {
      process.exit(1);
    }
  });

program
  .command('selective-review')
  .description('Review specific code in a PR based on a comment')
  .option(
    '-c, --config <path>',
    'Path to the config file',
    '.review-copilot.yaml',
  )
  .requiredOption('-f, --file <path>', 'Path to the file to review')
  .requiredOption('-s, --start-line <number>', 'Start line number', parseInt)
  .requiredOption('-e, --end-line <number>', 'End line number', parseInt)
  .requiredOption(
    '-m, --comment <text>',
    'The comment that triggered the review',
  )
  .option(
    '--comment-id <number>',
    'ID of the comment that triggered the review',
    parseInt,
  )
  .option(
    '--thread-id <string>',
    'ID of the comment thread for review comments',
  )
  .action(async (options) => {
    const success = await selectiveReviewCommand(options);
    if (!success) {
      process.exit(1);
    }
  });

program.parse();
