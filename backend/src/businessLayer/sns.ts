// import { createLogger } from "../utils/logger"
import * as AWS from 'aws-sdk'
import { CreateTopicResponse, PublishResponse, SubscribeResponse } from "aws-sdk/clients/sns";
import { TodoItem } from '../models/TodoItem';
import { TodosReminderItem } from '../models/TodosReminderItem';
import { createLogger } from '../utils/logger';
const AWSXRay = require('aws-xray-sdk');

// const logger = createLogger('TodosAccess')
const XAWS = AWSXRay.captureAWS(AWS)
const sns: AWS.SNS = new XAWS.SNS({ apiVersion: '2010-03-31' });
const topicArn = process.env.SNS_CREATED_TODO_TOPIC_ARN
const awsRegion = process.env.AWS_REGION_VALUE
const logger = createLogger('sendSnsCreatedTodo.ts');
export async function sendSnsCreatedTodo(
    dueDate: string,
    emailId: string,
    userId: string,
    todoId: string
): Promise<PublishResponse> {
    const params = {
        Message: JSON.stringify({ emailId, dueDate, userId, todoId }),
        TopicArn: topicArn
    }
    logger.info("Sending message with parameters" + JSON.stringify(params) + " to SNS Topic "+topicArn);
    return sns.publish(params).promise()
}

export async function sendReminder(todoItem: TodoItem, context) : Promise<PublishResponse> {
    const userIdValue = todoItem.userId.split("|")[1];
    const topicName = `reminder-topic-${userIdValue}`
    const accountId = JSON.stringify(context.invokedFunctionArn).split(':')[4];
    const topicArn = `arn:aws:sns:${awsRegion}:${accountId}:${topicName}`;
    const params = {
        Message: `Following todo item is due today: ${todoItem.name}`,
        TopicArn: topicArn
    }
    logger.info("Sending reminder for todo id " + todoItem.todoId + " to SNS Topic "+topicArn);
    return sns.publish(params).promise()
    
}

export async function handleTodosReminderItem(todosReminderItem: TodosReminderItem, context) {
    const userIdValue = todosReminderItem.userId.split("|")[1];
    const topicName = `reminder-topic-${userIdValue}`
    const accountId = JSON.stringify(context.invokedFunctionArn).split(':')[4];
    const topicArn = `arn:aws:sns:${awsRegion}:${accountId}:${topicName}`;
    //check if topic already created
    logger.info(`Checking topic with arn ${topicArn}`);
    try {
        await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
        //exists
        logger.info(`Topic with arn - ${topicArn} exists`)
    } catch (error) {
        logger.error("Error in getting topic attributes", error);
        if (error.statusCode == 404 || error.statusCode == 400) {
            //not exists
            //create topic with email id
            logger.info(`Topic with arn - ${topicArn} does not exists`)
            const topic = await createSnsTopic(topicName);
            logger.info(`Topic with arn - ${topic.TopicArn} created`)
            //create email subscription to the topic
            const emailSubscription = await createEmailSubscription(topic.TopicArn, todosReminderItem.emailId);
            logger.info(`Subscription with arn - ${emailSubscription.SubscriptionArn} created`)
        } else {
            throw error;
        }
    }
}

async function createSnsTopic(topicName: string): Promise<CreateTopicResponse> {
    return await sns.createTopic({ Name: topicName }).promise()
}

async function createEmailSubscription(topicArn: string, emailId: string): Promise<SubscribeResponse> {
    return await sns.subscribe({
        Protocol: 'EMAIL',
        TopicArn: topicArn,
        Endpoint: emailId
    }).promise();
}