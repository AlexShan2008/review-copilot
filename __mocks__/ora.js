// Create a singleton instance for the spinner
const mockSpinnerInstance = {
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  text: '',
  _cleanup: jest.fn(),
};

// Export a function that always returns the same instance
const mockOra = jest.fn(() => mockSpinnerInstance);

// Export both the mock function and the instance for testing
module.exports = mockOra;
module.exports.mockSpinnerInstance = mockSpinnerInstance;
