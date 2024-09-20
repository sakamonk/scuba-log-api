import request, { SuperTest, Test } from 'supertest';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Express } from 'express';
import { Server } from 'http';

dotenv.config();

let server: Server | null = null;
let logSpy: jest.SpyInstance;
const logFilePath = path.join(__dirname, '..', '..', 'logs', 'console.test.log');
const serverPort = 3333;

function setupTestEnvironment(app: Express): SuperTest<Test> {
  beforeAll((done) => {
    if (!server) {
      server = app.listen(serverPort, done);
    }

    logSpy = jest.spyOn(console, 'log').mockImplementation((message: string) => {
      // Mock console.log for writing to a file
      fs.appendFileSync(logFilePath, `${message}\n`);
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
      server = null;
    }

    logSpy.mockRestore(); // Restore console.log after tests
  });

  return request(app); // Return the supertest request object to be used in tests
}

export default setupTestEnvironment;
