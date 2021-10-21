import * as middy from "middy";
import { cors } from "middy/middlewares";
import { sendReminders } from "../../businessLayer/todosReminder";
export const handler = middy(
    async (_event, context): Promise<void> => {
        await sendReminders(context)
    }
)

handler.use(
    cors({
      credentials: true
    })
  )