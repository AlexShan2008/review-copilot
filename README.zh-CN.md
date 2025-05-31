<p align="center">
  <img src="public/logo.svg" alt="ReviewCopilot Logo" width="180" />
</p>

中文 | [English](README.md)

# ReviewCopilot

[![CI 状态](https://github.com/AlexShan2008/review-copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexShan2008/review-copilot/actions)
[![codecov](https://codecov.io/gh/AlexShan2008/review-copilot/branch/main/graph/badge.svg)](https://codecov.io/gh/AlexShan2008/review-copilot)
[![npm 版本](https://img.shields.io/npm/v/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![总计下载量](https://img.shields.io/npm/dt/review-copilot.svg)](https://www.npmjs.com/package/review-copilot)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![欢迎 PR](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

> **重要提示**
>
> - 目前代码审查仅支持 **GitHub** 平台。
> - 支持的大模型为 **DeepSeek**。
> - 未来将支持 **GitLab**。

ReviewCopilot 是一款基于 AI 的代码审查助手，帮助你通过自定义规则提升代码质量。

## 快速开始

1. 安装：
   ```bash
   npm install -g review-copilot
   ```
2. 初始化配置：
   ```bash
   review-copilot init
   ```
   此命令会生成 `.review-copilot.yaml` 文件，用于配置 AI 代码审查。
3. 在 `.env` 文件中设置你的 AI 提供商密钥：
   ```bash
   AI_API_KEY_OPENAI=你的密钥
   # 或
   AI_API_KEY_DEEPSEEK=你的密钥
   ```
4. 运行代码审查：
   ```bash
   review-copilot review
   ```

## 配置示例

`.review-copilot.yaml` 示例：

```yaml
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
triggers:
  - on: pull_request
  - on: merge_request
  - on: push
rules:
  commitMessage:
    enabled: true
    pattern: '^(feat|fix|docs|style|refactor|test|chore|ci)(\\(.+\\))?: .{1,50}'
    prompt: |
      审查此提交信息，确保其符合 Conventional Commits 规范。
  branchName:
    enabled: true
    pattern: '^(feature|bugfix|hotfix|release)/[A-Z]+-[0-9]+-.+'
    prompt: |
      检查分支名是否符合 <type>/<ticket-id>-<description> 格式。
  codeChanges:
    enabled: true
    filePatterns:
      - '**/*.{ts,tsx}'
      - '**/*.{js,jsx}'
      - '!**/dist/**'
      - '!**/node_modules/**'
    prompt: |
      审查代码变更，关注风格、潜在 bug、性能、安全和最佳实践。
customReviewPoints:
  - name: '安全检查'
    prompt: '审查代码中的安全隐患。'
  - name: '性能评审'
    prompt: '分析代码的性能瓶颈。'
```

## 功能特性

- 支持多 AI 提供商的智能代码审查
- 配置文件支持环境变量替换
- Conventional Commits 提交信息校验
- 分支命名规范检查
- 自定义审查提示语
- 灵活的文件过滤规则
- 多 AI 提供商（OpenAI、DeepSeek）
- 安全的 API 密钥管理
- 友好的 CLI 界面与进度指示

## 文件过滤

通过 glob 模式控制需要审查的文件：

```yaml
filePatterns:
  - '**/*.ts' # 审查所有 TypeScript 文件
  - '!**/test/**' # 忽略测试文件
  - '!**/dist/**' # 忽略构建产物
  - '!**/node_modules/**' # 忽略依赖
```

## AI 提供商配置

可配置多个 AI 提供商，并选择启用：

```yaml
providers:
  openai:
    enabled: true
    apiKey: ${AI_API_KEY_OPENAI}
    model: gpt-4o-mini
    baseURL: https://api.openai.com/v1
    defaultHeaders:
      'X-Custom-Header': 'value'
    timeout: 60000
  deepseek:
    enabled: false
    apiKey: ${AI_API_KEY_DEEPSEEK}
    model: deepseek-chat
    baseURL: https://api.deepseek.com/v1
```

## 环境变量

配置文件支持环境变量替换：

```yaml
providers:
  openai:
    apiKey: ${AI_API_KEY_OPENAI}
    baseURL: ${OPENAI_API_BASE_URL}
```

## CI/CD 集成

ReviewCopilot 可自动检测 CI 环境（如 GitHub Actions、GitLab CI），并在 Pull/Merge Request 上自动评论审查结果。

---

## 📚 示例：GitHub 集成

详见 [examples/README.zh-CN.md](examples/README.zh-CN.md)，该文档提供了 ReviewCopilot 与 GitHub Actions 集成的详细步骤，包括：

- 工作流文件配置（[示例](examples/github/.github/workflows/review.yml)）
- 仓库密钥设置方法
- 在项目中安装和初始化 ReviewCopilot
- 在 Pull Request 上自动运行代码审查

文档还包含截图和实用提示，助你顺利完成集成。

---

## 预期效果

- 每次 PR 时，GitHub Actions 自动运行 ReviewCopilot
- 审查结果会以评论形式反馈在 PR 页面

---

## 🖼️ 实际审查效果

以下为 ReviewCopilot 在 Pull Request 上自动生成的审查评论示例：

![ReviewCopilot 审查示例](./examples/images/review-comments.png)

查看真实 PR 评论：[ReviewCopilot PR 审查示例](https://github.com/AlexShan2008/review-copilot/pull/25#issuecomment-2922197158)

---

## 许可证

MIT
