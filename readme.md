# Flood Warning Backend Service 

📝 **Description**

 This project serves as a robust backend API for fetching and parsing flood warning data from the Bureau of Meteorology (BOM) FTP server. It provides structured JSON responses for various flood-related information and offers a centralized, type-safe logging solution.

✨ **Features**

FTP Data Retrieval: 

Securely connects to specified FTP servers (e.g., BOM) to download XML and text files.

XML Parsing: 

Parses complex AMOC XML structures into easy-to-use TypeScript objects.

Structured Logging: 

Implements a comprehensive Winston-based logging system with multiple transports (console, file), log levels, and structured metadata.

RESTful API Endpoints: 

Exposes data via well-defined RESTful API endpoints using Express.js.

TypeScript Best Practices: 

Developed with strong type safety, modularity, and maintainability in mind.

🚀 **Getting Started**

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites

Before you begin, ensure you have the following installed:

Node.js: v18.x or higher

npm: (Comes with Node.js) or Yarn

Installation

Clone the repository:

```
git clone https://github.com/hkaab/refactored-code-exam-backend.git
cd refactored-code-exam-backend
```
Install dependencies:

```
npm install
# or if you use yarn
yarn install
```
Configuration

This project uses environment variables for configuration. Create a `.env` file in the root directory of the project, based on the `.env.example` file.

.env example:

```
# Application Configuration
PORT=3000
NODE_ENV=development # or 'production', 'test'

# Logging Configuration
LOG_LEVEL=info # debug, info, warn, error, critical, silent
LOG_TO_FILE=true # 'true' or 'false'
LOG_DIR=./logs
LOG_FILE_NAME=application-%DATE%.log # %DATE% is replaced by winston-daily-rotate-file
LOG_MAX_SIZE=20m # e.g., '20m', '100k'
LOG_MAX_FILES=14d # e.g., '14d', '30'

# FTP Configuration (if applicable)
BOM_FTP_HOST=ftp.bom.gov.au
BOM_FTP_DIR=/anon/gen/fwo/
TEMP_DOWNLOADS_DIR = ./downloads
```

Running the Application

Development Mode

For development, you can use nodemon and ts-node for live reloading:

```
npm run dev
# or
yarn dev
```

This will start the server, watch for file changes, and automatically restart.

Production Mode

First, build the TypeScript project, then run the compiled 
JavaScript:

```
npm run build
# or
yarn build

npm start
# or
yarn start
```

The application will be served at http://localhost:3000 (or your configured PORT).

⚙️ **Available Scripts**

In the project directory, you can run:

npm install / yarn install: Installs all necessary dependencies.

npm run build / yarn build: Compiles TypeScript files from src/ to JavaScript in dist/.

npm start / yarn start: Starts the compiled application in production mode.

npm run dev / yarn dev: Starts the application in development mode with live reloading.

npm test / yarn test: Runs the test suite (if applicable).

npm run lint / yarn lint: Runs ESLint to check for code quality issues (if applicable).

npm run format / yarn format: Runs Prettier to format code (if applicable).

npm run clean / yarn clean: Removes compiled dist files and logs directory.

📂 **Project Structure**

```
.
├── dist/                     # Compiled JavaScript output (ignored by Git)
├── logs/                     # Application log files (ignored by Git)
├── node_modules/             # Node.js dependencies (ignored by Git)
├── src/
│   ├── config/               # Application-wide configuration (e.g., config.ts)
│   │   └── config.ts
│   ├── controllers/                  # API routes/controllers (e.g., warningsController.ts)
│   │   └── weatherController.ts
│   ├── services/             # Business logic and external 
|   |   └── bomService.ts
|   ├── parsers (e.g., ftpService.ts)
│   │   └── floodWarningParser.ts
|   ├── types
│   │   └── amocTypes.ts
│   │   └── amocXmlInterface.ts
|   ├── utils                # Utility functions (e.g., logger, helpers)
│   │   └── logger.ts           # Logger implementation
│   │   └── xmlParser.ts
│   │   └── stateMapping.ts
app.ts                        # Main application entry point
server.ts                     # Server Initialization 
├── .env                      # Environment variables (local - ignored by Git)
├── .env.example              # Template for environment variables
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Specifies intentionally untracked files to ignore
├── .prettierrc.js            # Prettier configuration
├── jest.config.js            # Jest test runner configuration
├── package.json              # Project metadata and scripts
├── tsconfig.json             # TypeScript compiler configuration
└── README.md                 # This file
```

🛠 **Technologies Used**

Node.js: Asynchronous event-driven JavaScript runtime.
TypeScript: Superset of JavaScript that compiles to plain JavaScript. Adds static type definitions.

Express.js: Fast, unopinionated, minimalist web framework for Node.js.

Winston: A versatile logging library for Node.js.

Winston Daily Rotate File: A transport for Winston that automatically rotates log files daily.

dotenv: Loads environment variables from a .env file.

basic-ftp: An FTP client for Node.js.

xml2js: An XML to JavaScript object converter.

jest: (Optional) JavaScript testing framework.

ts-node: (Optional) TypeScript execution environment for Node.js.

nodemon: (Optional) Utility that monitors for changes in your source and automatically restarts your server.

🤝 **Contributing**

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

🧪 **Testing**

To run the unit and integration tests:

```
npm test
# or
yarn test
```
(You'll need to set up Jest or another testing framework in jest.config.js and write your test files in a __tests__ or tests directory).


📄 **License**

Distributed under the MIT License. See LICENSE for more information.

✉️ **Contact**

Hossein Kaabi - hkaabi@myyahoo.com

Project Link: https://github.com/hkaab/refactored-code-exam-backend

## References

[BOM ftp url](http://www.bom.gov.au/catalogue/anon-ftp.shtml) 
