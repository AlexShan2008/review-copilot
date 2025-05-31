English | [中文](README.zh-CN.md)

<p align="center">
  <img src="public/logo.svg" alt="ReviewCopilot Logo" width="180" />
</p>

# ReviewCopilot

[![CI Status](https://github.com/AlexShan2008/review-copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexShan2008/review-copilot/actions)
[![codecov](https://codecov.io/gh/AlexShan2008/review-copilot/branch/main/graph/badge.svg)](https://codecov.io/gh/AlexShan2008/review-copilot)
[![npm version](https://img.shields.io/npm/v/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![Total Downloads](https://img.shields.io/npm/dt/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

> **AI-powered code review assistant for GitHub, with customizable rules and multi-provider support.**

---

## 🚀 Features

- **AI-Powered Reviews**: Automated code review using OpenAI or DeepSeek models.
- **Customizable Rules**: Enforce commit message and branch name conventions, and define your own review points.
- **Flexible File Filtering**: Use glob patterns to include/exclude files for review.
- **CI/CD Integration**: Seamlessly integrates with GitHub Actions and GitLab CI (coming soon).
- **Secure & Configurable**: API keys via environment variables, YAML-based config.
- **Beautiful CLI**: User-friendly interface with progress indicators.

---

## ⚡ Quick Start

1. **Install ReviewCopilot:**

   ```bash
   npm install -g review-copilot
   ```

2. **Initialize Configuration:**

   ```bash
   review-copilot init
   ```

   This creates a `.review-copilot.yaml` file in your project.

3. **Set Your AI Provider Key:**
   Add your API key to a `.env` file:

   ```env
   AI_API_KEY_OPENAI=your-key
   # or
   AI_API_KEY_DEEPSEEK=your-key
   ```

4. **Run a Review:**
   ```bash
   review-copilot review
   ```

---

## 🛠️ Configuration

The main configuration file is `.review-copilot.yaml`. Here's a minimal example:

```yaml
providers:
  openai:
    enabled: true
    apiKey: ${AI_API_KEY_OPENAI}
    model: gpt-4o-mini

rules:
  commitMessage:
    enabled: true
    pattern: '^(feat|fix|docs|style|refactor|test|chore|ci)(\\(.+\\))?: .{1,50}'
  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
  codeChanges:
    enabled: true
    filePatterns:
      - '**/*.{ts,tsx,js,jsx}'
      - '!**/dist/**'
      - '!**/node_modules/**'
```

- **Environment Variables**: Use `${VAR_NAME}` in your config to reference values from `.env`.

For advanced configuration and custom review points, see the [Configuration Example](#configuration).

---

## 📦 Usage

- **Review a Pull Request or Branch:**

  ```bash
  review-copilot review
  ```

- **Custom Review Points:**
  Define your own prompts for security, performance, or other checks in `.review-copilot.yaml`:

  ```yaml
  customReviewPoints:
    - name: 'Security Check'
      prompt: 'Review code for security vulnerabilities...'
    - name: 'Performance Review'
      prompt: 'Analyze code for performance bottlenecks...'
  ```

- **File Filtering:**
  Control which files are reviewed:
  ```yaml
  filePatterns:
    - '**/*.ts'
    - '!**/test/**'
    - '!**/dist/**'
    - '!**/node_modules/**'
  ```

---

## 🤖 AI Provider Setup

You can enable and configure multiple AI providers:

```yaml
providers:
  openai:
    enabled: true
    apiKey: ${AI_API_KEY_OPENAI}
    model: gpt-4o-mini
    baseURL: https://api.openai.com/v1
    # Optional:
    defaultHeaders:
      'X-Custom-Header': 'value'
    timeout: 60000

  deepseek:
    enabled: false
    apiKey: ${AI_API_KEY_DEEPSEEK}
    model: deepseek-chat
    baseURL: https://api.deepseek.com/v1
```

---

## 🏗️ CI/CD Integration

ReviewCopilot detects CI environments and can post review comments directly on pull/merge requests.

- **GitHub Actions**: Supported out of the box.
- **GitLab CI**: Planned for future releases.

---

## 📚 Examples: GitHub Integration

See the [examples/README.md](examples/README.md) for a step-by-step guide to integrating ReviewCopilot with GitHub Actions, including:

- Setting up a workflow file ([example](examples/github/.github/workflows/review.yml))
- Configuring repository secrets for your AI API keys
- Installing and initializing ReviewCopilot in your project
- Running code review automatically on pull requests

The example also includes screenshots and tips for a smooth setup.

---

## Expected Results

- The GitHub Actions workflow runs on each pull request.
- ReviewCopilot analyzes code changes and posts comments or suggestions directly on the PR.

---

## 🖼️ Example Review Result

Below is a real example of ReviewCopilot's automated review comment on a pull request:

![ReviewCopilot Review Example](./examples/images/review-comments.png)

See the actual review comment on GitHub: [ReviewCopilot PR Review Example](https://github.com/AlexShan2008/review-copilot/pull/25#issuecomment-2922197158)

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT

---

**For more details, see the [full documentation](./README.md) or open an issue for help.**
