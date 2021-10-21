import { TodoAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../dataLayer/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todoAccess = new TodoAccess();
const attachmentUtils = new AttachmentUtils();
const attachmentBucketName = process.env.ATTACHMENT_S3_BUCKET;
const logger = createLogger('todos.ts');

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info("Getting todos for userId: "+userId);
    return todoAccess.getTodosForUser(userId);
}

export async function getTodosForUserIdTodoId(userId: string, todoId: string): Promise<TodoItem> {
    logger.info("Getting todo for userId: "+userId+" and todoId: "+todoId);
    return todoAccess.getTodosForUserIdTodoId(userId, todoId);
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string,
    emailId: string
): Promise<TodoItem> {
    const todoId = uuid.v4()
    logger.info("Creating todo for userId: "+userId+" and todoId: "+todoId);
    return await todoAccess.createTodo({
        todoId: todoId,
        userId: userId,
        name: createTodoRequest.name,
        email: emailId,
        dueDate: createTodoRequest.dueDate,
        createdAt: new Date().toISOString(),
        done: false
    })
}

export async function updateTodo(
    updateTodoRequest: UpdateTodoRequest,
    todoId: string,
    userId: string
): Promise<TodoItem> {
    logger.info("Updating todo of userId: "+userId+" and todoId: "+todoId);
    return await todoAccess.updateTodo(updateTodoRequest, todoId, userId);
}

export async function deleteTodo(todoId: string, userId: string) {
    logger.info("Deleting todo of userId: "+userId+" and todoId: "+todoId);
    return await todoAccess.deleteTodo(userId, todoId);
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string) : Promise<string> {
    logger.info("Creating attachment url of todo of userId: "+userId+" and todoId: "+todoId);
    const todo = await getTodosForUserIdTodoId(userId, todoId);
    if(!todo) {
        createError(404, "Todo of userId: "+userId+" and todoId: "+todoId+" not found");
        return null;
    }
    logger.info("Todo Item Found.");
    const attachmentUrl = `https://${attachmentBucketName}.s3.amazonaws.com/${todoId}`
    logger.info("Attachment Url : "+attachmentUrl);
    const uploadUrl = attachmentUtils.getUploadUrl(todoId);
    await todoAccess.updateTodo({attachmentUrl}, userId, todoId);
    return uploadUrl;
    
}
