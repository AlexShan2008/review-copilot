export interface SelectiveReviewContext {
  // The file path being reviewed
  filePath: string;
  // The specific lines being reviewed (start and end line numbers)
  startLine: number;
  endLine: number;
  // The full file content
  fullFileContent: string;
  // The actual code content to review (selected portion)
  selectedCodeContent: string;
  // The comment that triggered the review
  triggerComment: string;
  // The PR number
  pullNumber: number;
  // The repository owner
  owner: string;
  // The repository name
  repo: string;
  // The comment ID that triggered the review (for thread replies)
  commentId?: number;
  // The comment thread ID (for review comments)
  threadId?: string;
}

export interface ReviewTrigger {
  type: 'full' | 'selective';
  context?: SelectiveReviewContext;
}
