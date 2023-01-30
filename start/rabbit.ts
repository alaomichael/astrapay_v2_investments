import RfiRecordsServices from "App/Services/RfiRecordsServices";
import { RfiRecordType } from "App/Services/types/rfirecord_type";
import SettingServices from "App/Services/SettingsServices";
import { SettingType } from "App/Services/types/setting_type";

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
            const settingsService = new SettingServices();
            let externalRfiRecordId = id;
            let rfiCode = code;
            let rfiName = name;
            let phone = directors[0].phoneNumber
            let imageUrl = content.imageUrl ? content.imageUrl : "http://www.no_image_provided.com";
            let website = content.website ? content.website : "http://www.no_website_provided.com";
            let phone2 = content.phone2 ? content.phone2 : "phone2 was not provided";
            let slogan = content.slogan ? content.slogan : "slogan was not provided";
            address = `${address.street}, ${address.city}, ${address.state}, ${address.country}`;
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
            let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
            if (!rfiRecord) {
                console.log("payload line 135 ===== ", payload)
                debugger
                rfiRecord = await rfiRecordsService.createRfiRecord(payload);
                // Create or update setting
                let {
                    rfiName,
                    rfiCode,
                    email,
                    imageUrl,
                } = rfiRecord

                let rfiImageUrl = imageUrl;
                //@ts-ignore
                let currencyCode = rfiRecord.currencyCode ? rfiRecord.currencyCode : "NGN";
                //@ts-ignore
                let isPayoutAutomated = rfiRecord.isPayoutAutomated ? rfiRecord.isPayoutAutomated : true;
                //@ts-ignore
                let fundingSourceTerminal = rfiRecord.fundingSourceTerminal ? rfiRecord.fundingSourceTerminal : "Sigma Octantis";
                //@ts-ignore
                let investmentWalletId = rfiRecord.investmentWalletId ? rfiRecord.investmentWalletId : "not yet provided";
                //@ts-ignore
                let payoutWalletId = rfiRecord.payoutWalletId ? rfiRecord.payoutWalletId : "not yet provided";
                //@ts-ignore
                let isInvestmentAutomated = rfiRecord.isInvestmentAutomated ? rfiRecord.isInvestmentAutomated : true;
                //@ts-ignore
                let isRolloverAutomated = rfiRecord.isRolloverAutomated ? rfiRecord.isRolloverAutomated : true;
                //@ts-ignore
                let tagName = rfiRecord.tagName ? rfiRecord.tagName : "default setting";
                //@ts-ignore
                let initiationNotificationEmail = rfiRecord.initiationNotificationEmail ? rfiRecord.initiationNotificationEmail : email;
                //@ts-ignore
                let activationNotificationEmail = rfiRecord.activationNotificationEmail ? rfiRecord.activationNotificationEmail : email;
                //@ts-ignore
                let maturityNotificationEmail = rfiRecord.maturityNotificationEmail ? rfiRecord.maturityNotificationEmail : email;
                //@ts-ignore
                let payoutNotificationEmail = rfiRecord.payoutNotificationEmail ? rfiRecord.payoutNotificationEmail : email;
                //@ts-ignore
                let rolloverNotificationEmail = rfiRecord.rolloverNotificationEmail ? rfiRecord.rolloverNotificationEmail : email;
                //@ts-ignore
                let liquidationNotificationEmail = rfiRecord.liquidationNotificationEmail ? rfiRecord.liquidationNotificationEmail : email;
                //@ts-ignore
                let isAllPayoutSuspended = rfiRecord.isAllPayoutSuspended ? rfiRecord.isAllPayoutSuspended : false;
                //@ts-ignore
                let isAllRolloverSuspended = rfiRecord.isAllRolloverSuspended ? rfiRecord.isAllRolloverSuspended : false;
                //@ts-ignore
                let liquidationPenalty = rfiRecord.liquidationPenalty ? rfiRecord.liquidationPenalty : 25;

                const payload2: SettingType = {
                    rfiName: rfiName,
                    rfiCode: rfiCode,
                    rfiImageUrl: rfiImageUrl,
                    isPayoutAutomated: isPayoutAutomated,
                    investmentWalletId: investmentWalletId,
                    payoutWalletId: payoutWalletId,
                    isInvestmentAutomated: isInvestmentAutomated,
                    isRolloverAutomated: isRolloverAutomated,
                    fundingSourceTerminal: fundingSourceTerminal,
                    // investmentType: investmentType,
                    tagName: tagName,
                    currencyCode: currencyCode,
                    initiationNotificationEmail: initiationNotificationEmail,
                    activationNotificationEmail: activationNotificationEmail,
                    maturityNotificationEmail: maturityNotificationEmail,
                    payoutNotificationEmail: payoutNotificationEmail,
                    rolloverNotificationEmail: rolloverNotificationEmail,
                    liquidationNotificationEmail: liquidationNotificationEmail,
                    isAllPayoutSuspended: isAllPayoutSuspended,
                    isAllRolloverSuspended: isAllRolloverSuspended,
                    liquidationPenalty: liquidationPenalty,
                }
                // check if setting exist and update changed value
                let selectedSetting = await settingsService.getSettingBySettingRfiCode(rfiCode)
                if (!selectedSetting) {
                    await settingsService.createSetting(payload2);
                } else {
                    await settingsService.updateSetting(selectedSetting, payload2);
                }

            } else {
                console.log("payload line 218 ===== ", payload)
                debugger
                rfiRecord = await rfiRecordsService.updateRfiRecord(rfiRecord, payload);
                // Create or update setting
                debugger
                //@ts-ignore
                let {rfiName,rfiCode,email,imageUrl,} = rfiRecord
                debugger
                let rfiImageUrl = imageUrl;
                //@ts-ignore
                let currencyCode = rfiRecord.currencyCode ? rfiRecord.currencyCode : "NGN";
                //@ts-ignore
                let isPayoutAutomated = rfiRecord.isPayoutAutomated ? rfiRecord.isPayoutAutomated : true;
                //@ts-ignore
                let fundingSourceTerminal = rfiRecord.fundingSourceTerminal ? rfiRecord.fundingSourceTerminal : "Sigma Octantis";
                //@ts-ignore
                let investmentWalletId = rfiRecord.investmentWalletId ? rfiRecord.investmentWalletId : "not yet provided";
                //@ts-ignore
                let payoutWalletId = rfiRecord.payoutWalletId ? rfiRecord.payoutWalletId : "not yet provided";
                //@ts-ignore
                let isInvestmentAutomated = rfiRecord.isInvestmentAutomated ? rfiRecord.isInvestmentAutomated : true;
                //@ts-ignore
                let isRolloverAutomated = rfiRecord.isRolloverAutomated ? rfiRecord.isRolloverAutomated : true;
                //@ts-ignore
                let tagName = rfiRecord.tagName ? rfiRecord.tagName : "default setting";
                //@ts-ignore
                let initiationNotificationEmail = rfiRecord.initiationNotificationEmail ? rfiRecord.initiationNotificationEmail : email;
                //@ts-ignore
                let activationNotificationEmail = rfiRecord.activationNotificationEmail ? rfiRecord.activationNotificationEmail : email;
                //@ts-ignore
                let maturityNotificationEmail = rfiRecord.maturityNotificationEmail ? rfiRecord.maturityNotificationEmail : email;
                //@ts-ignore
                let payoutNotificationEmail = rfiRecord.payoutNotificationEmail ? rfiRecord.payoutNotificationEmail : email;
                //@ts-ignore
                let rolloverNotificationEmail = rfiRecord.rolloverNotificationEmail ? rfiRecord.rolloverNotificationEmail : email;
                //@ts-ignore
                let liquidationNotificationEmail = rfiRecord.liquidationNotificationEmail ? rfiRecord.liquidationNotificationEmail : email;
                //@ts-ignore
                let isAllPayoutSuspended = rfiRecord.isAllPayoutSuspended ? rfiRecord.isAllPayoutSuspended : false;
                //@ts-ignore
                let isAllRolloverSuspended = rfiRecord.isAllRolloverSuspended ? rfiRecord.isAllRolloverSuspended : false;
                //@ts-ignore
                let liquidationPenalty = rfiRecord.liquidationPenalty ? rfiRecord.liquidationPenalty : 25;

                const payload2: SettingType = {
                    rfiName: rfiName,
                    rfiCode: rfiCode,
                    rfiImageUrl: rfiImageUrl,
                    isPayoutAutomated: isPayoutAutomated,
                    investmentWalletId: investmentWalletId,
                    payoutWalletId: payoutWalletId,
                    isInvestmentAutomated: isInvestmentAutomated,
                    isRolloverAutomated: isRolloverAutomated,
                    fundingSourceTerminal: fundingSourceTerminal,
                    // investmentType: investmentType,
                    tagName: tagName,
                    currencyCode: currencyCode,
                    initiationNotificationEmail: initiationNotificationEmail,
                    activationNotificationEmail: activationNotificationEmail,
                    maturityNotificationEmail: maturityNotificationEmail,
                    payoutNotificationEmail: payoutNotificationEmail,
                    rolloverNotificationEmail: rolloverNotificationEmail,
                    liquidationNotificationEmail: liquidationNotificationEmail,
                    isAllPayoutSuspended: isAllPayoutSuspended,
                    isAllRolloverSuspended: isAllRolloverSuspended,
                    liquidationPenalty: liquidationPenalty,
                }
                // check if setting exist and update changed value
                let selectedSetting = await settingsService.getSettingBySettingRfiCode(rfiCode)
                if (!selectedSetting) {
                    await settingsService.createSetting(payload2);
                } else {
                    await settingsService.updateSetting(selectedSetting, payload2);
                }


            }
            // debugger
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


