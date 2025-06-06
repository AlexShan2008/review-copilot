# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.6](https://github.com/AlexShan2008/review-copilot/compare/v0.4.5...v0.4.6) (2025-06-01)


### Features

* enable deepseek ([75b4e87](https://github.com/AlexShan2008/review-copilot/commit/75b4e87c27b1f7260835d61d3df32d8cc1469212))


### Bug Fixes

* ensure auto-created PR triggers CI and review actions ([2bca505](https://github.com/AlexShan2008/review-copilot/commit/2bca505dcb2af8997c217a57c84602dfe0af1f39))


### Documentation

* update README ([9961ffe](https://github.com/AlexShan2008/review-copilot/commit/9961ffe3f6184f622bde036171c2f9e1c4f32aa6))

### [0.4.5](https://github.com/AlexShan2008/review-copilot/compare/v0.4.4...v0.4.5) (2025-05-31)


### Bug Fixes

* auto create pull request fail ([a3ad3aa](https://github.com/AlexShan2008/review-copilot/commit/a3ad3aa6ed939c798c051f3e0c4e44baaa9997a0))
* auto create pull request fail ([502fbe7](https://github.com/AlexShan2008/review-copilot/commit/502fbe72a7916d8c86da057bc5d73d7225887a91))
* **workflow:** add explicit permissions for auto PR creation ([5e711cc](https://github.com/AlexShan2008/review-copilot/commit/5e711cce6bb19e34dc9d3ccfd20437f8d01f8ec6))


### Refactors

* remove explicit permissions for auto PR creation ([3894d7d](https://github.com/AlexShan2008/review-copilot/commit/3894d7d1296c3a844421354eedce48178e5d22e7))


### Documentation

* add logo ([c44b2bf](https://github.com/AlexShan2008/review-copilot/commit/c44b2bff2c1d7591f28996d0fcb8e9c10b95eb0c))

### [0.4.4](https://github.com/AlexShan2008/review-copilot/compare/v0.4.3...v0.4.4) (2025-05-30)


### Documentation

* update README for better readability ([6001730](https://github.com/AlexShan2008/review-copilot/commit/6001730c0069f1fee52f76dcab3ce561e1217f62))

### [0.4.3](https://github.com/AlexShan2008/review-copilot/compare/v0.4.2...v0.4.3) (2025-05-30)


### Features

* OpenAI update ([0029833](https://github.com/AlexShan2008/review-copilot/commit/0029833c363f4e186b48d87dd315186061b8dd68))

### [0.4.2](https://github.com/AlexShan2008/review-copilot/compare/v0.4.1...v0.4.2) (2025-05-30)


### Features

* add GitHub example ([c379109](https://github.com/AlexShan2008/review-copilot/commit/c379109ace6dfedec52f0353a3a00c0a69c99356))


### CI

* add npm auto-publish workflow on main branch ([b3a387c](https://github.com/AlexShan2008/review-copilot/commit/b3a387ca3b8c50ff53bc9afc81855fdf63dfdc5c))


### Documentation

* add bilingual README (English & Chinese) ([5cff08b](https://github.com/AlexShan2008/review-copilot/commit/5cff08b182b74a46b8364dfc22cdcab7576a402d))
* update README ([2bc3254](https://github.com/AlexShan2008/review-copilot/commit/2bc325423912faae3492a94fbb8df813cd43810c))

### [0.4.1](https://github.com/AlexShan2008/review-copilot/compare/v0.4.0...v0.4.1) (2025-05-30)


### Bug Fixes

* correct incorrect file initialization during init ([724d5d4](https://github.com/AlexShan2008/review-copilot/commit/724d5d469a609067e0d94d5474549808214e7c1c))

## [0.4.0](https://github.com/AlexShan2008/review-copilot/compare/v0.3.0...v0.4.0) (2025-05-29)

## [0.3.0](https://github.com/AlexShan2008/review-copilot/compare/v0.2.6...v0.3.0) (2025-05-29)


### Features

* enable deepseek AI review ([342f931](https://github.com/AlexShan2008/review-copilot/commit/342f931084c1dece78ea05171aafbaf1adc4a0fe))
* enable OpenAI AI review ([9093d1d](https://github.com/AlexShan2008/review-copilot/commit/9093d1d25ec7d8555b2de374958fb8697a0482e5))
* get PR file changes instead of individual commits for review ([1157fce](https://github.com/AlexShan2008/review-copilot/commit/1157fcee89ca89ca4f5994c58b96b6651b10ba29))
* support for reviewing all commits in MR ([463bdf3](https://github.com/AlexShan2008/review-copilot/commit/463bdf323e3d54fdfc20a64b5fbffad4ecc8950b))


### Bug Fixes

* address missing AI_API_KEY_DEEPSEEK issue ([7257ac7](https://github.com/AlexShan2008/review-copilot/commit/7257ac799de702d55b36755c76b39a7b36b9eeb8))
* resolve failing test cases ([8df114c](https://github.com/AlexShan2008/review-copilot/commit/8df114ce6443c08273221a08ecf45291de0ef5fd))


### Refactors

* extract getVcsProvider for easier maintenance and support for GitHub and GitLab ([367b86e](https://github.com/AlexShan2008/review-copilot/commit/367b86ef6a856ca33effde8b7353b32eedf54c4c))
* remove unused code ([5b0ecb5](https://github.com/AlexShan2008/review-copilot/commit/5b0ecb537a6a8ace737881b45b74053d0127937e))
* remove unused code `getChanges` function ([e25bab6](https://github.com/AlexShan2008/review-copilot/commit/e25bab6860d9b08ef4c8793735d7933b28a118aa))
* throw error on GitHub when GITHUB_TOKEN is missing ([e7c267f](https://github.com/AlexShan2008/review-copilot/commit/e7c267faacaad353ec980a4f282ac212f76e81a3))

### [0.2.6](https://github.com/AlexShan2008/review-copilot/compare/v0.2.5...v0.2.6) (2025-03-16)


### Bug Fixes

* upload coverage report to Codecov issue ([2bb84f8](https://github.com/AlexShan2008/review-copilot/commit/2bb84f8c3bfebd12e5311ca06be8fe4d30e58126))


### CI

* add GitHub Actions workflow and README badges ([f31437b](https://github.com/AlexShan2008/review-copilot/commit/f31437b1152f1eca9f7cf97b8f2b0f61adc99249))

### [0.2.5](https://github.com/AlexShan2008/review-copilot/compare/v0.2.4...v0.2.5) (2025-03-10)


### Features

* **review:** enhance code review prompts with comprehensive checks ([c0fc95d](https://github.com/AlexShan2008/review-copilot/commit/c0fc95de86ea8f6f3a35f830576dc4fa6ceb8f03))

### [0.2.4](https://github.com/AlexShan2008/review-copilot/compare/v0.2.3...v0.2.4) (2025-03-06)


### ⚠ BREAKING CHANGES

* The version script now includes sync-version step

### Features

* improve CLI version management ([9e93e2c](https://github.com/AlexShan2008/review-copilot/commit/9e93e2cb1e9d42c32aa5bae0e438ee0a2ff3c8c2))


### Bug Fixes

* sync CLI version with package.json ([41c7ba2](https://github.com/AlexShan2008/review-copilot/commit/41c7ba249d22c762a2a5304d820990b09fe384db))

### [0.2.3](https://github.com/AlexShan2008/review-copilot/compare/v0.2.2...v0.2.3) (2025-03-05)


### Features

* add celebration message for successful code reviews ([55dd548](https://github.com/AlexShan2008/review-copilot/commit/55dd548daac869b52abadef3f3b6944aa81bbb6b))
* **config:** support customize review comment lanugage ([bf65838](https://github.com/AlexShan2008/review-copilot/commit/bf658382ddf35b71114d91758de2c7539d7b8b08))


### Refactors

* centralize and improve AI review system prompts ([77b0936](https://github.com/AlexShan2008/review-copilot/commit/77b09366853393acacb8365d64372d8dd945b3bb))

### [0.2.2](https://github.com/AlexShan2008/review-copilot/compare/v0.2.1...v0.2.2) (2025-03-04)


### Features

* add GitLab AI review for branch name & commit message ([2547cd8](https://github.com/AlexShan2008/review-copilot/commit/2547cd8e6f2197d4d7158f6b6fdb10e92d757204))
* support OpenAI ([8e0fced](https://github.com/AlexShan2008/review-copilot/commit/8e0fcede48759c711b00d57a1b9792aeec3ab844))


### Bug Fixes

* prevent token limit exceeded by large files ([28af1e8](https://github.com/AlexShan2008/review-copilot/commit/28af1e80e1c75f752f261a384aceb5f161fa2284))


### Documentation

* update README.md ([356f828](https://github.com/AlexShan2008/review-copilot/commit/356f8286469479063358fd814bb25b422fec3fc2))


### Tests

* update the test cases based on the new feature ([c618cb1](https://github.com/AlexShan2008/review-copilot/commit/c618cb1f44bd9b7c92251feefbecdf5d7a67163a))

### [0.2.1](https://github.com/AlexShan2008/review-copilot/compare/v0.2.0...v0.2.1) (2025-02-23)


### Documentation

* update README.md ([75f9d24](https://github.com/AlexShan2008/review-copilot/commit/75f9d24a594aab8c22f8cc28df879adadbd689a4))

## 0.2.0 (2025-02-23)


### Features

* add glob pattern support for file filtering ([0caf647](https://github.com/AlexShan2008/review-copilot/commit/0caf647630aa401e14cdd87a7dcd51d8b3b9b57f))
* initialize AI code review tool core functionality ([2430ef8](https://github.com/AlexShan2008/review-copilot/commit/2430ef8a20e55a5f2aa08d12e0e288ae784c1be0))
* only show review results when errors are found ([406acc7](https://github.com/AlexShan2008/review-copilot/commit/406acc7f0a14deeecb8a6d7e80e579f9a45b17c6))
* rename CLI name from reviewcopilot to review-copilot ([c124f92](https://github.com/AlexShan2008/review-copilot/commit/c124f9291bd9ee87fca4b5808b8409aa43fe8e6b))
* rename code review rules from codeReview to codeChanges ([f6f052a](https://github.com/AlexShan2008/review-copilot/commit/f6f052ae8c0d29b94a21257f53fa3e1c225512a3))
* rename ReviewAI to ReviewCopilot ([#2](https://github.com/AlexShan2008/review-copilot/issues/2)) ([65f80c8](https://github.com/AlexShan2008/review-copilot/commit/65f80c867ba71d67b3c2fc691180ac21eb94114b))
* support DeepSeek ([91bc9bc](https://github.com/AlexShan2008/review-copilot/commit/91bc9bc5c10505c62df121831e857c90a972689f))
* support GitHub AI review for branch name & commit message ([158c2a9](https://github.com/AlexShan2008/review-copilot/commit/158c2a9097156e6ddb39343ffac3101c776046e5))


### Bug Fixes

* address AI review comments not displayed issue ([5c3fbeb](https://github.com/AlexShan2008/review-copilot/commit/5c3fbebf3cd9291aa41bc02198284eaf4cf0d286))
* code review unexpected end of JSON input ([b620033](https://github.com/AlexShan2008/review-copilot/commit/b62003332f5926c37cead6fcda0c1e081e4efb0d))
* improve error handling and logging ([0b3893a](https://github.com/AlexShan2008/review-copilot/commit/0b3893a2ddce9df32862756244d44105f82849dd))
* initialize ReviewAI configuration error ([2257b27](https://github.com/AlexShan2008/review-copilot/commit/2257b2773ab76cd5fdfd8dbbe6a72b26d45d5e3e))
* remove redundant git utility functions ([3cb7c7c](https://github.com/AlexShan2008/review-copilot/commit/3cb7c7c7ada34045d8e13f424cfa8f78b07e82aa))
* uncommented two code blocks ([f08f543](https://github.com/AlexShan2008/review-copilot/commit/f08f54398cd2c378594f89a817f636e9d0cf3d8c))


### Tests

* add testing cases ([bcf4730](https://github.com/AlexShan2008/review-copilot/commit/bcf4730802e17c67ec5459268095f48a9b7b3616))


### Refactors

* rename OPENAI_API_KEY and DEEPSEEK_API_KEY to: ([9152fe3](https://github.com/AlexShan2008/review-copilot/commit/9152fe31a63a83f70e06eb96ae1ffedc9a474702))


### CI

* update GitHub Actions to use local build instead of npm ([43498d4](https://github.com/AlexShan2008/review-copilot/commit/43498d453cd87f998100d00d9e0485080c8ae857))


### Build System

* add standard-version for automated versioning ([fbb9ca8](https://github.com/AlexShan2008/review-copilot/commit/fbb9ca83849cf9b9b87796c4cc8769702b520362))
* standardize package manager to pnpm ([8e20f6d](https://github.com/AlexShan2008/review-copilot/commit/8e20f6d8e7d6981024a7c43ae536d582b158fe29))
