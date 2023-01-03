/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Rabbit from '@ioc:Adonis/Addons/Rabbit'

async function listen() {
    await Rabbit.assertQueue('my_queue')

    await Rabbit.consumeFrom('my_queue', (message) => {
        console.log("RabbitMQ Message ======================")
        console.log(message.content)
        message.ack();

        // "If you're expecting a JSON, this will return the parsed message"
        console.log("If you're expecting a JSON, this will return the parsed message ================")
        // console.log(message.jsonContent)
    })
}

listen()
