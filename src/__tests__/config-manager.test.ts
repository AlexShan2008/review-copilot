import { ConfigManager } from '../config/config-manager';
import { readFile } from 'fs/promises';
import { Config } from '../types';

jest.mock('fs/promises');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockConfig = {
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4',
        baseURL: 'https://api.openai.com/v1',
      },
      deepseek: {
        enabled: false,
        apiKey: 'test-key-2',
        model: 'deepseek-chat',
        baseURL: 'https://api.deepseek.com/v1',
      },
    },
    triggers: [{ on: 'pull_request' }, { on: 'merge_request' }],
    rules: {
      commitMessage: {
        enabled: true,
        pattern: '^(feat|fix)',
        prompt: 'Review commit message',
      },
      branchName: {
        enabled: true,
        pattern: '^(feature|bugfix)',
        prompt: 'Review branch name',
      },
      codeChanges: {
        enabled: true,
        filePatterns: ['**/*.ts'],
        prompt: 'Review code changes',
      },
    },
    customReviewPoints: [
      {
        name: 'Security',
        prompt: 'Check security',
      },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    configManager = ConfigManager.getInstance();
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));
  });

  it('should be a singleton', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load and validate config', async () => {
    const config = await configManager.loadConfig();
    expect(config).toBeDefined();
    expect(config.providers.openai.enabled).toBe(true);
    expect(config.providers.deepseek.enabled).toBe(false);
  });

  it('should replace environment variables', async () => {
    process.env.TEST_API_KEY = 'env-key';
    const configWithEnv = {
      ...mockConfig,
      providers: {
        openai: {
          ...mockConfig.providers.openai,
          apiKey: '${TEST_API_KEY}',
        },
      },
    };
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(configWithEnv));

    const config = await configManager.loadConfig();
    expect(config.providers.openai.apiKey).toBe('env-key');
  });

  it('should throw error for invalid config', async () => {
    const invalidConfig = {
      ...mockConfig,
      providers: undefined,
    };
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

    await expect(configManager.loadConfig()).rejects.toThrow();
  });

  it('should throw error when getting config before loading', () => {
    const newInstance = new (ConfigManager as any)();
    expect(() => newInstance.getConfig()).toThrow('Config not loaded');
  });
});
