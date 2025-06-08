let globalCleanupTasks = [];

global.addCleanupTask = (task) => {
  globalCleanupTasks.push(task);
};

beforeAll(() => {
  if (global.gc) {
    global.gc();
  }
});

afterEach(() => {
  jest.clearAllTimers();

  jest.clearAllMocks();

  globalCleanupTasks.forEach((task) => {
    try {
      task();
    } catch (error) {
      console.warn('Cleanup task failed:', error);
    }
  });

  if (global.gc) {
    global.gc();
  }
});

afterAll(() => {
  globalCleanupTasks = [];

  jest.restoreAllMocks();

  if (global.gc) {
    global.gc();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

jest.setTimeout(10000);

// Mock console methods to prevent memory leaks from excessive logging
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
