import RfiRecordsServices from "App/Services/RfiRecordsServices";
import { RfiRecordType } from "App/Services/types/rfirecord_type";

/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
const Env = require("@ioc:Adonis/Core/Env");
const RABBITMQ_HOSTNAME = Env.get("RABBITMQ_HOSTNAME");
// const RABBITMQ_EXCHANGE_NAME = Env.get("RABBITMQ_EXCHANGE_NAME");
const RABBITMQ_QUEUE_NAME = Env.get("RABBITMQ_QUEUE_NAME");
// const RABBITMQ_CONFIG_ROUTING_KEY = Env.get("RABBITMQ_CONFIG_ROUTING_KEY");

const amqplib = require('amqplib');

// import Rabbit from '@ioc:Adonis/Addons/Rabbit'

// async function listen() {
//     await Rabbit.assertQueue('config')

//     await Rabbit.consumeFrom('config', (message) => {
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


// const rabbitMQService = 
(async () => {
    const queue = RABBITMQ_QUEUE_NAME//'tasks';
    const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`);

    const ch1 = await conn.createChannel();
    await ch1.assertQueue(queue);

    // Listener
    ch1.consume(queue, async (msg) => {
        if (msg !== null) {
            // console.log('Received the whole message ======:', msg);
            // console.log('Received the fields message ======:', msg.fields);
            // console.log('Received message converted to string =========:', msg.content.toString());
            // console.log('Received in json format ========:', msg.content);
            let { fields, content } = msg;
            content = content.toString();
            // console.log('Received message converted to string, line 53 =========:', content);
            content = JSON.parse(content);
            // console.log('Received message converted to json, line 55 =========:', content);
            let {
                consumerTag,//: 'amq.ctag-ihMXzcY0EI6bWrseyN52Hg',
                deliveryTag,//: 1,
                redelivered,//: true,
                exchange,//: 'config',
                routingKey,//: 'investment.configuration'
            } = fields;

            // "id": "069ee6a3-13e7-4b56-91fb-5fb109fefddf",
            // "name": "comapny namekujjkkkk",
            // "email": "business@gmail.com",
            // "code": "code",
            // "createdBy": "08102872652",
            // "status": "Onboarding",
            // "address": {
            //   "street": "joceyB, Mokola",
            //   "city": "ibadan",
            //   "state": "Oyo",
            //   "country": "Nigeria"
            // },

            let { id, name, email, code, status, address, directors } = content;
            console.log("fields line 104 =====", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
            console.log("content line 105 ===== ", id, name, email, code, status, address)
            // Check if the record is existing

            const rfiRecordsService = new RfiRecordsServices();
            let externalRfiRecordId = id;
            let rfiCode = code;
            let rfiName = name;
            let phone = directors[0].phoneNumber
            let imageUrl = content.imageUrl ? content.imageUrl : "http://www.no_image_provided.com";
            let website = content.website ? content.website : "http://www.no_website_provided.com";
            let phone2 = content.phone2 ? content.phone2 : "phone2 was not provided";
            let slogan = content.slogan ? content.slogan : "slogan was not provided";
          
            const payload: RfiRecordType = {
                externalRfiRecordId: externalRfiRecordId,
                rfiName: rfiName,
                rfiCode: rfiCode,
                phone: phone,
                phone2: phone2,
                email: email,
                website: website,
                slogan: slogan,
                imageUrl: imageUrl,
                address: address,
            }
            debugger
            // let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
            // if (!rfiRecord) {
            //     rfiRecord = await rfiRecordsService.createRfiRecord(payload);
            // } else {
            //     rfiRecord = await rfiRecordsService.updateRfiRecord(rfiRecord, payload);
            // }
            debugger
            ch1.ack(msg);
        } else {
            console.log('Consumer cancelled by server');
        }
    });

    //     // Sender
    //     // const ch2 = await conn.createChannel();

    //     // setInterval(() => {
    //     //     ch2.sendToQueue(queue, Buffer.from('something to do'));
    //     // }, 1000);

})();


