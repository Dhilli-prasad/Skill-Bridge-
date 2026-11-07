export interface CognitoConfig {
  region: string
  userPoolId: string
  userPoolClientId: string
}

function readValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getCognitoConfig(): CognitoConfig | undefined {
  const region = readValue(import.meta.env.VITE_COGNITO_REGION)
  const userPoolId = readValue(import.meta.env.VITE_COGNITO_USER_POOL_ID)
  const userPoolClientId = readValue(import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID)
  if (!region || !userPoolId || !userPoolClientId) return undefined
  return { region, userPoolId, userPoolClientId }
}

export const requiredCognitoEnvironment = [
  'VITE_COGNITO_REGION',
  'VITE_COGNITO_USER_POOL_ID',
  'VITE_COGNITO_USER_POOL_CLIENT_ID',
] as const
