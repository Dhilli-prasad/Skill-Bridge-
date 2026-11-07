# SkillBridge backend foundation

This directory contains the non-deployed AWS SAM foundation for SkillBridge. It is intentionally additive: the React application continues to use its existing localStorage services until individual modules are migrated behind the API.

## Architecture

- Amazon Cognito User Pool and app client for identity.
- Amazon API Gateway HTTP API with a Cognito JWT authorizer.
- One Python 3.12 Lambda entry point with modular route dispatch for the existing Community, Learning Hub, Learning Circles, Code Arena, Skill Exchange, Project Collaboration, and Developer Passport domains.
- One on-demand DynamoDB single table with `PK`/`SK` keys and a `GSI1` for future access patterns.
- CloudWatch Logs through SAM-managed Lambda logging permissions.

The current Lambda implements the authenticated Project Collaboration and Developer Passport contribution slices, including projects, team formation, milestones, tasks, progress, completion, and contribution queries. The frontend remains localStorage-backed unless an API mode is explicitly selected. Code Arena evaluation remains a predefined sample demo; arbitrary user code is never executed by this backend.

The Lambda `CodeUri` is `src/`, so its runtime dependency manifest is [src/requirements.txt](./src/requirements.txt). It currently contains only the documented `boto3` runtime provision; add future pinned third-party runtime dependencies there rather than duplicating the file at the backend root. Development-only test dependencies remain in [requirements-dev.txt](./requirements-dev.txt).

## Prerequisites

- AWS CLI configured with a named profile or environment credentials.
- AWS SAM CLI installed and available as `sam`.
- Python 3.12 for local tests and packaging.
- Node.js/npm for the existing frontend.

No AWS resources are deployed by this change.

## Local checks

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest
sam validate --template-file template.yaml
sam build --template-file template.yaml
```

The repository currently has no committed AWS credentials. Use `aws sts get-caller-identity` locally to verify authentication; never place its output, access keys, or tokens in source files.

## Deployment plan (not run)

```powershell
sam deploy --guided --config-env dev
```

Review the generated change set and estimated costs before approving deployment. Keep `samconfig.toml` free of secrets and use a deployment profile or environment credentials.

## Environment configuration

`config/environments/dev.json` is non-secret local documentation for the intended dev defaults. Deployment parameters are defined in `samconfig.toml` and can be overridden per environment. Secrets should be supplied through AWS-managed services or deployment-time environment configuration, never committed here.
