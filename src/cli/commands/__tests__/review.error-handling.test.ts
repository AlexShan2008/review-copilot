import { reviewCommand } from '../review';
import { setupMocks, cleanupMocks, MockOra } from './review.utils';
import { ProviderFactory } from '../../../providers/provider-factory';
import ora from 'ora';

jest.useFakeTimers();

// Mock other dependencies
jest.mock('../../../config/config-manager');
jest.mock('../../../utils/vcs-factory');
jest.mock('../../../providers/provider-factory');
jest.mock('../../../providers/openai-provider');
jest.mock('../../../services/git-platform-factory');

describe('reviewCommand - error handling', () => {
  const mockSpinner = (ora as unknown as MockOra).mockSpinnerInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset spinner mock state
    Object.values(mockSpinner).forEach((mock) => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        (mock as jest.Mock).mockClear();
      }
    });
  });

  afterEach(async () => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    mockSpinner._cleanup();
    mockSpinner.stop();
    jest.resetModules();
    cleanupMocks();
  });

  it('should handle provider creation errors', async () => {
    setupMocks();
    (ProviderFactory.createProvider as jest.Mock).mockImplementation(() => {
      throw new Error('Provider creation failed');
    });

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(false);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });

  it('should handle OpenAI errors', async () => {
    const { mockProvider } = setupMocks();
    const openAIError = new Error(
      'API Error Details: {"error":{"type":"invalid_request_error"}}',
    );
    mockProvider.review.mockRejectedValue(openAIError);

    const result = await reviewCommand({ config: 'test-config.yaml' });

    expect(result).toBe(true);
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});
