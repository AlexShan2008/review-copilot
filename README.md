# ReviewAI

🤖 AI-powered code review assistant with customizable prompts: enforce commit messages, branch names and code standards your way.

## Features

- 🔍 Automated code review powered by AI
- ✍️ Commit message format validation
- 🌿 Branch naming convention check
- 📝 Code style and standards verification
- ⚙️ Customizable AI prompts via configuration
- 🔄 Seamless CI/CD integration (GitHub Actions & GitLab CI)
- 🎯 Flexible review trigger points
- 🤖 Multiple AI provider support (OpenAI by default)

## Installation

```bash
npm install -g reviewai
```

## Quick Start

1. Initialize configuration:

```bash
reviewai init
```

This will create a `.reviewai.yaml` configuration file in your project root.

2. Configure your preferences in `.reviewai.yaml`:

```yaml
# AI Provider Configuration
ai:
  provider: openai
  apiKey: ${AI_API_KEY_OPENAI}
  model: gpt-4

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

  codeReview:
    enabled: true
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

## CI/CD Integration

### GitHub Actions

```yaml
name: reviewai Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g reviewai
      - name: Run AI Review
        env:
          AI_API_KEY_OPENAI: ${{ secrets.AI_API_KEY_OPENAI }}
        run: reviewai review
```

### GitLab CI

```yaml
code-review:
  stage: review
  script:
    - npm install -g reviewai
    - reviewai review
  variables:
    AI_API_KEY_OPENAI: $AI_API_KEY_OPENAI
```

## Configuration Options

The `.reviewai.yaml` file supports:

- Custom AI providers configuration
- Review trigger points customization
- Commit message patterns
- Branch naming conventions
- Code review rules and prompts
- Custom review checkpoints

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Environment Variables

Configure your AI provider API keys in `.env`:

```bash
# OpenAI
AI_API_KEY_OPENAI=sk-xxx...

# DeepSeek
AI_API_KEY_DEEPSEEK=sk-xxx...

# Anthropic (Coming soon)
AI_API_KEY_ANTHROPIC=sk-xxx...

# Google Gemini (Coming soon)
AI_API_KEY_GEMINI=xxx...
```

## Supported AI Providers

- OpenAI (GPT-3.5, GPT-4)
- DeepSeek
- Anthropic Claude (Coming soon)
- Google Gemini (Coming soon)

Configure your preferred provider in `.reviewai.yaml`:

```yaml
ai:
  provider: openai # Choose your provider
  apiKey: ${AI_API_KEY_OPENAI} # Use corresponding env variable
  model: gpt-3.5-turbo # Provider-specific model
```
