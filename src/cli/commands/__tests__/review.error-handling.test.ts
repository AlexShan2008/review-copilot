import { reviewCommand } from '../review';
import { setupMocks, mockConfig, cleanupMocks } from './review.utils';
import { ProviderFactory } from '../../../providers/provider-factory';
import ora from 'ora';

// Define the type for our mock spinner instance
interface MockSpinner {
  start: jest.Mock;
  stop: jest.Mock;
  succeed: jest.Mock;
  fail: jest.Mock;
  info: jest.Mock;
  text: string;
  _cleanup: jest.Mock;
}

// Define the type for our mock ora function
interface MockOra extends jest.Mock {
  mockSpinnerInstance: MockSpinner;
}

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
    mockSpinner.stop();
    cleanupMocks();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterAll(() => {
    jest.restoreAllMocks();
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

  it('should handle VCS provider errors', async () => {
    const { mockVcsProvider } = setupMocks();
    mockVcsProvider.getPullRequestFiles.mockRejectedValue(
      new Error('Git error'),
    );

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
