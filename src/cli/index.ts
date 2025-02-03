#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { reviewCommand } from './commands/review';

const program = new Command();

program
  .name('reviewai')
  .description('AI-powered code review assistant')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize ReviewAI configuration')
  .action(initCommand);

program
  .command('review')
  .description('Review code changes')
  .option('-c, --config <path>', 'Path to config file', '.reviewai.yaml')
  .action(reviewCommand);

program.parse(); 