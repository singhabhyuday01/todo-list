import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLayer/todos'
import { getEmailId, getUserId } from '../utils'
import { sendSnsCreatedTodo } from '../../businessLayer/sns'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    if(!newTodo.name || newTodo.name.length == 0) {
      return {
        statusCode: 400,
        body: 'Name of the todo can not be null'
      }
    }
    const emailId = getEmailId(event);
    const createdTodo = await createTodo(newTodo, getUserId(event), emailId);
    await sendSnsCreatedTodo(createdTodo.dueDate, emailId, createdTodo.userId, createdTodo.todoId);
    return {
      statusCode: 200,
      body: JSON.stringify(createdTodo)
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
