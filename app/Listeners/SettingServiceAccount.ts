import type { EventsList } from "@ioc:Adonis/Core/Event";
import Env from "@ioc:Adonis/Core/Env";
const RABBITMQ_HOSTNAME = Env.get("RABBITMQ_HOSTNAME");
const RABBITMQ_EXCHANGE_NAME = Env.get("RABBITMQ_EXCHANGE_NAME");
const INVESTMENT_RABBITMQ_QUEUE_NAME = Env.get("INVESTMENT_RABBITMQ_QUEUE_NAME");

const amqplib = require('amqplib');
const INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY = Env.get("INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY")
// const senderName = Env.get("MAIL_SENDER_NAME")

export default class SettingServiceAccount {

    public async sendServiceAccount({ action, serviceAccount }: EventsList["service_account::send_service_account"]) {
        try {
            console.log("sending service account to queue");
            console.log(" action ", action);
            console.log(" serviceAccount ", serviceAccount);
            debugger
            if (action && serviceAccount) {
                //  publish to queue
                const queue = INVESTMENT_RABBITMQ_QUEUE_NAME;//'tasks';

                // const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); //amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}` || 'amqp://localhost')
                // debugger
                // debugger
                const conn = await amqplib.connect(RABBITMQ_HOSTNAME);// amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); 
                // console.log("RabbitMQ Connected",conn)
                // debugger
                const ch1 = await conn.createChannel();
                await ch1.assertQueue(queue);
                await ch1.bindQueue(queue, RABBITMQ_EXCHANGE_NAME, INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
                await ch1.checkQueue(queue);
                await ch1.get(queue);
                // console.log("channel details: ", ch1);
                let message = {
                    action,
                    serviceAccount
                };
                const stringifiedMessage = await JSON.stringify(message)
                debugger
                // Publisher
                await ch1.publish(queue, Buffer.from(stringifiedMessage));
                console.log("service account has been sent to queue.")
                debugger
                await ch1.close();
                await conn.close();
            }
        } catch (error) {
            console.log("could not send service account to queue.");
            console.log(error);
        }
    }
}

