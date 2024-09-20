import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const logFilePath = path.join(__dirname, '..', '..', 'logs', 'console.test.log');

function setupTestEnvironment() {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation((message) => {
      // Mock console.log for writing to a file
      fs.appendFileSync(logFilePath, `${message}\n`);
    });

    // initialize the mock request and response objects
    jsonMock = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    } as Partial<Response>;

    next = jest.fn();

    req = {
      body: {},
      params: {},
      query: {},
    } as Partial<Request>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
  });

  return () => ({ req, res, next, jsonMock });
}

export { setupTestEnvironment };
