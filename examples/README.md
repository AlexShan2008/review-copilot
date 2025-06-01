English | [中文](README.zh-CN.md)

<p align="center">
  <img src="../public/logo.svg" alt="ReviewCopilot Logo" width="180" />
</p>

# Example: GitHub Actions Integration

This guide shows you how to set up **ReviewCopilot** for automated code review in your GitHub repository using GitHub Actions.

---

## Prerequisites

- A GitHub repository (new or existing)
- Node.js and npm (or pnpm/yarn) installed locally
- An API key for your chosen AI provider (OpenAI or DeepSeek)

---

## Step-by-Step Setup

### 1. Install ReviewCopilot

```bash
npm install -D review-copilot
# or
pnpm add -D review-copilot
```

### 2. Initialize Configuration

```bash
npx review-copilot init
```

This creates a `.review-copilot.yaml` file in your project root.

### 3. Add Your API Key as a GitHub Secret

1. Go to your GitHub repository.
2. Navigate to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add:
   - `AI_API_KEY_OPENAI` (for OpenAI)
   - or `AI_API_KEY_DEEPSEEK` (for DeepSeek)

![GitHub Actions secrets setup](./images/github-actions-secrets.png)

### 4. Add the GitHub Actions Workflow

Create a file named `.github/workflows/review.yml` in the root directory of the project with the following content:

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

> **Tip:** Adjust the workflow as needed for your package manager or CI setup.

### 5. (Optional) Customize `.review-copilot.yaml`

Edit `.review-copilot.yaml` to match your review needs. For example, you can specify which files to review, set commit message rules, or add custom review points. See the [main config example](../.review-copilot.yaml) for details.

### 6. Test the Integration

- Manually open a pull request in your repository. If you're using `github-script` to create the PR automatically, refer to [auto-pr example](../.github/workflows/auto-pr.yml).

- ReviewCopilot will automatically run and post review comments if issues are found.

**Note:** When using the repository's `GITHUB_TOKEN` to perform tasks, events triggered by that token—except for `workflow_dispatch` and `repository_dispatch`—**do not** trigger new workflow runs. This is to prevent unintended recursive executions.

For more details, see the [GitHub documentation](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow).

---

## Expected Results

- The GitHub Actions workflow runs on each pull request.
- ReviewCopilot analyzes code changes and posts comments or suggestions directly on the PR.

---

## Example Review Result

Below is a real example of ReviewCopilot's automated review comment on a pull request:

![ReviewCopilot Review Example](./images/review-comments.png)

See the actual review comment on GitHub: [ReviewCopilot PR Review Example](https://github.com/AlexShan2008/review-copilot/pull/25#issuecomment-2922197158)

---

## Troubleshooting

- **No review comments?**  
  Check that your API key is valid and secrets are set correctly.
- **Workflow fails?**  
  Ensure Node.js and dependencies are installed, and the workflow YAML is correct.
- **Need more help?**  
  See the [main documentation](../README.md) or open an issue.

---

## More

- [Main README](../README.md)
- [Configuration Reference](../.review-copilot.yaml)
