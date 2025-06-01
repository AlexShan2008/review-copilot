import { ProviderFactory } from '../providers/provider-factory';
import { ConfigManager } from '../config/config-manager';
import {
  SelectiveReviewContext,
  SelectiveReviewResult,
} from '../types/selective-review';
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
  ): Promise<SelectiveReviewResult> {
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
      const result = await aiProvider.review(prompt, context.codeContent);

      // Format the result
      const reviewResult: SelectiveReviewResult = {
        success: true, // If we get a result, consider it successful
        message: `Selective Review for ${context.filePath} (lines ${context.startLine}-${context.endLine})`,
        suggestions: result ? [result] : [],
        errors: [],
        context: {
          filePath: context.filePath,
          startLine: context.startLine,
          endLine: context.endLine,
        },
      };

      // Post the review as a comment
      await this.postReviewComment(context, reviewResult);

      return reviewResult;
    } catch (error) {
      return {
        success: false,
        message: `Failed to review ${context.filePath}`,
        suggestions: [],
        errors: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
        context: {
          filePath: context.filePath,
          startLine: context.startLine,
          endLine: context.endLine,
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
- Lines: ${context.startLine}-${context.endLine}
- Trigger Comment: "${context.triggerComment}"

Please focus your review on the specific code section provided, considering the context of the trigger comment.`;
  }

  /**
   * Post the review results as a comment on the PR
   */
  private async postReviewComment(
    context: SelectiveReviewContext,
    result: SelectiveReviewResult,
  ): Promise<void> {
    const gitService = GitPlatformFactory.createService();

    const comment = this.formatSelectiveReviewComment(result);

    await gitService.addPRComment(
      context.owner,
      context.repo,
      context.prNumber,
      comment,
    );
  }

  /**
   * Format the review results into a markdown comment
   */
  private formatSelectiveReviewComment(result: SelectiveReviewResult): string {
    let comment = `## 🤖 ReviewCopilot Selective Review\n\n`;
    comment += `Reviewing ${result.context.filePath} (lines ${result.context.startLine}-${result.context.endLine})\n\n`;

    if (result.suggestions?.length) {
      comment += `### Suggestions\n\n`;
      result.suggestions.forEach((suggestion) => {
        comment += `- ${suggestion}\n`;
      });
    }

    if (result.errors?.length) {
      comment += `\n### Errors\n\n`;
      result.errors.forEach((error) => {
        comment += `- ❗ ${error}\n`;
      });
    }

    return comment;
  }
}
