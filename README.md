# Scuba Log API

As a side note, I have developed this application to learn more about the modern back-end technologies of **Node.js**, **Typescript** and **MongoDB**.

---

The **Scuba Log API** is a backend API service designed for managing scuba diving logs. It supports user authentication, role-based access control, and CRUD operations on dive logs and users. Built using **Node.js**, **Express**, **TypeScript**, and **MongoDB**, this project implements JWT-based authentication, Express middleware, and Swagger documentation.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [License](#license)

## Features
- **User Authentication**: Supports JWT-based authentication.
- **Role-based Access Control**: Basic users, Admins and Super Admins have different access permissions.
- **Dive Log Management**: Create, update, and delete scuba dive logs.
- **User Management**: Manage users and assign roles.
- **Rate Limiting**: Prevents brute-force login attempts.
- **API Documentation**: Integrated with Swagger for easy API reference.

## Project Structure
The project follows a typical **Node.js** and **TypeScript** architecture:

```
├── src
│   ├── controllers    # Express controllers for handling requests
│   ├── docs           # Swagger documentation definitions
│   ├── helpers        # Helper functions (rate limiting, role validation, etc.)
│   ├── middleware     # Middleware for authentication, authorization, etc.
│   ├── models         # Mongoose schemas and models
│   ├── routes         # Express route definitions
│   ├── services       # Service layer (if any) for business logic
│   ├── config         # Configuration (e.g., database, JWT settings)
│   ├── app.ts         # Application entry point
│   └── server.ts      # Server setup and initialization
├── tests              # Test files for controllers, routes, etc.
├── .env               # Environment variable file (not included in version control)
├── jest.config.js     # Jest testing framework configuration
├── swagger.config.ts  # Swagger configuration for API documentation
├── package.json       # Node.js dependencies and scripts
└── tsconfig.json      # TypeScript configuration

```

## Installation
To run this project locally, follow these steps:

### Prerequisites
- **Node.js** (v14+)
- **MongoDB** (Make sure MongoDB is running locally or use a cloud MongoDB service)

### Steps
1. Clone the repository:

```
  git clone https://github.com/sakamonk/scuba-log-api.git
  cd scuba-log-api
```

2. Install dependencies:

```
  npm install
```

3. Set up environment variables by creating a `.env` file in the root directory. Use `.env.example` as a reference:

```
cp .env.example .env
```

4. Start the server:

```
npm run
```

## Environment Variables

The project requires the following environment variables to be set in the `.env` file:

- `HOST`: Host for the server.
- `PORT`: Port for the server to listen on.
- `DB_HOST`: Host for the MongoDB connection.
- `DB_PORT`: Port for the MongoDB connection.
- `DB_NAME`: MongoDB Database name.
- `DB_USER`: Username for the MongoDB connection.
- `DB_PASS`: Password for the MongoDB connection.
- `SECRET_SALT`: Secret salt used for hashing passwords.
- `JWT_SECRET`: Secret key for signing JWT tokens.
- `JWT_EXPIRATION`: Expiration time for JWT tokens (e.g., 1h).


Example `.env` file:

```
HOST=http://localhost
PORT=3500

DB_HOST=localhost
DB_PORT=27017
DB_NAME=ScubaDiveLog
DB_USER=[Create your own user for the database in MongoDB]
DB_PASS=[Password you created for DB_USER]

SECRET_SALT=[Create your own salt for password hashing, and keep it secret!]
JWT_SECRET=[Create your own secret key for JWT tokens, and keep it secret!]
JWT_EXPIRATION=1h
```

## Available scripts

### Linting

Check for linting errors:

``
npm run lint
``

### Running the server in production mode:

``
npm start
``

### Testing

The project uses **Jest** and **Supertest** for unit tests. To run the tests:

``
npm test
``

To re-run tests automatically:

``
npm run test:watch
``


To generate test coverage reports:

``
npm run test:cov
``

## API Documentation

**Swagger** is used to document the API. After running the server, you can view the documentation at <http://localhost:3500/api-docs>.

## License

This project is licensed under MIT License.
