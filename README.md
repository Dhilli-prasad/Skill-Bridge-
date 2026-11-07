# SkillBridge

**From skills to shipped projects.**

SkillBridge is a React and TypeScript developer ecosystem for discovery, learning, coding practice, project collaboration, and contribution history. The repository includes a local-first frontend experience and a modular AWS SAM backend foundation for authenticated project collaboration and Developer Passport records.

## Repository layout

- `src/` — Vite React frontend, feature pages, reusable components, mock data, localStorage services, Cognito integration, and API client.
- `src/features/` — Dashboard, Community, Learning Hub, Code Arena, Learning Circles, Skill Exchange, Project Collaboration, and Developer Passport.
- `src/services/` — local persistence services and the isolated authenticated API client.
- `backend/src/` — Python Lambda application, project services, DynamoDB repository, validation, and Cognito-claim handling.
- `backend/tests/` — mocked backend unit tests that do not require AWS credentials or deployed resources.
- `backend/template.yaml` — AWS SAM infrastructure definition.
- `backend/config/` — non-secret environment documentation.
- `docs/` — supporting project documentation.

## Local frontend setup

Requirements: Node.js/npm.

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

The default frontend mode is local demo mode. It uses existing mock data and localStorage services without pretending that a real user is authenticated. Do not add secrets to Vite environment files.

## Cognito and AWS API mode

The frontend uses AWS Amplify Auth v6 with a Cognito User Pool and public app client. Copy `.env.example` to a local `.env` file only when a reviewed backend environment is available, then set:

- `VITE_API_BASE_URL` — deployed API Gateway stage URL.
- `VITE_COGNITO_REGION` — deployed Cognito region.
- `VITE_COGNITO_USER_POOL_ID` — Cognito User Pool output.
- `VITE_COGNITO_USER_POOL_CLIENT_ID` — public Cognito app-client output.
- `VITE_PROJECT_COLLABORATION_MODE=api` and/or `VITE_DEVELOPER_PASSPORT_MODE=api` — explicit module opt-in.

The app uses Cognito SRP sign-in and SDK-managed refresh. Access tokens are attached to protected API requests and stored only in session-scoped browser storage. API failures are shown to the user; they do not silently fall back to local demo data.

## Backend prerequisites

Requirements: Python 3.12, AWS SAM CLI, and AWS CLI. AWS credentials are required only for deployment or live AWS checks and must be provided outside the repository through an approved profile or environment mechanism.

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest -q
sam validate --template-file template.yaml --lint
sam build --template-file template.yaml
```

The Lambda `CodeUri` is `backend/src/`; its runtime dependency manifest is `backend/src/requirements.txt`. Development-only test dependencies are in `backend/requirements-dev.txt`.

## AWS architecture

The SAM template defines one environment-scoped Cognito User Pool and public web client, API Gateway HTTP API with a Cognito JWT authorizer, one Python 3.12 Lambda, one on-demand DynamoDB single table with `PK`/`SK` and `GSI1`, and a retained CloudWatch log group. S3 and Step Functions are not provisioned. The backend uses verified Cognito claims for identity and server-side project authorization; client-supplied user IDs and roles are not trusted.

No AWS resources are deployed by local setup or verification commands. Review `backend/DEPLOYMENT_READINESS.md` and `backend/README.md` before any deployment approval.

## Verification commands

Frontend:

```powershell
npm run test
npm run lint
npm run build
```

Backend and infrastructure:

```powershell
pytest -q
sam validate --template-file backend/template.yaml --lint
sam build --template-file backend/template.yaml
```

The frontend tests cover authentication state and API token/error behavior. Backend tests use mocked DynamoDB behavior. Deployed AWS integration tests must be reported separately from local tests.

## Upload and secret hygiene

The repository intentionally keeps safe source, tests, templates, lockfiles, and placeholder `.env.example` files. `.gitignore` excludes environment files, AWS credential directories, private keys, dependencies, Python caches, SAM build artifacts, build output, test coverage, and infrastructure state. Before publishing, scan the working tree for secrets and confirm that no real `.env`, credentials, private key, or generated artifact is included.

Do not commit AWS access keys, Cognito tokens, client secrets, local `.env` files, or outputs containing account-sensitive information.
