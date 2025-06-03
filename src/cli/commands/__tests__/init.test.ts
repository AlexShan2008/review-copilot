jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
    stop: jest.fn(),
    text: '',
  };
  return () => spinner;
});

import { initCommand } from '../init';
import fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';

const OLD_ENV = process.env;

describe('initCommand', () => {
  let existsSyncSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    existsSyncSpy = jest.spyOn(fs, 'existsSync');
    jest.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
    jest
      .spyOn(path, 'join')
      .mockImplementation((...args: string[]) => args.join('/'));
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it('should use existing config file if present', async () => {
    existsSyncSpy.mockReturnValue(true);
    await initCommand();
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });

  it('should create new config file if not present', async () => {
    existsSyncSpy.mockReturnValue(false);
    await initCommand();
    expect(fsPromises.writeFile).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should handle errors and exit process', async () => {
    existsSyncSpy.mockReturnValue(false);
    (fsPromises.writeFile as jest.Mock).mockRejectedValue(new Error('fail'));
    process.env.NODE_ENV = 'test';

    await expect(async () => {
      try {
        await initCommand();
      } catch (error: any) {
        expect(error.message).toBe('process.exit');
        throw error;
      }
    }).rejects.toThrow('process.exit');
  });
});
