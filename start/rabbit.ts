/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

// import Rabbit from '@ioc:Adonis/Addons/Rabbit'

// async function listen() {
//     await Rabbit.assertQueue('my_queue')

//     await Rabbit.consumeFrom('my_queue', (message) => {
//         console.log("RabbitMQ Message ======================")
//         console.log(message.content)

//         // "If you're expecting a JSON, this will return the parsed message"
//         console.log("If you're expecting a JSON, 'message.jsonContent' will return the parsed message ================")
//         console.log(message.jsonContent)

//         message.ack();
//     })
// }

// listen()

// let listOfQueues = ["my_queue", "another_queue", "yet_another_queue"]
// async function listenToQueue(queueName) {
//     console.log("Queue name @ rabbit.ts line 31: " + queueName);
//     await Rabbit.assertQueue(queueName)

//     await Rabbit.consumeFrom(queueName, (message) => {
//         console.log("RabbitMQ Message ======================")
//         console.log(message.content)
        
//         // "If you're expecting a JSON, this will return the parsed message"
//         console.log("If you're expecting a JSON, this will return the parsed message ================")
//         console.log(message.jsonContent)

//         message.ack();
//     })
// }

// for (let index = 0; index < listOfQueues.length; index++) {
//     console.log("index @ rabbit.ts line 48: " + index);
//     const currentQueueName = listOfQueues[index];
// console.log("Queue name @ rabbit.ts line 50: " + currentQueueName);
//    listenToQueue(currentQueueName)
// }

