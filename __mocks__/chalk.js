const chalkMock = jest.mock('chalk', () => ({
  blue: jest.fn((str) => String(str)),
  green: jest.fn((str) => String(str)),
  yellow: jest.fn((str) => String(str)),
  cyan: jest.fn((str) => String(str)),
  white: jest.fn((str) => String(str)),
  gray: jest.fn((str) => String(str)),
  red: jest.fn((str) => String(str)),
  bold: jest.fn((str) => String(str)),
}));

module.exports = chalkMock;
