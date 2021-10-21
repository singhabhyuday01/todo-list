import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk');
import { DeleteItemOutput, DocumentClient, Key } from 'aws-sdk/clients/dynamodb'
import { TodosReminderItem } from '../models/TodosReminderItem';
import { createLogger } from '../utils/logger'

const logger = createLogger('TodosReminderAccess')
const XAWS = AWSXRay.captureAWS(AWS)

export class TodosReminderAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosReminderTable = process.env.TODOS_REMINDER_TABLE) {
    }

    async getTodosRemindersForDueDateAndTodoId(dueDate: string, todoId: string) : Promise<TodosReminderItem> {
        logger.info(`Getting all todo reminders for date : ${dueDate} with todo id : ${todoId}`)
        const params: DocumentClient.QueryInput = {
            TableName: this.todosReminderTable,
            KeyConditionExpression: 'dueDate = :dueDate  and todoId = :todoId',
            ExpressionAttributeValues: {
                ':dueDate': dueDate,
                ':todoId': todoId
            }
        };
        const result : DocumentClient.QueryOutput = await this.docClient.query(params).promise()
        const items = result.Items
        if(items.length == 0) {
            return null;
        }
        return items[0] as TodosReminderItem;
    }

    async getTodosRemindersForDate(dueDate: string, lastEvaluatedKey: Key): Promise<{items: TodosReminderItem[], lastEvaluatedKey: Key}> {
        logger.info(`Getting all todo reminders for date : ${dueDate} with lastEvaluatedKey ${lastEvaluatedKey}`)
        const params: DocumentClient.QueryInput = {
            TableName: this.todosReminderTable,
            KeyConditionExpression: 'dueDate = :dueDate',
            ExpressionAttributeValues: {
                ':dueDate': dueDate
            }
        };
        if(lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }
        const result : DocumentClient.QueryOutput = await this.docClient.query(params).promise()
        const items = result.Items
        return {items: items as TodosReminderItem[], lastEvaluatedKey: result.LastEvaluatedKey};
    }

    async createTodosReminder(todosReminder: TodosReminderItem): Promise<TodosReminderItem> {
        logger.info('Creating todo for todos reminder item : '+JSON.stringify(todosReminder))
        await this.docClient.put({
            TableName: this.todosReminderTable,
            Item: todosReminder
        }).promise()
        return todosReminder
    }

    async deleteTodosReminder(dueDate: string, todoId: string) : Promise<DeleteItemOutput> {
        const data : DeleteItemOutput = await this.docClient.delete({
            TableName: this.todosReminderTable,
            Key: {
                'dueDate': dueDate,
                'todoId': todoId
            }
        }).promise()
        return data;
    }

}