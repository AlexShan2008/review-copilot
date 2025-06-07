import {
  CodeReviewSuggestion,
  LineSpecificSuggestion,
  ParsedDiff,
  IAIProvider,
} from '../types';
import {
  parseDiff,
  getReviewableLines,
  findDiffPosition,
  getDiffContext,
  isLineCommentable,
} from '../utils/diff-parser';
import {
  IGitPlatformService,
  CreateReviewCommentParams,
} from './git-platform.interface';

export interface FileReviewContext {
  filePath: string;
  diffContent: string;
  parsedDiff: ParsedDiff;
  commitId: string;
  owner: string;
  repo: string;
  prNumber: number;
}

export class LineSpecificReviewService {
  constructor(
    private aiProvider: IAIProvider,
    private gitPlatformService: IGitPlatformService,
  ) {}

  /**
   * Perform line-specific code review and post comments directly to the PR
   */
  async performLineSpecificReview(
    files: Array<{
      file: string;
      changes: string;
    }>,
    commitId: string,
    owner: string,
    repo: string,
    prNumber: number,
    reviewPrompt: string,
  ): Promise<{
    generalSuggestions: CodeReviewSuggestion[];
    lineSpecificSuggestions: LineSpecificSuggestion[];
    commentsPosted: number;
  }> {
    const fileContexts: FileReviewContext[] = [];
    const allSuggestions: CodeReviewSuggestion[] = [];
    const lineSpecificSuggestions: LineSpecificSuggestion[] = [];
    let commentsPosted = 0;

    // Parse diff for each file
    for (const file of files) {
      if (!file.changes) continue;

      const parsedDiff = parseDiff(file.changes, file.file);
      fileContexts.push({
        filePath: file.file,
        diffContent: file.changes,
        parsedDiff,
        commitId,
        owner,
        repo,
        prNumber,
      });
    }

    // Get AI suggestions with line context
    if (this.aiProvider.reviewWithLineSpecificSuggestions) {
      // Use enhanced AI provider that can return structured suggestions
      const suggestions =
        await this.aiProvider.reviewWithLineSpecificSuggestions(
          reviewPrompt,
          this.prepareEnhancedReviewContent(fileContexts),
          fileContexts.map((ctx) => ({
            filePath: ctx.filePath,
            parsedDiff: ctx.parsedDiff,
          })),
        );

      allSuggestions.push(...suggestions);
    } else {
      // Fallback to legacy AI provider and parse the response
      const aiResponse = await this.aiProvider.review(
        this.enhancePromptWithLineContext(reviewPrompt),
        this.prepareEnhancedReviewContent(fileContexts),
      );

      const parsedSuggestions = this.parseAISuggestionsWithLineInfo(
        aiResponse,
        fileContexts,
      );

      allSuggestions.push(...parsedSuggestions);
    }

    // Separate general and line-specific suggestions
    const generalSuggestions = allSuggestions.filter(
      (s) => s.reviewType === 'general',
    );
    const lineSpecific = allSuggestions.filter(
      (s) => s.reviewType === 'line-specific',
    ) as LineSpecificSuggestion[];

    // Post line-specific comments
    for (const suggestion of lineSpecific) {
      try {
        const fileContext = fileContexts.find(
          (ctx) => ctx.filePath === suggestion.file,
        );
        if (!fileContext) continue;

        const position = findDiffPosition(
          fileContext.parsedDiff,
          suggestion.line,
        );
        if (position === null) {
          console.warn(
            `Cannot find diff position for line ${suggestion.line} in ${suggestion.file}`,
          );
          continue;
        }

        const commentParams: CreateReviewCommentParams = {
          owner,
          repo,
          pullNumber: prNumber,
          body: suggestion.message,
          commitId,
          path: suggestion.file,
          line: suggestion.line,
          side: 'RIGHT',
          position,
        };

        await this.gitPlatformService.createReviewComment(commentParams);
        commentsPosted++;

        console.log(
          `✅ Posted comment on ${suggestion.file}:${suggestion.line}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to post comment on ${suggestion.file}:${suggestion.line}:`,
          error,
        );
      }
    }

    lineSpecificSuggestions.push(...lineSpecific);

    return {
      generalSuggestions,
      lineSpecificSuggestions,
      commentsPosted,
    };
  }

  /**
   * Enhance the prompt to encourage line-specific suggestions
   */
  private enhancePromptWithLineContext(originalPrompt: string): string {
    return `${originalPrompt}

IMPORTANT: When reviewing code, please provide suggestions in the following format for line-specific issues:

FILE: [filename]
LINE: [line_number]
SUGGESTION: [your suggestion]
SEVERITY: [info|warning|error]

For general suggestions that don't apply to specific lines, use:
GENERAL: [your general suggestion]

Focus on:
1. Code quality and potential bugs
2. Performance improvements
3. Security vulnerabilities
4. Best practices violations
5. Code maintainability

Be specific about which lines need attention and provide actionable suggestions.`;
  }

  /**
   * Prepare enhanced content for AI review with line numbers and context
   */
  private prepareEnhancedReviewContent(
    fileContexts: FileReviewContext[],
  ): string {
    return fileContexts
      .map((ctx) => {
        const reviewableLines = getReviewableLines(ctx.parsedDiff);
        const linesWithNumbers = reviewableLines
          .map((line) => `${line.line}: ${line.content}`)
          .join('\n');

        return `
=== FILE: ${ctx.filePath} ===
Total changes: +${ctx.parsedDiff.additions} -${ctx.parsedDiff.deletions}

Reviewable lines with line numbers:
${linesWithNumbers}

Full diff:
${ctx.diffContent}
`;
      })
      .join('\n\n');
  }

  /**
   * Parse AI response to extract line-specific suggestions
   */
  private parseAISuggestionsWithLineInfo(
    aiResponse: string,
    fileContexts: FileReviewContext[],
  ): CodeReviewSuggestion[] {
    const suggestions: CodeReviewSuggestion[] = [];
    const lines = aiResponse.split('\n');

    let currentFile = '';
    let currentLine = 0;
    let currentSuggestion = '';
    let currentSeverity: 'info' | 'warning' | 'error' = 'info';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('FILE:')) {
        currentFile = trimmedLine.substring(5).trim();
      } else if (trimmedLine.startsWith('LINE:')) {
        const lineMatch = trimmedLine.match(/LINE:\s*(\d+)/);
        if (lineMatch) {
          currentLine = parseInt(lineMatch[1], 10);
        }
      } else if (trimmedLine.startsWith('SUGGESTION:')) {
        currentSuggestion = trimmedLine.substring(11).trim();
      } else if (trimmedLine.startsWith('SEVERITY:')) {
        const severity = trimmedLine.substring(9).trim() as
          | 'info'
          | 'warning'
          | 'error';
        if (['info', 'warning', 'error'].includes(severity)) {
          currentSeverity = severity;
        }
      } else if (trimmedLine.startsWith('GENERAL:')) {
        // General suggestion
        suggestions.push({
          message: trimmedLine.substring(8).trim(),
          reviewType: 'general',
          severity: 'info',
        });
      }

      // If we have all required info for a line-specific suggestion, add it
      if (currentFile && currentLine > 0 && currentSuggestion) {
        const fileContext = fileContexts.find(
          (ctx) => ctx.filePath === currentFile,
        );
        if (
          fileContext &&
          isLineCommentable(fileContext.parsedDiff, currentLine)
        ) {
          suggestions.push({
            message: currentSuggestion,
            file: currentFile,
            line: currentLine,
            severity: currentSeverity,
            reviewType: 'line-specific',
            commitId: fileContext.commitId,
            diffContext: getDiffContext(fileContext.parsedDiff, currentLine),
          } as LineSpecificSuggestion);
        }

        // Reset for next suggestion
        currentFile = '';
        currentLine = 0;
        currentSuggestion = '';
        currentSeverity = 'info';
      }
    }

    return suggestions;
  }

  /**
   * Format a review comment for posting
   */
  private formatReviewComment(suggestion: LineSpecificSuggestion): string {
    const severityEmoji = {
      error: '🚨',
      warning: '⚠️',
      info: '💡',
    };

    const severity = suggestion.severity || 'info';
    return `${severityEmoji[severity]} **${severity.toUpperCase()}**

${suggestion.message}
`;
  }
}
