// import Rabbit from '@ioc:Adonis/Addons/Rabbit'
// import { rabbitMQService } from 'App/Services/MessageQueuesServices'
import { BaseTask } from 'adonis5-scheduler/build'

// import axios from 'axios'

export default class ListenToMessageQueue extends BaseTask {
    public static get schedule() {
        // *    *    *    *    *    *
        // ┬    ┬    ┬    ┬    ┬    ┬
        // │    │    │    │    │    │
        // │    │    │    │    │    └ day of week(0 - 7)(0 or 7 is Sun)
        // │    │    │    │    └───── month(1 - 12)
        // │    │    │    └────────── day of month(1 - 31)
        // │    │    └─────────────── hour(0 - 23)
        // │    └──────────────────── minute(0 - 59)
        // └───────────────────────── second(0 - 59, OPTIONAL)
        // return '* * * * * *'

        // return '*/30 * * * * *' // runs every 30 seconds
        return '*/30 * * * *' // runs every 30 minutes
        // return '0 */2 * * *' // runs every 2 hours 0 minute
        // return '1 0 * * *' // runs every 00:01 daily
    }
    /**
     * Set enable use .lock file for block run retry task
     * Lock file save to `build/tmpTaskLock`
     */
    public static get useLock() {
        return false
    }

    public async handle() {
        // @ts-ignore
        this.logger.info('Handled')
        console.log("Scheduler is Running Listen To Message Queue ==============================================")

        // async function listen() {
        //     await Rabbit.assertQueue('my_queue')

        //     await Rabbit.consumeFrom('my_queue', (message) => {
        //         console.log("RabbitMQ Message, @ ListenToMessageQueue line 39 ======================")
        //         console.log(message.content)

        //         // "If you're expecting a JSON, this will return the parsed message"
        //         console.log("If you're expecting a JSON, 'message.jsonContent' will return the parsed message, @ ListenToMessageQueue line 43 ================")
        //         console.log(message.jsonContent)
        //         // delete the message from queue by acknowledging it with "message.ack()"
        //         message.ack();
        //     })
        // }

        // await listen();
    //   await rabbitMQService()
        console.log("After AXIOS CALL for Listen To Message Queue ,  ==================================================");
        console.log("The ASTRAPAY API Listen To Message Queue  response,line 52: ");
    }
}
