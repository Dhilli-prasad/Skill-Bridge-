# SkillBridge deployment readiness

Status: prepared for review only. No AWS resources were created or deployed by this change. Deployment requires explicit approval.

## Proposed resources

The SAM template would create one environment-scoped Cognito User Pool and public web client, one API Gateway HTTP API and stage, one Python 3.12 Lambda function, one on-demand DynamoDB table with `GSI1`, and a CloudWatch log group with 14-day retention. There is no S3 bucket because evidence upload is not implemented or required by this phase, and there is no NAT gateway, container cluster, or second application table.

## Verified readiness facts

- `backend/template.yaml` uses Python 3.12, an API Gateway HTTP API JWT authorizer backed by the Cognito User Pool issuer and client audience, a single `PK`/`SK` table, and the existing `GSI1`.
- Lambda identity is taken from the API Gateway authorizer context; request bodies do not establish ownership.
- DynamoDB transactions are used by collaboration/completion workflows and the Lambda policy includes `TransactWriteItems`.
- The policy no longer grants `Scan`; application list operations use key queries.
- S3 is intentionally not provisioned yet. If evidence uploads become essential, add a separate reviewed private bucket with presigned URLs, content validation, and explicit lifecycle controls.
- The frontend API base URL is supplied by `VITE_API_BASE_URL`. Passport API mode is explicitly selected with `VITE_DEVELOPER_PASSPORT_MODE=api`; local mode does not silently become an API fallback.
- The frontend API client exposes an in-memory `ApiAuthSession` adapter. A Cognito integration must provide `getAccessToken`, `refreshAccessToken`, and optional `clearSession` callbacks; refresh-token handling remains inside that provider and is never persisted by SkillBridge in `localStorage`.
- `samconfig.toml` contains the dev region and non-secret parameters only.

## Local validation

Run from `backend/` after installing SAM CLI:

```powershell
sam validate --template-file template.yaml
sam build --template-file template.yaml
pytest -q
```

The current environment has AWS CLI installed, but `sam` is not available on PATH. AWS STS authentication was checked and the local session was expired, so no AWS account state was inspected and no deployment was attempted.

Frontend checks remain:

```powershell
npm run build
npm run lint
```

## Approval-gated deployment configuration

Use a named AWS profile or environment-based credentials outside the repository. Review the generated change set before any deployment. The dev configuration targets `ap-south-1`, stack `skillbridge-dev`, and the exact local origin `http://127.0.0.1:5173`. Production must use a separately reviewed origin and environment configuration. Do not put credentials, tokens, or secrets in SAM parameters, frontend variables, or source files.

Required deployment permissions are CloudFormation stack operations, SAM-managed Lambda/API Gateway/Cognito/DynamoDB/CloudWatch Logs creation and update, and `iam:PassRole` for the generated Lambda execution role. Exact permissions should be narrowed to the deployment pipeline identity used by the team.

## Cost considerations

No resources are currently confirmed as deployed by this inspection. Potential charges include DynamoDB on-demand reads/writes and point-in-time recovery, API Gateway requests, Lambda invocations and duration, CloudWatch log ingestion/storage, and Cognito usage beyond applicable free tiers. Costs vary by region and change over time; confirm current AWS pricing before approval. The design avoids NAT gateway and S3 charges for this phase and uses serverless/on-demand defaults, but an idle log group or PITR-enabled table can still incur small ongoing charges.

## Security and rollback

Cognito verifies the bearer token at API Gateway. Lambda authorizers are not replaced by frontend-supplied user IDs or roles. Private project records are filtered server-side, conditional writes prevent duplicate records, and completion/contribution creation is idempotent within DynamoDB transaction boundaries. CORS must remain an exact allow-list rather than `*` when credentials are used. Private evidence, if added later, must use short-lived server-authorized S3 URLs and never public ACLs.

For rollback, review a CloudFormation change set, deploy only after approval, and use stack rollback/continue-rollback for infrastructure failures. The DynamoDB table requires an explicit data-retention decision before deletion. Application rollback should use a versioned Lambda deployment and a previously reviewed frontend build.

## Known limitations before production

No deployed integration test has been run because AWS authentication is unavailable and deployment is prohibited. Backend profile persistence and Cognito sign-in UI are not yet migrated; the Passport page supports an explicit API mode but still displays existing local profile/learning data. No Cognito client SDK or auth provider currently exists in the frontend, so the adapter must be connected to a supported Cognito flow before API mode can authenticate. Required non-secret configuration is `VITE_COGNITO_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_USER_POOL_CLIENT_ID`, and `VITE_API_BASE_URL`; no client secret belongs in frontend configuration. S3 evidence workflows are not implemented. These limitations must be resolved and tested in a staging account before production use.

## Cleanup instructions

After an approved staging deployment, use the reviewed stack name and profile with `sam delete --config-env dev` only after exporting or retaining any required DynamoDB data. Do not delete a production stack as a cleanup shortcut; use a reviewed change set and explicit data-retention approval.
