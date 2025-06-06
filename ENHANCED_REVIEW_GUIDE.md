# Line-Specific AI Code Review Guide

This guide explains how to use the enhanced AI code review system that can add comments directly to specific lines in your Pull Request files, rather than just general PR comments.

## 🚀 Features

The enhanced system provides:

1. **Line-specific comments**: AI suggestions are posted directly on the relevant lines in your PR
2. **Diff parsing**: Intelligent parsing of git diffs to extract line-by-line information
3. **Smart positioning**: Accurate placement of comments using GitHub's review comment API
4. **Structured suggestions**: AI responses include file paths, line numbers, and severity levels
5. **Fallback mechanism**: Gracefully falls back to general comments if line-specific review fails

## 🔧 How It Works

### 1. Diff Parsing

The system parses git diffs to extract:

- Line numbers (old and new)
- Change types (additions, deletions, context)
- Diff positions for GitHub API
- Reviewable lines that can receive comments

### 2. AI Review Enhancement

The AI prompt is enhanced to encourage line-specific feedback:

```
FILE: [filename]
LINE: [line_number]
SUGGESTION: [your suggestion]
SEVERITY: [info|warning|error]
```

### 3. Comment Placement

Line-specific suggestions are automatically posted as PR review comments using:

- Correct line numbers
- Proper diff positions
- GitHub's review comment API

## 📋 Usage Examples

### Basic Command

```bash
# This will automatically use line-specific review in CI environments
npx review-copilot review
```

### Configuration

The system automatically detects when running in CI and has access to PR details. No additional configuration is needed.

### AI Response Format

When the AI provides feedback, it should follow this format:

```
FILE: src/components/UserCard.tsx
LINE: 25
SUGGESTION: Consider adding null checks before accessing user.email property to prevent runtime errors
SEVERITY: warning

FILE: src/utils/api.ts
LINE: 42
SUGGESTION: This API call should include proper error handling with try-catch blocks
SEVERITY: error

GENERAL: Overall code structure looks good, but consider adding unit tests for the new functionality
```

## 🔍 Key Components

### 1. Enhanced Types

- `LineSpecificSuggestion`: Extends base suggestions with line info
- `ParsedDiff`: Structured representation of git diffs
- `DiffLine`: Individual line information with positioning

### 2. Diff Parser Utilities

- `parseDiff()`: Parse unified diff strings
- `findDiffPosition()`: Find GitHub API position for line numbers
- `getReviewableLines()`: Extract lines that can receive comments
- `isLineCommentable()`: Check if a line can receive comments

### 3. Line-Specific Review Service

- Coordinates AI reviews with comment placement
- Handles both enhanced and legacy AI providers
- Posts comments directly to PR files
- Provides detailed logging and error handling

## 🎯 Best Practices

### For AI Prompts

1. **Be specific**: Request line-by-line analysis
2. **Include context**: Ask for file paths and line numbers
3. **Set severity**: Distinguish between errors, warnings, and info
4. **Focus areas**: Security, performance, maintainability, bugs

### For Comment Quality

1. **Actionable suggestions**: Provide clear steps to fix issues
2. **Context-aware**: Reference surrounding code when relevant
3. **Constructive**: Focus on improvement rather than criticism
4. **Prioritized**: Use severity levels appropriately

## 🛠️ Technical Implementation

### Core Files Created/Modified:

1. **`src/types.ts`**: Enhanced with line-specific interfaces
2. **`src/utils/diff-parser.ts`**: New utility for parsing git diffs
3. **`src/services/line-specific-review.service.ts`**: Main service coordinating reviews
4. **`src/cli/commands/review.ts`**: Enhanced to use line-specific reviews

### Integration Points:

- Works with existing GitHub/GitLab services
- Compatible with all AI providers (OpenAI, DeepSeek, etc.)
- Maintains backward compatibility with general reviews

## 🔄 Fallback Behavior

The system gracefully handles failures:

1. **No PR context**: Falls back to general review
2. **API errors**: Continues with traditional comments
3. **Parsing failures**: Uses general review content
4. **Line positioning issues**: Logs warnings but continues

## 📊 Benefits

### For Developers:

- **Contextual feedback**: Comments appear exactly where issues exist
- **Faster resolution**: No need to search for problematic lines
- **Better learning**: See issues in context of actual code

### For Teams:

- **Improved code quality**: More precise feedback leads to better fixes
- **Efficient reviews**: Human reviewers can focus on higher-level concerns
- **Consistent standards**: AI applies consistent criteria across all PRs

## 🚨 Troubleshooting

### Common Issues:

1. **Comments not appearing on lines**:

   - Check if running in CI environment with proper GitHub token
   - Verify PR permissions allow review comments
   - Check logs for diff parsing errors

2. **AI not providing line-specific format**:

   - Update prompts to explicitly request the format
   - Consider implementing the optional `reviewWithLineSpecificSuggestions` method

3. **Position errors**:
   - Diff parsing might fail on complex merges
   - System will log warnings and continue with general comments

### Debug Information:

The system provides detailed logging:

- Diff parsing results
- Line position calculations
- Comment posting status
- Fallback triggers

## 🎉 Result

With this enhancement, your AI code review will:

- ✅ Post comments directly on relevant lines
- ✅ Provide actionable, contextual feedback
- ✅ Integrate seamlessly with existing workflows
- ✅ Maintain reliability with automatic fallbacks
- ✅ Support all major git platforms (GitHub, GitLab)

The line-specific review system transforms generic AI feedback into precise, actionable code improvements that appear exactly where developers need them most.
