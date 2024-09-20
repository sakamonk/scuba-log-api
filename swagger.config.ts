import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4500');
const HOST = process.env.HOST || 'http://localhost';
const SERVER_URL = `${HOST}:${PORT}`;

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scuba Divelog API',
      version: '1.0.0',
      description: 'A simple API description for a Node.js application using Express and TypeScript',
    },
    servers: [
      {
        url: SERVER_URL,
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'], // Path to the route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Function to set up Swagger
export const setupSwaggerDocs = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger docs available at ds ${SERVER_URL}/api-docs`);
};
