import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLayer/todos'
import { getUserId } from '../utils'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const uploadUrl = await createAttachmentPresignedUrl(todoId, getUserId(event));
    if (!uploadUrl) {
      return {
        statusCode: 400,
        body: null
      }
    }
    return {
      statusCode: 200,
      body: uploadUrl
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
