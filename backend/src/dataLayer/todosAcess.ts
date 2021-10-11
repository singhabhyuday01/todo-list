import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk');
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { AttachmentUtils } from './attachmentUtils';

const logger = createLogger('TodosAccess')
const XAWS = AWSXRay.captureAWS(AWS)
// TODO: Implement the dataLayer logic
const attachmentUtils = new AttachmentUtils();
export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todos for user id : ' + userId)
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
        }).promise()
        const items = result.Items
        return items as TodoItem[]
    }

    async getTodosForUserIdTodoId(userId: string, todoId: string): Promise<TodoItem> {
        logger.info("Getting todo for userId: " + userId + " and todoId: " + todoId);
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId and todoId = :todoId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':todoId': todoId
            },
        }).promise()
        const items = result.Items
        return items[0] as TodoItem
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info('Creating todo for user id : ' + todo.userId)
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        return todo
    }

    async updateTodo(todo: TodoUpdate, userId: string, todoId: string): Promise<TodoItem> {
        const todoDb = await this.getTodosForUserIdTodoId(userId, todoId);
        if (!todoDb) {
            logger.error("Todo for userId: " + userId + " and todoId: " + todoId + " not found!");
            throw new Error("Todo for userId: " + userId + " and todoId: " + todoId + " not found!");
        }
        logger.info("Found todo item: " + JSON.stringify(todoDb))
        const updatedTodo = { ...todoDb, ...todo }
        logger.info("Update model", todo)
        logger.info("Storing todo item", updatedTodo)
        await this.docClient.put({
            TableName: this.todosTable,
            Item: updatedTodo
        }).promise()
        return updatedTodo
    }

    async deleteTodo(userId: string, todoId: string): Promise<void> {
        const todoItem = await this.getTodosForUserIdTodoId(userId, todoId);
        if(!todoItem) {
            throw new Error("Todo for userId: " + userId + " and todoId: " + todoId + " not found!")
        }
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                'userId': userId,
                'todoId': todoId
            },
        }, (err, data) => {
            if (err) {
                logger.error("Todo for userId: " + userId + " and todoId: " + todoId + " not deleted!");
                throw err;
            } else if(data) {
                logger.info("Deleted TodoItem", data);
            }
        })
        if (todoItem.attachmentUrl) {
            await attachmentUtils.deleteAttachment(todoId);
        }
    }
}