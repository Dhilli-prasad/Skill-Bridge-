# SkillBridge

### Learn, Discover, Code and Collaborate

An online development platform, allowing users to learn, discover other developers, practice coding and collaborate on projects.

This is aimed at helping students and developers improve their skills, connect with others and get hands-on experience.

The project includes a React and Typescript frontend and an AWS based serverless backend providing authentication and collaboration.

**Live link:** https://main.d3j0bg739p5k2s.amplifyapp.com

---

## Project Overview

Whilst it is always important to learn development skills, getting hands-on experience can sometimes be hard. This could be due to finding collaborators and opportunities, and keeping track of how much you have contributed to your projects.

SkillBridge helps to provide everything in one place.

Users can browse the various sections of the site, practice coding, discover developers, exchange skills and collaborate on projects.

Overall the goal is to provide a link between learning and actually building projects.

## Features

The application has several modules:

| Module | Overview |
|---|---|
| Dashboard | Gives an overview of the platform and developers activity |
| Developer Community | Discover the developer community |
| Learning Hub | Browse learning related content |
| Code Arena | Practice coding |
| Learning Circles | Collaborate whilst learning |
| Skill Exchange | Discover opportunities to exchange skills |
| Project Collaboration | Create projects and collaborate |
| Developer Passport | View developer profile and contributions |

The features and data available will depend on what Mode the application is in.

## Project Collaboration

Project Collaboration is one of the main sections of the application.

The process should be:

1. User creates a new project.
2. Other developers see the project.
3. Developers interested in the project ask to join.
4. Project owner approves and manages requests.
5. Developers approved join the project.
6. Information on the project and contributions can be viewed via the Developer Passport.

AWS provides the infrastructure for authenticated collaboration and storing data.

## Tech Stack

### Frontend

- React
- Typescript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

### Backend

- Python 3.12
- AWS Lambda
- AWS Serverless Application Model (SAM)
- Amazon API Gateway
- Amazon DynamoDB

### Authentication & Hosting

- Amazon Cognito
- AWS Amplify
- Amazon CloudWatch

Amazon S3 is used for storing profile images.

## AWS Infrastructure

The backend is built using a serverless architecture.

```text
React + TypeScript
|
v
Amazon Cognito
Authentication
|
v
Amazon API Gateway
JWT Authorizer
|
v
AWS Lambda
Python Backend
|
v
Amazon DynamoDB
```

AWS Amplify hosts the frontend. Amazon Cognito handles authentication. Amazon API Gateway provides the HTTP API and validates JWTs. AWS Lambda runs the backend logic. Amazon DynamoDB stores data relating to the application and collaboration. Amazon CloudWatch provides logging and monitoring of the backend. Amazon S3 provides private storage for profile images.

Only verified claims from Cognito are used to identify authenticated users. All authorisation is managed on the server side.

## Modes

There are two modes for the frontend.

### Local Demo Mode

This is the default mode and uses mock data. It also stores data within the browsers localstorage.

This should not be confused with the real backend with authentication.

### AWS API Mode

The application can be connected to the deployed backend. Amazon Cognito and API Gateway are used.

The Project Collaboration and Developer Passport modules can be configured to run in API mode.

All protected API calls will use Cognito access tokens. If there is a problem with the API, this will be shown to the user.

## Running Locally

### Requirements

- Node.js
- npm
- Git

### 1. Clone the Repo

```bash
git clone YOUR_REPOSITORY_URL
cd SkillBridge
```

Ensure you replace YOUR_REPOSITORY_URL with your actual GitHub repo.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

This will run the application in local demo mode.

## Backend

The backend source code and AWS infrastructure can be found in the backend/.

### Requirements

- Python 3.12
- AWS CLI
- AWS SAM CLI

### Install Dev Dependencies

Navigate to the root of the repo:

```bash
cd backend
python -m venv .venv
```

If using Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Then:

```bash
pip install -r requirements-dev.txt
```

### Run Tests

```bash
pytest -q
```

### Validate SAM Template

```bash
sam validate --template-file template.yaml --lint
```

### Build

```bash
sam build --template-file template.yaml
```

This will locally test, validate and build the application. Nothing will be deployed.

## Frontend Configuration

To run in AWS API mode, you need to copy the .env.example file to .env.local. Within the file enter all the public details for Cognito and API.

Variables available:

- VITE_API_BASE_URL
- VITE_COGNITO_REGION
- VITE_COGNITO_USER_POOL_ID
- VITE_COGNITO_USER_POOL_CLIENT_ID
- VITE_PROJECT_COLLABORATION_MODE
- VITE_DEVELOPER_PASSPORT_MODE

Do not include any AWS secrets, private keys, client secrets or access tokens in the environment variables.

## Testing

Frontend:

```bash
npm run test
npm run lint
npm run build
```

Backend:

```bash
cd backend
pytest -q
```

The unit tests on the backend use mocks for AWS so no AWS resources are required to be deployed.

Local tests & AWS integration tests should be considered separately.

## Repo Structure

```text
SkillBridge/
├── src/
│   ├── features/
│   ├── services/
│   └── ...
├── backend/
│   ├── src/
│   ├── tests/
│   ├── config/
│   └── template.yaml
├── docs/
├── public/
├── .env.example
├── package.json
└── README.md
```

## Security

Authentication is handled via Amazon Cognito. Protected API routes are authorised using JWT. Verified claims are used to identify who the user is. Authorisation for projects are handled by the backend. Do not commit any secrets or AWS credentials. Profile images are meant to be kept private.

## Project Status

This is an active project. The frontend contains the main functionalities of the platform and the backend provides the serverless infrastructure for authenticated collaboration and keeping track of contributions.

Some parts of the application use local demo data however some modules can be connected to the AWS backend. Consider what Mode the application is in.

## Future Development

Future development could include:

- Better developer matching.
- More project task and milestones.
- More detailed contribution tracking.
- More learning and collaboration features.
- More detailed developer profiles.

---

## Vision

SkillBridge aims to make it easier for developers to progress from learning individual skills to working collaboratively on projects.

**Learn Together. Build Together. Grow Together.**
