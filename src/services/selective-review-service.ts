import { ProviderFactory } from '../providers/provider-factory';
import { ConfigManager } from '../config/config-manager';
import { SelectiveReviewContext } from '../types/selective-review';
import { CodeReviewResult, CodeReviewSuggestion } from '../types';
import { GitPlatformFactory } from './git-platform-factory';

export class SelectiveReviewService {
  private static instance: SelectiveReviewService;

  private constructor() {}

  public static getInstance(): SelectiveReviewService {
    if (!SelectiveReviewService.instance) {
      SelectiveReviewService.instance = new SelectiveReviewService();
    }
    return SelectiveReviewService.instance;
  }

  /**
   * Process a selective code review request
   * @param context The context of the code to review
   * @returns The review results
   */
  public async processSelectiveReview(
    context: SelectiveReviewContext,
  ): Promise<CodeReviewResult> {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getConfig();
    const aiProvider = ProviderFactory.createProvider(config);

    try {
      // Create a prompt that includes the context of the review
      const prompt = this.buildSelectiveReviewPrompt(
        context,
        config.rules.codeChanges.prompt,
      );

      // Get the review from the AI provider
      const result = await aiProvider.review(prompt, context.fullFileContent);

      // Format the result as a CodeReviewResult
      const suggestions: CodeReviewSuggestion[] = result
        ? [
            {
              message:
                typeof result === 'string' ? result : JSON.stringify(result),
              file: context.filePath,
              line: context.startLine,
              severity: 'info',
              reviewType: 'line-specific',
            },
          ]
        : [];

      const reviewResult: CodeReviewResult = {
        success: true,
        suggestions,
        error: undefined,
      };

      // Post the review as a comment
      await this.postReviewComment(context, reviewResult);

      return reviewResult;
    } catch (error) {
      return {
        success: false,
        suggestions: [],
        error: {
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Build a prompt for selective review that includes context
   */
  private buildSelectiveReviewPrompt(
    context: SelectiveReviewContext,
    basePrompt: string,
  ): string {
    return `${basePrompt}

Review Context:
- File: ${context.filePath}
- Selected Lines: ${context.startLine}-${context.endLine}
- Trigger Comment: "${context.triggerComment}"

The code to review is marked with <<<REVIEW_START>>> and <<<REVIEW_END>>> markers in the content.
Please focus your review on the marked section, but consider the full file context for better understanding.

Content to review:
${context.fullFileContent
  .split('\n')
  .map((line, index) => {
    const lineNum = index + 1;
    if (lineNum === context.startLine) {
      return `<<<REVIEW_START>>>${line}`;
    } else if (lineNum === context.endLine) {
      return `${line}<<<REVIEW_END>>>`;
    }
    return line;
  })
  .join('\n')}`;
  }

  /**
   * Post the review results as a comment on the PR
   */
  private async postReviewComment(
    context: SelectiveReviewContext,
    result: CodeReviewResult,
  ): Promise<void> {
    const gitService = GitPlatformFactory.createService();
    const comment = this.formatSelectiveReviewComment(context, result);

    try {
      // Check if this is a PR review comment based on event type
      const isReviewComment =
        process.env.GITHUB_EVENT_TYPE === 'pull_request_review_comment';

      if (isReviewComment && context.threadId) {
        console.log(
          `Attempting to reply to review comment thread ${context.threadId}...`,
        );
        // For PR review comments, use the review comment API
        await gitService.replyToReviewComment(
          context.owner,
          context.repo,
          context.prNumber,
          context.threadId,
          comment,
        );
        console.log('Successfully replied to review comment thread');
      } else if (context.commentId) {
        console.log(`Attempting to reply to comment ${context.commentId}...`);
        // For regular PR comments, use the issues comments API
        await gitService.replyToComment(
          context.owner,
          context.repo,
          context.prNumber,
          context.commentId,
          comment,
        );
        console.log('Successfully replied to comment');
      } else {
        console.log(
          'No comment ID or thread ID provided, creating new comment...',
        );
        // Fallback to creating a new comment
        await gitService.createIssueComment({
          owner: context.owner,
          repo: context.repo,
          issue_number: context.prNumber,
          body: comment,
        });
        console.log('Successfully created new comment');
      }
    } catch (error) {
      console.error('Error posting review comment:', error);
      if (error instanceof Error) {
        if (error.message.includes('Not Found')) {
          throw new Error(
            `Could not find the original comment (ID: ${context.commentId || context.threadId}). The comment may have been deleted or you may not have permission to access it.`,
          );
        }
        throw new Error(`Failed to post review comment: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Format the review results into a markdown comment
   */
  private formatSelectiveReviewComment(
    context: SelectiveReviewContext,
    result: CodeReviewResult,
  ): string {
    let comment = ``;

    if (result.suggestions?.length) {
      result.suggestions.forEach((suggestion) => {
        comment += `- ${suggestion.message}\n`;
      });
    }

    if (result.error) {
      comment += `\n### Errors\n\n`;
      comment += `- ${result.error.message}\n`;
    }

    return comment;
  }
}
