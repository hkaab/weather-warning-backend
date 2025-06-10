# Flood Warning Backend Service 
![workflow](https://github.com/hkaab/refactored-code-exam-backend/actions/workflows/cicd.yml/badge.svg)

📝 **Description**

 This project serves as a robust backend API for fetching and parsing flood warning data from the Bureau of Meteorology (BOM) FTP server. It provides structured JSON responses for various flood-related information and offers a centralized, type-safe logging solution.

--------------------

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

--------------------

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

--------------------

Running the Application

**Development Mode**

For development, you can use nodemon and ts-node for live reloading:

```
npm run dev
# or
yarn dev
```

This will start the server, watch for file changes, and automatically restart.

**Production Mode**

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
The application will be served at `http://localhost:3000` (or your configured `PORT`).

--------------------

🐳 **Containerization (Docker)**

1.Create a Dockerfile in the root of your project:

```
# Use an official lightweight Node.js image.
FROM node:18-alpine

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the source code.
COPY . .

# Build the project (assuming tsc is configured to output to the 'dist' folder)
RUN npm run build

# Expose the port (make sure this matches your config; here we assume 3000)
EXPOSE 3000

# Start the application.
CMD ["npm", "start"]
```

2. **Build the Docker image:**

 `docker build -t flood-warning-api:latest .`

3. **Running the Docker Container**

 `docker run -p 3000:3000 --name flood-warning-api -d flood-warning-api:latest`

4. **Verify the container is running:**
  
  `docker ps`

5. **Access your application:**

    The application will now be accessible via http://localhost:3000 on your host machine.

**Stopping and Removing the Container**

 * Stop the container:

   `docker stop flood-warning-api`
 
 * Remove the container (after stopping):
   
   `docker rm flood-warning-api`

 * Remove the Docker image:
   
   `docker rmi flood-warning-api:latest`

--------------------

⚙️ **Available Scripts**

In the project directory, you can run:

`npm install` / `yarn install`: Installs all necessary dependencies.

`npm run build` / `yarn build`: Compiles TypeScript files from `src/` to JavaScript in `dist/`.

`npm start` / `yarn start`: Starts the compiled application in production mode.

`npm run dev` / `yarn dev`: Starts the application in development mode with live reloading.

`npm run test:unit` / `yarn test:unit`: Runs the unit test suite (if applicable).

`npm run test:integration` / `yarn test:integration`: Runs the unit test suite (if applicable).

`npm run lint` / `yarn lint`: Runs ESLint to check for code quality issues (if applicable).

`npm run format` / `yarn format`: Runs Prettier to format code (if applicable).

`npm run clean` / `yarn clean`: Removes compiled `dist` files and `logs` directory.

--------------------

🔌 **API Endpoints**

Here are the primary endpoints available in this API:
* GET `/` : Get warnings by state  ex: `http://localhost:3000/?state=VIC`

* GET `/warning/:id` : Get sepecifc warnig by id ex: `http://localhost:3000/warning/IDQ10090`

* GET `/health` : Health check endpoint, returns OK if the service is running. ex: `http://localhost:3000/health`

--------------------

⚙️ **Continuous Integration & Continuous Deployment (CI/CD)**

This project uses **GitHub Actions** for automated testing (Continuous Integration) and deployment (Continuous Deployment) to **AWS Elastic Beanstalk.**

**Overview**
When code is pushed to the main branch of this repository, the following CI/CD pipeline is triggered:

* Checkout Code 📦: The latest code from the main branch is pulled onto the GitHub Actions runner.

* Setup Node.js 🛠️: The specified Node.js version is configured.

* Install Dependencies ⬇️: npm install is run to install project dependencies.

* Run Tests ✅: (Optional but Recommended) Any configured npm test scripts are executed. If tests fail, the deployment is halted.

* Generate Deployment Package 💾: A .zip file of the application code (excluding node_modules and .git files) is created, ready for Elastic Beanstalk.

* Deploy to Elastic Beanstalk 🚀: The .zip package is uploaded to AWS Elastic Beanstalk, which then updates the running application in the specified environment.

**AWS Elastic Beanstalk Setup**
Before the GitHub Action can deploy, you need to set up your AWS environment:

* **Create an Elastic Beanstalk Application 🏗️:**

  * Go to the AWS Elastic Beanstalk console.

  * Create a new application (e.g., my-nodejs-api).

* **Create an Elastic Beanstalk Environment 🌐:**
  
  * Within your application, create a new environment (e.g., `flood-warning-api`).

  * Select the **Node.js platform**.

  * Configure instance types, scaling, and other settings as needed.

  * Ensure your Node.js application listens on `process.env.PORT`.

* **Create an IAM User/Role for CI/CD 🔑:**
  
  * Go to the AWS IAM console.

  * Create an IAM user or role with programmatic access.

  * Attach policies that grant necessary permissions for Elastic Beanstalk deployment. A common starting point is `AWSElasticBeanstalkFullAccess` and `AmazonS3FullAccess` (for the S3 bucket Beanstalk uses). For production, create a more granular custom policy with only the required actions.

  * **Securely store the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for this user.** 
  
    You will use these in GitHub Secrets.
  
**GitHub Actions Configuration**
  The CI/CD pipeline is defined in `.github/workflows/cicd.yml`.

  * **Create GitHub Repository Secrets 🤫:**
    To securely pass your AWS credentials and Beanstalk environment details to GitHub Actions, set up the following repository secrets:

     * Go to your GitHub repository: `Settings` > `Secrets and variables` > `Actions` > `New repository secret`.

     * Add the following:
        * AWS_ACCESS_KEY_ID: Your AWS IAM user's access key ID.
        * AWS_SECRET_ACCESS_KEY: Your AWS IAM user's secret access key.
        * AWS_REGION: The AWS region where your Elastic Beanstalk environment is (e.g., us-east-1, ap-southeast-2).
        * EB_APPLICATION_NAME: The name of your Elastic Beanstalk application (e.g., my-nodejs-api).
        * EB_ENVIRONMENT_NAME: The name of your Elastic Beanstalk environment (e.g., my-nodejs-api-dev).

 * Procfile 📄:

   Ensure you have a Procfile in the root of your project, which tells Elastic Beanstalk how to start your Node.js application.

```
web: npm start

```
 * `cicd.yml` **Workflow File** 📝:
   
   The workflow file is located at `.github/workflows/deploy.yml.`

```

name: Flood Warning API to AWS Elastic Beanstalk

on:
  push:
    branches:
      - main # Trigger on pushes to the 'main' branch
  workflow_dispatch: # Allows manual triggering from the GitHub Actions tab

jobs:
  build-test-and-deploy:
    runs-on: ubuntu-latest 

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4 

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '24' 

    - name: Install dependencies
      run: npm install

    - name: Run tests 
      run: npm test 

    - name: Build
      run: npm run build 

    - name: Generate deployment package
      run: |
        # Create a zip file containing your application code
        # Beanstalk expects a specific structure.
        # Ensure all necessary files (like package.json, Procfile, etc.) are included.
        zip -r deploy.zip . 

    - name: Deploy to AWS Elastic Beanstalk
      uses: einaregilsson/beanstalk-deploy@v22 
      with:
        aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        application_name: ${{ secrets.EB_APPLICATION_NAME }}
        environment_name: ${{ secrets.EB_ENVIRONMENT_NAME }}
        version_label: github-action-${{ github.sha }} 
        region: ${{ secrets.AWS_REGION }}
        deployment_package: deploy.zip 
        wait_for_deployment: true
```
   After setting up your AWS environment, adding the secrets, and pushing the `cicd.yml` file to your `main` branch, every subsequent push to `main` will trigger a deployment to your Elastic Beanstalk environment. You can monitor the progress in the "Actions" tab of your GitHub repository.


--------------------

## 📂 **Project Structure**

```
.
├── dist/                     # Compiled JavaScript output (ignored by Git)
├── downloads/                # Temp Download folder (ignored by Git)
├── node_modules/             # Node.js dependencies (ignored by Git)
├── src/
│   ├── config/               # Application-wide configuration 
│   │   └── config.ts
│   ├── controllers/          # API routes/controllers 
│   │   └── weatherController.ts
│   ├── services/             # Business logic and external 
|   |   └── warningsService.ts
|   ├── parsers (e.g., ftpService.ts)
│   │   └── floodWarningParser.ts
|   ├── types
│   │   └── amocTypes.ts
│   │   └── amocXmlInterface.ts
|   ├── utils                # Utility functions 
│   │   └── logger.ts           
│   │   └── xmlParser.ts
│   │   └── stateMapping.ts
|   app.ts                    # Main application entry point
|   server.ts                 # Server Initialization 
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

-------------------- 

🛠 **Technologies Used**

Node.js: Asynchronous event-driven JavaScript runtime.
TypeScript: Superset of JavaScript that compiles to plain JavaScript. Adds static type definitions.

Express.js: Fast, unopinionated, minimalist web framework for Node.js.

Winston: A versatile logging library for Node.js.

Winston Daily Rotate File: A transport for Winston that automatically rotates log files daily.

dotenv: Loads environment variables from a `.env` file.

basic-ftp: An FTP client for Node.js.

xml2js: An XML to JavaScript object converter.

jest: (Optional) JavaScript testing framework.

ts-node: (Optional) TypeScript execution environment for Node.js.

nodemon: (Optional) Utility that monitors for changes in your source and automatically restarts your server.

--------------------
🤝 **Contributing**

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (`git checkout -b feature/AmazingFeature`)

Commit your Changes (`git commit -m 'Add some AmazingFeature'`)

Push to the Branch (`git push origin feature/AmazingFeature`)

Open a Pull Request

--------------------

🧪 **Testing**

To run the unit and integration tests:

```
npm test
# or
yarn test
```
(You'll need to set up Jest or another testing framework in `jest.config.js` and write your test files in a `__tests__` or `tests` directory).

--------------------

📄 **License**

Distributed under the MIT License. See `LICENSE` for more information.

--------------------

✉️ **Contact**

Hossein Kaabi - hkaabi@myyahoo.com

Project Link: `https://github.com/hkaab/refactored-code-exam-backend`

Test Url : `http://flood-warning-api-test.us-east-1.elasticbeanstalk.com/`


## References

[BOM ftp url](http://www.bom.gov.au/catalogue/anon-ftp.shtml) 
