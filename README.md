# ReviewCopilot

[![CI Status](https://github.com/AlexShan2008/review-copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexShan2008/review-copilot/actions)
[![codecov](https://codecov.io/gh/AlexShan2008/review-copilot/branch/main/graph/badge.svg)](https://codecov.io/gh/AlexShan2008/review-copilot)
[![npm version](https://img.shields.io/npm/v/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![Downloads](https://img.shields.io/npm/dm/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

🤖 AI-powered code review assistant that helps you maintain code quality with customizable rules.

## Quick Start

1. Install:

```bash
npm install -g review-copilot
```

2. Initialize config:

```bash
review-copilot init
```

3. Set your AI provider key in `.env`:

```bash
AI_API_KEY_OPENAI=your-key
# or
AI_API_KEY_DEEPSEEK=your-key
```

4. Run review:

```bash
review-copilot review
```

## Configuration

`.review-copilot.yaml` example:

```yaml
# AI Provider Configuration
providers:
  openai:
    enabled: true
    apiKey: ${AI_API_KEY_OPENAI}
    model: gpt-4-turbo-preview
    baseURL: https://api.openai.com/v1

  deepseek:
    enabled: false
    apiKey: ${AI_API_KEY_DEEPSEEK}
    model: deepseek-chat
    baseURL: https://api.deepseek.com/v1

# Review Triggers
triggers:
  - on: pull_request
  - on: merge_request
  - on: push

# Code Review Rules
rules:
  # Review commit messages
  commitMessage:
    enabled: true
    pattern: '^(feat|fix|docs|style|refactor|test|chore|ci)(\\(.+\\))?: .{1,50}'
    prompt: |
      Review this commit message and ensure it follows conventional commits format.
      Format: <type>(<scope>): <description>
      Types: feat, fix, docs, style, refactor, test, chore, ci

  # Review branch names
  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
    prompt: |
      Verify branch name follows the pattern:
      <type>/<ticket-id>-<description>
      Types: feature, bugfix, hotfix, release

  # Review code changes
  codeChanges:
    enabled: true
    filePatterns:
      - '**/*.{ts,tsx}'
      - '**/*.{js,jsx}'
      - '!**/dist/**'
      - '!**/node_modules/**'
    prompt: |
      Review the code changes for:
      1. Code style and formatting
      2. Potential bugs and issues
      3. Performance considerations
      4. Security vulnerabilities
      5. Best practices compliance

# Custom Review Points
customReviewPoints:
  - name: 'Security Check'
    prompt: 'Review code for security vulnerabilities...'
  - name: 'Performance Review'
    prompt: 'Analyze code for performance bottlenecks...'
```

## Features

- 🔍 AI-powered code review with multiple provider support
- 🔄 Environment variable substitution in configuration
- ✅ Conventional commit message validation
- 🌿 Branch name pattern checking
- 📝 Customizable review prompts
- 🎯 Flexible file pattern filtering
- 🤖 Multiple AI providers (OpenAI, DeepSeek)
- 🔒 Secure API key handling
- 🎨 Beautiful CLI interface with progress indicators

## File Filtering

Control which files to review using glob patterns:

```yaml
filePatterns:
  - '**/*.ts' # Review all TypeScript files
  - '!**/test/**' # Ignore test files
  - '!**/dist/**' # Ignore build output
  - '!**/node_modules/**' # Ignore dependencies
```

## AI Provider Configuration

You can configure multiple AI providers and enable the one you want to use:

```yaml
providers:
  openai:
    enabled: true
    apiKey: ${AI_API_KEY_OPENAI}
    model: gpt-4-turbo-preview
    baseURL: https://api.openai.com/v1
    # Optional settings
    defaultHeaders:
      'X-Custom-Header': 'value'
    timeout: 60000

  deepseek:
    enabled: false
    apiKey: ${AI_API_KEY_DEEPSEEK}
    model: deepseek-chat
    baseURL: https://api.deepseek.com/v1
```

## Environment Variables

The configuration supports environment variable substitution using `${VAR_NAME}` syntax:

```yaml
providers:
  openai:
    apiKey: ${AI_API_KEY_OPENAI}
    baseURL: ${OPENAI_API_BASE_URL}
```

## CI/CD Integration

ReviewCopilot automatically detects CI environments (GitHub Actions, GitLab CI) and can post review comments directly on pull/merge requests.

## License

MIT
