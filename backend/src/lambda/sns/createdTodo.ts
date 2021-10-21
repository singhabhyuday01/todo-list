import { SNSEvent } from "aws-lambda";
import * as middy from "middy";
import { cors } from "middy/middlewares";
import { handleTodosReminderItem } from "../../businessLayer/sns";
import { createTodosReminder, getTodosRemindersForDueDateAndTodoId } from "../../businessLayer/todosReminder";
import { CreatedTodo } from "../../models/CreatedTodo";
import { createLogger } from "../../utils/logger";

const logger = createLogger("createdTodoHandler");

export const handler = middy(
    async (event: SNSEvent, context) => {
        const createdTodo : CreatedTodo = JSON.parse(event.Records[0].Sns.Message);
        //get existing
        const existing = await getTodosRemindersForDueDateAndTodoId(createdTodo.dueDate, createdTodo.todoId);
        logger.info("Existing obj", existing);
        if(existing) {
            logger.info(`Todo with id ${createdTodo.todoId} already added in the reminders table`);
            return;
        }
        //add in table
        await createTodosReminder(createdTodo);
        //create topic and subscription
        await handleTodosReminderItem(createdTodo, context);
    }
)

handler.use(
    cors({
      credentials: true
    })
  )