const Env = require("@ioc:Adonis/Core/Env");
const RABBITMQ_HOSTNAME = Env.get("RABBITMQ_HOSTNAME");
// const RABBITMQ_EXCHANGE_NAME = Env.get("RABBITMQ_EXCHANGE_NAME");
const RABBITMQ_QUEUE_NAME = Env.get("RABBITMQ_QUEUE_NAME");
// const RABBITMQ_CONFIG_ROUTING_KEY = Env.get("RABBITMQ_CONFIG_ROUTING_KEY");

const amqplib = require('amqplib');

// const rabbitMQService = (async () => {
//     const queue = RABBITMQ_QUEUE_NAME//'tasks';
//     const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`);

//     const ch1 = await conn.createChannel();
//     await ch1.assertQueue(queue);

//     // Listener
//     ch1.consume(queue, (msg) => {
//         if (msg !== null) {
//             console.log('Received the whole message ======:', msg);
//             console.log('Received =========:', msg.content.toString());
//             console.log('Received in json format ========:', msg.content);
//             ch1.ack(msg);
//         } else {
//             console.log('Consumer cancelled by server');
//         }
//     });

//     // Sender
//     // const ch2 = await conn.createChannel();

//     // setInterval(() => {
//     //     ch2.sendToQueue(queue, Buffer.from('something to do'));
//     // }, 1000);

// })();

const rabbitMQService = async () => {
    const queue = RABBITMQ_QUEUE_NAME//'tasks';
    const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`);

    const ch1 = await conn.createChannel();
    await ch1.assertQueue(queue);

    // Listener
    ch1.consume(queue, (msg) => {
        if (msg !== null) {
            console.log('Received the whole message ======:', msg);
            console.log('Received =========:', msg.content.toString());
            console.log('Received in json format ========:', msg.content);
            debugger
            ch1.ack(msg);
        } else {
            console.log('Consumer cancelled by server');
        }
    });

    // Sender
    // const ch2 = await conn.createChannel();

    // setInterval(() => {
    //     ch2.sendToQueue(queue, Buffer.from('something to do'));
    // }, 1000);

};

export {
    rabbitMQService
}