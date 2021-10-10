import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

// import { verify, decode } from 'jsonwebtoken'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev-rzn0m0cd.us.auth0.com/.well-known/jwks.json'
//const jwksUrl = 'https://dev-rm1hep60.us.auth0.com/.well-known/jwks.json'
let cert: string = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJKyXoG/RST/sOMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1yem4wbTBjZC51cy5hdXRoMC5jb20wHhcNMjExMDEwMDczNzM3WhcN
MzUwNjE5MDczNzM3WjAkMSIwIAYDVQQDExlkZXYtcnpuMG0wY2QudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0fJoqcc4QtrEnqAB
m/p+eDQDncEWsjH6iOYNl2CyFKI9n44sRBC8BlOr9Oa21+YlIMiig3tZe74Jz3qd
bqfUXOCkTjfNJLluYJfMGhKwpx/L1x8PuhcaVYC4zivE+oYtj8EWWynBH+vqMYv2
UveYe5mS29PgFfO8XnbFk/qpjzm+HbDBkcQCagQlQ0++ZkdbgFBNUHkpWwpGjm9N
je4+oO1IMSYRucYUSX3RYmDxEt/nDGpDnBoi6+NwpTzKQLqOqAhhA/J4lpt5liaf
4m2fsY+0S3Ttf/JE69VOK0n2UMwHNgsS+s8yE2O4jnX2jjtTs6yT1WLcj5V3dOiH
RAVrKQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBT48oVRRGX7
J7c4zYIPMBJoJOwbuDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AA0k+gKpTUMkkFIMZY3gLlS0rSO/0tnJ9MJzm0WolxFwNkuX4vcFDne84CEI1XOO
Qrqwwof21XshbS1dL9px9bBhLk57ooPI7m2/b4UgcWSKVu1xFk+W8K0ammv5QPm+
XeQQD5KELL7qSDzdTZeAthusnLfPoxUWPYxCkst2JiTZcnbNVP9vZhWHct178nDg
wxw6VFp8PK0BTVJTNrdnhu8WUiPSd4dY3jrzYVCGkGOuHns+8klIHc4957DF05Og
bLC5esh3XOIhBj77WTS7OvyclNfq0NAw3Yi88g7tAGv1w4Z6igmK/18P0tQdltHs
rlu9xhsyjlUJhaM3Id8gk3A=
-----END CERTIFICATE-----`;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized'+jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  // if (!cert) {
  //   const res = await Axios.get(jwksUrl)
  //   cert = res.data.keys[0].x5c[0]
  //   logger.info("Got certificate: "+cert);
  // }
  const jwtObject = verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload

  logger.info('Authorized a user with jwtObject', jwtObject)
  return jwtObject;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
