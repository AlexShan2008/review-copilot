# Examples

## GitHub

### GitHub Actions

项目根目录下创建 `.github` 目录，并在目录下创建 `workflows` 目录，在 `workflows` 目录下创建 `review.yml` 文件，详见：[examples/github/.github/workflows/review.yml](.github/workflows/review.yml)

### 配置 GitHub Actions secrets and variables

在 GitHub 需要进行 code review 的项目中，点击 `Settings` -> `Secrets and variables` -> `Actions`，点击 `New repository secret`，创建 `AI_API_KEY_OPENAI` 和 `AI_API_KEY_DEEPSEEK` 两个 secret。

![image](./images/github-actions-secrets.png)

### 项目中安装 ReviewCopilot

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

````

### 配置 review copilot

项目根目录下创建 `.github/workflows/review.yml` 文件，内容如下：

```yaml

````
