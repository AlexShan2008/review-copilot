# ReviewCopilot

ReviewCopilot is an AI-powered code review assistant that helps developers improve code quality and efficiency.

🤖 AI-powered code review assistant with customizable prompts: enforce commit messages, branch names and code standards your way.

## Features

- 🔍 Automated code review powered by AI
- ✍️ Commit message format validation
- 🌿 Branch naming convention check
- 📝 Code style and standards verification
- ⚙️ Customizable AI prompts via configuration
- 🔄 Multiple AI provider support (OpenAI, DeepSeek)

## Installation

```bash
npm install -g review-copilot
```

## Quick Start

1. Initialize configuration:

```bash
review-copilot init
```

This will create a `.review-copilot.yaml` configuration file in your project root.

2. Configure your preferences in `.review-copilot.yaml`:

```yaml
# AI Provider Configuration
ai:
  provider: openai # or deepseek
  apiKey: ${AI_API_KEY_OPENAI} # or ${AI_API_KEY_DEEPSEEK}
  model: gpt-4 # or gpt-3.5-turbo

# Review Triggers
triggers:
  - on: pull_request
  - on: merge_request
  - on: push

# Code Review Rules
rules:
  commitMessage:
    enabled: true
    pattern: "^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .{1,50}"
    prompt: |
      Review this commit message and ensure it follows conventional commits format.
      Format: <type>(<scope>): <description>
      Types: feat, fix, docs, style, refactor, test, chore

  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
    prompt: |
      Verify branch name follows the pattern:
      <type>/<ticket-id>-<description>
      Types: feature, bugfix, hotfix, release

  codeChanges:
    enabled: true
    prompt: |
      Review the code changes for:
      1. Code style and formatting
      2. Potential bugs and issues
      3. Performance considerations
      4. Security vulnerabilities
      5. Best practices compliance
```

## Command Line Usage

```bash
# Initialize configuration
review-copilot init

# Review current changes
review-copilot review

# Show help
review-copilot --help
```

## Environment Variables

Configure your AI provider API keys in `.env`:

```bash
# OpenAI
AI_API_KEY_OPENAI=your-openai-api-key

# DeepSeek
AI_API_KEY_DEEPSEEK=your-deepseek-api-key
```

## Supported AI Providers

Currently supported AI providers:

- OpenAI (GPT-3.5, GPT-4)
- DeepSeek

Configure your preferred provider in `.review-copilot.yaml`:

```yaml
ai:
  provider: openai # or deepseek
  apiKey: ${AI_API_KEY_OPENAI} # Use corresponding env variable
  model: gpt-4 # Provider-specific model
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
