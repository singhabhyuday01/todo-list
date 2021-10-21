import { TodosReminderAccess } from "../dataLayer/todosReminderAcces";
import { TodosReminderItem } from "../models/TodosReminderItem";
import { createLogger } from "../utils/logger";
import dateFormat from 'dateformat'
import { Key } from "aws-sdk/clients/dynamodb";
import { getTodosForUserIdTodoId } from "./todos";
import { sendReminder } from "./sns";

const logger = createLogger('todosReminder.ts');

const todosReminderAccess = new TodosReminderAccess();

export async function getTodosRemindersForDueDateAndTodoId(dueDate: string, todoId: string): Promise<TodosReminderItem> {
    return todosReminderAccess.getTodosRemindersForDueDateAndTodoId(dueDate, todoId);
}

export async function sendReminders(context) {
    //get today's due todos
    const todayDate = getTodaysDate();
    //get todo reminders for today
    let lastEvaluatedKey: Key;
    let response = await todosReminderAccess.getTodosRemindersForDate(todayDate, lastEvaluatedKey);
    lastEvaluatedKey = response.lastEvaluatedKey;
    while (response.items.length > 0 && lastEvaluatedKey) {
        //get todo for each
        sendReminderFn(response, context);
        response = await todosReminderAccess.getTodosRemindersForDate(todayDate, lastEvaluatedKey);
        lastEvaluatedKey = response.lastEvaluatedKey;
    }
    if(response.items.length > 0) {
        sendReminderFn(response, context);
    }
}

async function sendReminderFn(response: {
    items: TodosReminderItem[],
    lastEvaluatedKey: Key
}, context) {
    const todos = await Promise.all(response.items.map(item => getTodosForUserIdTodoId(item.userId, item.todoId)));
    logger.info(`Got ${todos.length} todos`);
    //send reminder for each
    await Promise.all(todos.map(todo => sendReminder(todo, context)));
    logger.info(`Sent ${response.items.length} reminders`)
    //delete reminders
    await Promise.all(response.items.map(item => {
        todosReminderAccess.deleteTodosReminder(item.dueDate, item.todoId)
    }))
    logger.info(`Deleted ${response.items.length} reminders`)
}

export async function createTodosReminder(todosReminder: TodosReminderItem) {
    return todosReminderAccess.createTodosReminder(todosReminder);
}

function getTodaysDate(): string {
    const date = new Date()
    return dateFormat(date, 'yyyy-mm-dd') as string
}

