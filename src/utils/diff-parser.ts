import { ParsedDiff, DiffHunk, DiffLine } from '../types';

/**
 * Parse a unified diff string into structured data
 */
export function parseDiff(diffString: string, filePath: string): ParsedDiff {
  const lines = diffString.split('\n');
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let position = 0;

  let oldFile = '';
  let newFile = '';
  let additions = 0;
  let deletions = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse file headers
    if (line.startsWith('--- ')) {
      oldFile = line.substring(4);
      continue;
    }
    if (line.startsWith('+++ ')) {
      newFile = line.substring(4);
      continue;
    }

    // Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@')) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const hunkMatch = line.match(
        /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/,
      );
      if (hunkMatch) {
        const oldStart = parseInt(hunkMatch[1], 10);
        const oldLines = parseInt(hunkMatch[2] || '1', 10);
        const newStart = parseInt(hunkMatch[3], 10);
        const newLines = parseInt(hunkMatch[4] || '1', 10);

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          lines: [],
          header: line,
        };
      }
      continue;
    }

    // Parse diff content lines
    if (
      currentHunk &&
      (line.startsWith(' ') || line.startsWith('-') || line.startsWith('+'))
    ) {
      const type = line.startsWith('+')
        ? 'add'
        : line.startsWith('-')
          ? 'remove'
          : 'context';
      const content = line.substring(1);

      // Calculate line numbers
      let oldLineNumber: number | undefined;
      let newLineNumber: number | undefined;
      let lineNumber: number;

      if (type === 'remove') {
        oldLineNumber =
          currentHunk.oldStart +
          currentHunk.lines.filter((l) => l.type !== 'add').length;
        lineNumber = oldLineNumber;
        deletions++;
      } else if (type === 'add') {
        newLineNumber =
          currentHunk.newStart +
          currentHunk.lines.filter((l) => l.type !== 'remove').length;
        lineNumber = newLineNumber;
        additions++;
        position++; // Only increment position for additions and context lines
      } else {
        // context line
        oldLineNumber =
          currentHunk.oldStart +
          currentHunk.lines.filter((l) => l.type !== 'add').length;
        newLineNumber =
          currentHunk.newStart +
          currentHunk.lines.filter((l) => l.type !== 'remove').length;
        lineNumber = newLineNumber;
        position++;
      }

      const diffLine: DiffLine = {
        lineNumber,
        oldLineNumber,
        newLineNumber,
        content,
        type,
        position,
      };

      currentHunk.lines.push(diffLine);
    }
  }

  // Add the last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    filePath,
    oldFile,
    newFile,
    hunks,
    additions,
    deletions,
  };
}

/**
 * Find the position in diff for a specific line number
 */
export function findDiffPosition(
  parsedDiff: ParsedDiff,
  targetLine: number,
): number | null {
  for (const hunk of parsedDiff.hunks) {
    for (const line of hunk.lines) {
      if (
        line.newLineNumber === targetLine &&
        (line.type === 'add' || line.type === 'context')
      ) {
        return line.position;
      }
    }
  }
  return null;
}

/**
 * Get context around a specific line in the diff
 */
export function getDiffContext(
  parsedDiff: ParsedDiff,
  targetLine: number,
  contextLines: number = 3,
): string {
  for (const hunk of parsedDiff.hunks) {
    const targetLineIndex = hunk.lines.findIndex(
      (line) => line.newLineNumber === targetLine,
    );
    if (targetLineIndex !== -1) {
      const startIndex = Math.max(0, targetLineIndex - contextLines);
      const endIndex = Math.min(
        hunk.lines.length - 1,
        targetLineIndex + contextLines,
      );

      const contextLinesArray = hunk.lines.slice(startIndex, endIndex + 1);
      return contextLinesArray
        .map((line) => {
          const prefix =
            line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
          return `${prefix}${line.content}`;
        })
        .join('\n');
    }
  }
  return '';
}

/**
 * Extract all modified lines from a diff that could be candidates for review comments
 */
export function getReviewableLines(parsedDiff: ParsedDiff): Array<{
  line: number;
  content: string;
  position: number;
  context: string;
}> {
  const reviewableLines: Array<{
    line: number;
    content: string;
    position: number;
    context: string;
  }> = [];

  for (const hunk of parsedDiff.hunks) {
    for (const line of hunk.lines) {
      // Only consider added lines and context lines for review
      if (
        (line.type === 'add' || line.type === 'context') &&
        line.newLineNumber
      ) {
        reviewableLines.push({
          line: line.newLineNumber,
          content: line.content,
          position: line.position,
          context: getDiffContext(parsedDiff, line.newLineNumber, 2),
        });
      }
    }
  }

  return reviewableLines;
}

/**
 * Check if a line number exists in the diff and can receive comments
 */
export function isLineCommentable(
  parsedDiff: ParsedDiff,
  lineNumber: number,
): boolean {
  for (const hunk of parsedDiff.hunks) {
    for (const line of hunk.lines) {
      if (
        line.newLineNumber === lineNumber &&
        (line.type === 'add' || line.type === 'context')
      ) {
        return true;
      }
    }
  }
  return false;
}
