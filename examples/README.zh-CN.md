中文 | [English](README.md)

# 示例

## GitHub

### GitHub Actions

在项目根目录下创建 `.github` 目录，并在其下新建 `workflows` 目录，然后在 `workflows` 目录下创建 `review.yml` 文件。详见：[examples/github/.github/workflows/review.yml](.github/workflows/review.yml)

### 配置 GitHub Actions 密钥和变量

在需要代码审查的 GitHub 项目中，依次点击 `Settings` -> `Secrets and variables` -> `Actions`，点击 `New repository secret`，添加 `AI_API_KEY_OPENAI` 和 `AI_API_KEY_DEEPSEEK` 两个密钥。

![image](./images/github-actions-secrets.png)

### 在项目中安装 ReviewCopilot

```bash
pnpm add -D review-copilot
```

### 验证 ReviewCopilot 是否安装成功

```bash
npx review-copilot --version
0.4.0
```

### 初始化 ReviewCopilot

```bash
npx review-copilot init
```

### 运行 ReviewCopilot

```bash
npx review-copilot review
```

### 配置 review copilot 工作流

在项目根目录下创建 `.github/workflows/review.yml` 文件。示例：

```yaml
# 工作流配置详情请参考主文档
```
