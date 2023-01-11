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

// async function listen() {
//     await Rabbit.assertQueue('my_queue')

//     await Rabbit.consumeFrom('my_queue', (message) => {
//         console.log("RabbitMQ Message ======================")
//         console.log(message.content)
//         message.ack();

//         // "If you're expecting a JSON, this will return the parsed message"
//         console.log("If you're expecting a JSON, this will return the parsed message ================")
//         // console.log(message.jsonContent)
//     })
// }

// listen()

let listOfQueues = ["my_queue", "another_queue", "yet_another_queue"]
async function listenToQueue(queueName) {
    await Rabbit.assertQueue(queueName)

    await Rabbit.consumeFrom(queueName, (message) => {
        console.log("RabbitMQ Message ======================")
        console.log(message.content)
        message.ack();

        // "If you're expecting a JSON, this will return the parsed message"
        console.log("If you're expecting a JSON, this will return the parsed message ================")
        // console.log(message.jsonContent)
    })
}

for (let index = 0; index < listOfQueues.length; index++) {
    const currentQueueName = listOfQueues[index];
console.log("Queue name @ rabbit.ts line 46: " + currentQueueName);
    listenToQueue(currentQueueName)
}

