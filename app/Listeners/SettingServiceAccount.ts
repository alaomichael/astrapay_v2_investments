import type { EventsList } from "@ioc:Adonis/Core/Event";
import Env from "@ioc:Adonis/Core/Env";
const INVESTMENT_RABBITMQ_HOSTNAME = Env.get("INVESTMENT_RABBITMQ_HOSTNAME");
const INVESTMENT_RABBITMQ_EXCHANGE_NAME = Env.get("INVESTMENT_RABBITMQ_EXCHANGE_NAME");
// const INVESTMENT_RABBITMQ_QUEUE_NAME = Env.get("INVESTMENT_RABBITMQ_QUEUE_NAME");

const amqplib = require('amqplib');
const INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY = Env.get("INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY")
// const senderName = Env.get("MAIL_SENDER_NAME")

export default class SettingServiceAccount {

    public async sendServiceAccount({ action, serviceAccount }: EventsList["service_account::send_service_account"]) {
        try {
            console.log("sending service account to queue");
            // console.log(" action ", action);
            // console.log(" serviceAccount ", serviceAccount);
            debugger
            if (action && serviceAccount) {
                //  publish to queue
                const conn = await amqplib.connect(INVESTMENT_RABBITMQ_HOSTNAME);// amqplib.connect(`amqp://${INVESTMENT_RABBITMQ_HOSTNAME}`); 
                // console.log("RabbitMQ Connected",conn)
                // debugger
                const ch1 = await conn.createChannel();
                await ch1.assertExchange(INVESTMENT_RABBITMQ_EXCHANGE_NAME, 'direct', { durable: true });
                // console.log("channel details: ", ch1);
                let message = {
                    action,
                    serviceAccount
                };
                const stringifiedMessage = await JSON.stringify(message)
                // console.log(" stringifiedMessage ",typeof stringifiedMessage)
                // const buffer = Buffer.from(stringifiedMessage, 'utf-8');
                let buffer;
                try {
                    buffer = Buffer.from(stringifiedMessage, 'utf-8');
                } catch (err) {
                    console.error('Error creating buffer:', err);
                }

                // console.log(buffer);
                // debugger
                // Publisher
                await ch1.publish(INVESTMENT_RABBITMQ_EXCHANGE_NAME, INVESTMENT_RABBITMQ_SERVICE_ACCOUNT_ROUTING_KEY, buffer);
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

