import chalk from 'chalk';

type ChalkColor =
  | 'green'
  | 'blue'
  | 'yellow'
  | 'red'
  | 'gray'
  | 'white'
  | 'cyan';

/**
 * Logger utility class for consistent console output with styling
 */
export class Logger {
  static divider(
    char: string = '─',
    length: number = 50,
    color: ChalkColor = 'green',
  ): void {
    console.log(chalk[color]('\n' + char.repeat(length)));
  }

  static info(message: string): void {
    console.log(chalk.blue(message));
  }

  static success(message: string): void {
    console.log(chalk.green(message));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(message));
  }

  static error(message: string): void {
    console.log(chalk.red(message));
  }

  static gray(message: string): void {
    console.log(chalk.gray(message));
  }

  static white(message: string): void {
    console.log(chalk.white(message));
  }

  static cyan(message: string): void {
    console.log(chalk.cyan(message));
  }

  static yellow(message: string): void {
    console.log(chalk.yellow(message));
  }

  static commitInfo(
    commit: { hash: string; author: string; date: string; message: string },
    index: number,
  ): void {
    this.divider();
    this.yellow(`📝 Commit ${index + 1}: ${commit.hash.slice(0, 7)}`);
    this.cyan(`👤 Author: ${commit.author}`);
    this.cyan(`📅 Date: ${commit.date}`);
    this.white(`💬 Message: ${commit.message}`);
  }

  static prInfo(info: {
    message: string;
    hash: string;
    author: string;
    date: string;
  }): void {
    this.divider('=', 60);
    this.info('📁 Reviewing PR Code Changes:');
    this.yellow(`📋 PR Title: ${info.message}`);
    this.yellow(`🔍 Head Commit: ${info.hash}`);
    this.cyan(`👤 Author: ${info.author}`);
    this.cyan(`📅 Last Updated: ${info.date}`);
  }
}
