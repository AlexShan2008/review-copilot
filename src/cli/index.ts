#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { reviewCommand } from './commands/review';
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
  .description('Review code changes')
  .option('-c, --config <path>', 'Path to config file', '.review-copilot.yaml')
  .action(async (options) => {
    const success = await reviewCommand(options);
    if (!success) {
      process.exit(1);
    }
  });

program.parse();
