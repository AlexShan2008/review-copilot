# ReviewCopilot

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
ai:
  provider: openai # or deepseek
  model: gpt-4 # or gpt-3.5-turbo

rules:
  # Review commit messages
  commitMessage:
    enabled: true
    pattern: "^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .{1,50}"

  # Review branch names
  branchName:
    enabled: true
    pattern: "^(feature|bugfix|hotfix)/[A-Z]+-[0-9]+-\\w+"

  # Review code changes
  codeChanges:
    enabled: true
    filePatterns:
      - '**/*.{ts,tsx,js,jsx}' # Files to review
      - '!**/dist/**' # Files to ignore
```

## Features

- 🔍 AI-powered code review
- ✅ Commit message validation
- 🌿 Branch name checking
- 📝 Code style verification
- 🎯 File pattern filtering
- 🤖 Multiple AI providers (OpenAI, DeepSeek)

## File Filtering

Control which files to review using glob patterns:

```yaml
filePatterns:
  - '**/*.ts' # Review all TypeScript files
  - '!**/test/**' # Ignore test files
  - '!**/dist/**' # Ignore build output
```

## License

MIT
