<p align="center">
  <img src="../public/logo.svg" alt="ReviewCopilot Logo" width="180" />
</p>

中文 | [English](README.md)

# 示例：GitHub Actions 集成

本指南演示如何在 GitHub 仓库中通过 GitHub Actions 配置 **ReviewCopilot** 实现自动化代码审查。

---

## 前置条件

- 一个 GitHub 仓库（新建或已有均可）
- 本地已安装 Node.js 和 npm（或 pnpm/yarn）
- 已获取 OpenAI 或 DeepSeek 的 API 密钥

---

## 步骤详解

### 1. 安装 ReviewCopilot

```bash
npm install -D review-copilot
# 或
pnpm add -D review-copilot
```

### 2. 初始化配置

```bash
npx review-copilot init
```

将在项目根目录生成 `.review-copilot.yaml` 配置文件。

### 3. 添加 API 密钥到 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加：
   - `AI_API_KEY_OPENAI`（用于 OpenAI）
   - 或 `AI_API_KEY_DEEPSEEK`（用于 DeepSeek）

![GitHub Actions secrets setup](./images/github-actions-secrets.png)

### 4. 添加 GitHub Actions 工作流

在 `.github/workflows/review.yml` 文件中添加如下内容：

```yaml
name: ReviewCopilot Code Review

on:
  pull_request:
    types: [opened, synchronize]
  pull_request_review_comment:
    types: [created]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run ReviewCopilot
        env:
          AI_API_KEY_OPENAI: ${{ secrets.AI_API_KEY_OPENAI }}
          AI_API_KEY_DEEPSEEK: ${{ secrets.AI_API_KEY_DEEPSEEK }}
        run: npx review-copilot review
```

> **提示：** 可根据实际情况调整工作流内容。

### 5. （可选）自定义 `.review-copilot.yaml`

根据实际需求编辑 `.review-copilot.yaml`，如指定审查文件、提交信息规范、自定义审查点等。详见 [主配置示例](../.review-copilot.yaml)。

### 6. 测试集成效果

- 新建或更新一个 Pull Request
- ReviewCopilot 会自动运行并在 PR 上评论审查结果

---

## 预期效果

- 每次 PR 时，GitHub Actions 自动运行 ReviewCopilot
- 审查结果会以评论形式反馈在 PR 页面

---

## 实际审查效果

以下为 ReviewCopilot 在 Pull Request 上自动生成的审查评论示例：

![ReviewCopilot Review Example](./images/review-comments.png)

查看真实 PR 评论：[ReviewCopilot PR 审查示例](https://github.com/AlexShan2008/review-copilot/pull/25#issuecomment-2922197158)

---

## 常见问题

- **没有审查评论？**  
  检查 API 密钥是否有效，Secrets 是否正确设置
- **工作流失败？**  
  确认 Node.js 及依赖已安装，YAML 配置无误
- **需要更多帮助？**  
  参见 [主文档](../README.zh-CN.md) 或提交 issue

---

## 更多

- [主文档](../README.zh-CN.md)
- [配置参考](../.review-copilot.yaml)
