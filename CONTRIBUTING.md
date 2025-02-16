# Contributing to ReviewCopilot

First off, thank you for considering contributing to ReviewCopilot! It's people like you that make ReviewCopilot such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [project maintainers].

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

- Fork the repo and create your branch from `main`
- If you've added code that should be tested, add tests
- If you've changed APIs, update the documentation
- Ensure the test suite passes
- Make sure your code lints
- Issue that pull request!

## Development Setup

1. Fork and clone the repo
2. Install dependencies:

```bash
npm install
```

3. Create a branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

4. Make your changes and test them:

```bash
npm test
```

5. Create a `.review-copilot.yaml` configuration file in your project root.

## Project Structure

```
.
├── src/
│   ├── cli/           # CLI command implementations
│   ├── core/          # Core functionality
│   ├── providers/     # AI provider adapters
│   ├── utils/         # Utility functions
│   └── config/        # Configuration handling
├── tests/             # Test files
└── examples/          # Example configurations
```

## Coding Style

- We use ESLint for JavaScript/TypeScript linting
- Follow the existing code style
- Use meaningful variable and function names
- Write comments for complex logic
- Keep functions small and focused
- Use TypeScript for type safety

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

Example:

```
feat(review): add support for custom AI providers

Added the ability to configure custom AI providers through the .review-copilot.yaml file.
This change includes:
- New provider interface
- Configuration validation
- Documentation updates

Closes #123
```

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Test your changes in different environments
- Include integration tests where necessary

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## Documentation

- Update README.md with any new features
- Document new features in code with JSDoc comments
- Keep API documentation up to date
- Add examples for new features

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Publish to npm

## Questions?

Don't hesitate to ask questions by creating an issue or contacting the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
