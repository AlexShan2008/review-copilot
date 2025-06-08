import chalk from 'chalk';
import { ReviewConfig, IAIProvider } from '../../types/review.types';
import ora from 'ora';
import EnvironmentHelpers from '../../utils/environment-helpers';
import {
  GitPlatformDetails,
  IGitPlatformService,
} from '../../services/services.types';
import { VcsProvider } from '../../utils/git-service.interface';
import { CodeReviewResult } from '../../providers/provider.types';

export interface ReviewResults {
  branchName?: CodeReviewResult[];
  commitMessages?: CodeReviewResult[];
  codeChanges?: CodeReviewResult[];
}

export interface ReviewContext {
  aiProvider: IAIProvider;
  config: ReviewConfig;
  vcs: VcsProvider;
  gitService?: IGitPlatformService;
  prDetails?: GitPlatformDetails;
  spinner: ora.Ora;
}

export interface ReviewCommandOptions {
  config: string;
  baseBranch?: string;
}

export function printSingleReviewResult(result: CodeReviewResult): void {
  const hasIssues = result.suggestions.length > 0 || result.error !== undefined;

  if (!hasIssues && result.success) {
    return;
  }

  if (result.suggestions.length > 0) {
    result.suggestions.forEach((suggestion) => {
      console.log(`${chalk.blue(suggestion.message)}`);
    });
  }

  if (result.error) {
    console.log(`   🚨 ${chalk.red(result.error.message)}`);
  }

  console.log('');
}

export function formatReviewResultsAsMarkdown(
  results: CodeReviewResult[],
): string {
  if (!Array.isArray(results) || results.length === 0) {
    return '## 🤖 ReviewCopilot Report\n\n✅ No issues found in this review.\n';
  }

  let comment = '## 🤖 ReviewCopilot Report\n\n';

  const resultsWithIssues = results.filter(
    (result) =>
      result.suggestions.length > 0 ||
      result.error !== undefined ||
      !result.success,
  );

  if (resultsWithIssues.length > 0) {
    resultsWithIssues.forEach((result) => {
      if (result.suggestions.length > 0) {
        result.suggestions.forEach((suggestion) => {
          comment += `- ${suggestion.message}\n`;
        });
      }

      if (result.error) {
        comment += `- 🚨 ${result.error.message}\n`;
      }

      comment += '\n';
    });
  }

  return comment;
}

export async function outputReviewResults(
  context: ReviewContext,
  results: ReviewResults,
): Promise<void> {
  context.spinner.text = 'Processing results...';

  if (EnvironmentHelpers.isCI) {
    await outputToCIPlatform(context, results);
  } else {
    await outputToTerminal(results);
  }
}

export async function outputToCIPlatform(
  context: ReviewContext,
  results: ReviewResults,
): Promise<void> {
  context.spinner.text = 'Posting review comments...';

  if (!context.gitService || !context.prDetails) {
    throw new Error('Git service or PR details not found');
  }

  if (results.branchName) {
    const body = formatReviewResultsAsMarkdown(results.branchName);

    await context.gitService.createIssueComment({
      owner: context.prDetails.owner,
      repo: context.prDetails.repo,
      issue_number: context.prDetails.pullNumber,
      body,
    });
  }

  if (results.commitMessages) {
    const body = formatReviewResultsAsMarkdown(results.commitMessages);

    await context.gitService.createIssueComment({
      owner: context.prDetails.owner,
      repo: context.prDetails.repo,
      issue_number: context.prDetails.pullNumber,
      body,
    });
  }

  if (results.codeChanges) {
    // Skip creating review comment if there are no actual code changes to review
    const hasActualCodeChanges = results.codeChanges.some((result) =>
      result.suggestions.some(
        (suggestion) => suggestion.filename && (suggestion.line ?? 0) > 0,
      ),
    );

    if (!hasActualCodeChanges) {
      // Log the message but don't create a review comment
      console.log(
        chalk.gray(
          '\n📋 No code changes to review. Skipping review comment creation.',
        ),
      );
      return;
    }

    const body = formatReviewResultsAsMarkdown(results.codeChanges);

    await context.gitService.createReviewComment({
      owner: context.prDetails.owner,
      repo: context.prDetails.repo,
      pullNumber: context.prDetails.pullNumber,
      body,
      commitId: context.prDetails.commitId,
      path: context.prDetails.path,
      line: 1,
      side: 'RIGHT',
      startLine: 1,
      startSide: 'RIGHT',
      inReplyTo: 1,
    });
  }
}

export async function outputToTerminal(results: ReviewResults): Promise<void> {
  let hasAnyResults = false;

  if (results.branchName) {
    console.log(chalk.blue('\n🌿 Branch Name Review Results:'));
    console.log('─'.repeat(50));
    printReviewResultsToTerminal(results.branchName);
    hasAnyResults = true;
  }

  if (results.commitMessages && results.commitMessages.length > 0) {
    console.log(chalk.blue('\n📝 Commit Messages Review Results:'));
    console.log('─'.repeat(50));
    printReviewResultsToTerminal(results.commitMessages);
    hasAnyResults = true;
  }

  if (results.codeChanges) {
    console.log(chalk.blue('\n🔍 Code Changes Review Results:'));
    console.log('─'.repeat(50));
    printReviewResultsToTerminal(results.codeChanges);
    hasAnyResults = true;
  }

  if (!hasAnyResults) {
    console.log(chalk.gray('\n📋 No review results to display.'));
  }
}

export function printReviewResultsToTerminal(
  results: CodeReviewResult[],
): void {
  if (!Array.isArray(results) || results.length === 0) {
    console.log(chalk.gray('\n📝 No review results to display.\n'));
    return;
  }

  console.log('\n📝 Review Results:\n');

  results.forEach((result) => {
    printSingleReviewResult(result);
  });
}
