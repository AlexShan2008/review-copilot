import { ConfigManager } from '../config/config-manager';
import { readFile } from 'fs/promises';
import { ProviderFactoryConfig } from '../providers/provider.types';

jest.mock('fs/promises');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockConfig: ProviderFactoryConfig = {
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        baseURL: 'https://api.openai.com/v1',
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

  beforeEach(async () => {
    jest.resetAllMocks();
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));
    // Reset the singleton instance before each test
    (ConfigManager as any).instance = undefined;
    configManager = await ConfigManager.getInstance();
  });

  it('should be a singleton', async () => {
    const instance1 = await ConfigManager.getInstance();
    const instance2 = await ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load and validate config', async () => {
    const config = configManager.getConfig();
    expect(config).toBeDefined();
    const openaiConfig = config.providers.openai;
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig?.apiKey).toBe('test-key');
  });

  it('should replace environment variables', async () => {
    process.env.TEST_API_KEY = 'env-key';
    const configWithEnv = {
      ...mockConfig,
      providers: {
        ...mockConfig.providers,
        openai: {
          ...mockConfig.providers.openai,
          apiKey: '${TEST_API_KEY}',
        },
      },
    };
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(configWithEnv));
    // Reset the singleton instance
    (ConfigManager as any).instance = undefined;
    const newConfigManager = await ConfigManager.getInstance();
    const config = newConfigManager.getConfig();
    const openaiConfig = config.providers.openai;
    expect(openaiConfig).toBeDefined();
    expect(openaiConfig?.apiKey).toBe('env-key');
  });

  it('should throw error for invalid config', async () => {
    const invalidConfig = {
      ...mockConfig,
      providers: undefined, // Remove required providers field
    };
    (readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));
    // Reset the singleton instance
    (ConfigManager as any).instance = undefined;
    await expect(ConfigManager.getInstance()).rejects.toThrow(
      'Failed to load config',
    );
  });

  it('should throw error when getting config before loading', async () => {
    // Create a new instance without loading config
    const newInstance = new (ConfigManager as any)();
    expect(() => newInstance.getConfig()).toThrow('Config not loaded');
  });
});
