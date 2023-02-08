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
const RABBITMQ_EXCHANGE_NAME = Env.get("RABBITMQ_EXCHANGE_NAME");
const RABBITMQ_QUEUE_NAME = Env.get("RABBITMQ_QUEUE_NAME");
const RABBITMQ_CONFIG_ROUTING_KEY = Env.get("RABBITMQ_CONFIG_ROUTING_KEY");

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
    try {
        const queue = RABBITMQ_QUEUE_NAME;//'tasks';
        const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); //amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}` || 'amqp://localhost');
        // debugger
        const ch1 = await conn.createChannel();
        await ch1.assertQueue(queue);
        await ch1.bindQueue(queue, RABBITMQ_EXCHANGE_NAME, RABBITMQ_CONFIG_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
        await ch1.checkQueue(queue);
        await ch1.get(queue);
        // console.log("channel details: ", ch1);
        // debugger
        // Listener
        await ch1.consume(queue, async (msg) => {
            // console.log("msg details: ", msg);
            // debugger
            if (msg !== null) {
                try {
                    // console.log('Received the whole message ======:', msg);
                    // console.log('Received the fields message ======:', msg.fields);
                    // console.log('Received message converted to string =========:', msg.content.toString());
                    // console.log('Received in json format ========:', msg.content);
                    let { fields, content } = msg;
                    // debugger
                    content = content.toString();
                    // console.log('Received message converted to string, line 93 =========:', content);
                    content = JSON.parse(content);
                    // console.log('Received the fields message, line 94 ======:', fields);
                    // console.log('Received message converted to json, line 95 =========:', content);
                    // debugger
                    let {
                        consumerTag,//: 'amq.ctag-ihMXzcY0EI6bWrseyN52Hg',
                        deliveryTag,//: 1,
                        redelivered,//: true,
                        exchange,//: 'config',
                        routingKey,//: 'investment.configuration'
                    } = fields;

                    //   action: 'Investment config persist',
                    //   investment: {
                    //     id: '10ffa360-05d0-4995-91e6-e48b64244020',
                    //     rfiId: '00bc7e0e-d113-4bbc-8257-20549beb2f39',
                    //     bundleId: '0d8a074e-a1e0-47c4-badb-1940c3b50669',
                    //     productId: '8efad311-ea14-400e-8a2b-6059e2716947',
                    //     initiationNotificationEmail: 'mazojynuj@mailinator.com',
                    //     activationNotificationEmail: 'zihituf@mailinator.com',
                    //     maturityNotificationEmail: 'cinanicecu@mailinator.com',
                    //     payoutNotificationEmail: 'doxamo@mailinator.com',
                    //     rolloverNotificationEmail: 'xypemyca@mailinator.com',
                    //     liquidationNotificationEmail: 'quqiwaguny@mailinator.com',
                    //     investmentWalletId: 'Adipisci iure eiusmo',
                    //     payoutWalletId: 'Ullamco voluptatem',
                    //     isPayoutAutomated: true,
                    //     fundingSourceTerminal: 'Veniam enim corrupt',
                    //     liquidationPenalty: 95,
                    //     isInvestmentAutomated: false,
                    //     isRolloverAutomated: false,
                    //     isAllPayoutSuspended: false,
                    //     isAllRolloverSuspended: true,
                    //     tagName: 'Petra Freeman',
                    //     currencyCode: 'NGN',
                    //     createdAt: '2023-02-07T13:55:51.263+00:00',
                    //     updatedAt: '2023-02-07T13:55:51.263+00:00',
                    //     status: 'Pending',
                    //     rfi: {
                    //       id: '00bc7e0e-d113-4bbc-8257-20549beb2f39',
                    //       code: 'ASD',
                    //       isVerified: true,
                    //       name: 'Adisababaio inc.',
                    //       registrationNumberType: 'CAC',
                    //       registrationNumber: '09876543',
                    //       memorandomOfAssociationUrl: 'memorandom.pdf',
                    //       email: 'business@gmail.com',
                    //       street: 'joceyB, Mokola',
                    //       city: 'ibadan',
                    //       state: 'Oyo',
                    //       country: 'Nigeria',
                    //       createdBy: '08102872652',
                    //       isDeleted: false,
                    //       createdAt: '2023-01-12T14:56:25.508+00:00',
                    //       updatedAt: '2023-01-12T15:17:44.067+00:00',
                    //       onboardingState: 'Go Live',
                    //       verificationStatus: 'VERIFIED',
                    //       isUpdateRequired: false,
                    //       isOnboardingMeetingHeld: true,
                    //       isRealmCreated: true,
                    //       isRootUserCreated: true,
                    //       status: 'Active',
                    //       contactPersonEmail: 'oremei.akande@gmail.com',
                    //       contactPersonFirstname: 'ade',
                    //       contactPersonSurname: 'adejuwon',
                    //       isContactPersonEmailVerified: true,
                    //       isRootUserEmailVerified: false,
                    //       realm: 'abds',
                    //       rfiOnboardingStep: null,
                    //       isRootUserRequested: false,
                    //       rootUserRequestedAt: null
                    //     },
                    //     bundle: {
                    //       id: '0d8a074e-a1e0-47c4-badb-1940c3b50669',
                    //       name: 'Mobile Banking',
                    //       label: 'Mobile Banking',
                    //       description: 'Manage all banking operations ranging from customers deposits, withdrawals, payments, complaints and accounts discrepancies resolution.',
                    //       thumbnailUrl: 'fe43b932-6578-4f06-8f89-be9860d8bb8c.jpg',
                    //       isActive: true,
                    //       createdAt: '2022-11-28T15:39:35.444+00:00',
                    //       updatedAt: '2022-11-28T15:39:35.444+00:00'
                    //     },
                    //     product: {
                    //       id: '8efad311-ea14-400e-8a2b-6059e2716947',
                    //       name: 'Investment',
                    //       label: 'Investment',
                    //       description: 'Introduce investment to your customers.',
                    //       thumbnailUrl: 'fe43b932-6578-4f06-8f89-be9860d8bb8c.jpg',
                    //       isActive: true,
                    //       createdAt: '2022-11-28T15:39:35.595+00:00',
                    //       updatedAt: '2022-11-28T15:39:35.595+00:00'
                    //     }
                    //   }
                    // }

                    let { investment } = content;
                    let { rfiId, initiationNotificationEmail, activationNotificationEmail, maturityNotificationEmail,
                        payoutNotificationEmail, rolloverNotificationEmail, liquidationNotificationEmail, investmentWalletId, payoutWalletId,
                        isPayoutAutomated, fundingSourceTerminal, liquidationPenalty, isInvestmentAutomated, isRolloverAutomated, isAllPayoutSuspended,
                        isAllRolloverSuspended, tagName, currencyCode, status, rfi, } = investment;
                    let { code, name, email, street, city, state, country } = rfi;
                    debugger
                    console.log("fields line 104 =====", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
                    console.log("content line 105 ===== ", name, email, code, status,)
                    // Check if the record is existing

                    const rfiRecordsService = new RfiRecordsServices();
                    const settingsService = new SettingServices();
                    let externalRfiRecordId = rfiId;
                    let rfiCode = code;
                    let rfiName = name;
                    let phone = investment.phone ? investment.phone : `${rfiName} phone was not provided`;
                    let imageUrl = investment.imageUrl ? investment.imageUrl : `http://www.${rfiName}.no_image_provided.com`;
                    let website = investment.website ? investment.website : `http://www.${rfiName}.no_website_provided.com`;
                    let phone2 = investment.phone2 ? investment.phone2 : `${rfiName} phone2 was not provided`;
                    let slogan = investment.slogan ? investment.slogan : `${rfiName} slogan was not provided`;
                    const address = `${street}, ${city}, ${state}, ${country}`;
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
                        console.log("payload line 140 ===== ", payload)
                        let rfiNameExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiName(payload.rfiName);
                        if (rfiNameExist) {
                            console.log('Consumer cancelled by server, line 144 =====');
                            console.log(`rfiName ${payload.rfiName} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`rfiName ${payload.rfiName} already exist`);
                        }

                        let rfiCodeExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(payload.rfiCode);
                        if (rfiCodeExist) {
                            console.log('Consumer cancelled by server, line 150 =====');
                            console.log(`rfiCode ${payload.rfiCode} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`rfiCode ${payload.rfiCode} already exist`);
                        }

                        let phoneExist = await rfiRecordsService.getRfiRecordByRfiRecordPhone(payload.phone);
                        if (phoneExist && phoneExist.phone != `${payload.rfiName} phone was not provided`) {
                            console.log('Consumer cancelled by server, line 157 =====');
                            console.log(`phone number ${payload.phone} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`phone number ${payload.phone} already exist`);
                        }

                        let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2(payload.phone2);
                        if (phone2Exist && phone2Exist.phone2 != `${payload.rfiName} phone2 was not provided`) {
                            console.log('Consumer cancelled by server, line 164 =====');
                            console.log(`phone2 ${payload.phone2} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`phone2 ${payload.phone2} already exist`);
                        }

                        let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmail(payload.email);
                        if (emailExist) {
                            console.log('Consumer cancelled by server, line 171 =====');
                            console.log(`email ${payload.email} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`email ${payload.email} already exist`);
                        }

                        let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsite(payload.website);
                        if (websiteExist && websiteExist.website != `http://www.${payload.rfiName}.no_website_provided.com`) {
                            console.log('Consumer cancelled by server, line 178 =====');
                            console.log(`website ${payload.website} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`website ${payload.website} already exist`);
                        }

                        let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSlogan(payload.slogan);
                        if (sloganExist && sloganExist.slogan != `${payload.rfiName} slogan was not provided`) {
                            console.log('Consumer cancelled by server, line 185 =====');
                            console.log(`slogan ${payload.slogan} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`slogan ${payload.slogan} already exist`);
                        }
                        // debugger
                        rfiRecord = await rfiRecordsService.createRfiRecord(payload);
                        debugger
                        if (!rfiRecord) {
                            console.log('Consumer cancelled by server, no RFI Record was created, line 208 =====');
                            throw Error(rfiRecord);
                        }
                        // Create or update setting
                        let {
                            rfiName,
                            rfiCode,
                            email,
                            imageUrl,
                        } = rfiRecord

                        let rfiImageUrl = imageUrl;
                        //@ts-ignore
                        currencyCode = currencyCode ? currencyCode : "NGN";
                        //@ts-ignore
                        isPayoutAutomated = isPayoutAutomated ? isPayoutAutomated : true;
                        //@ts-ignore
                        fundingSourceTerminal = fundingSourceTerminal ? fundingSourceTerminal : "Sigma Octantis";
                        //@ts-ignore
                        investmentWalletId = investmentWalletId ? investmentWalletId : "not yet provided";
                        //@ts-ignore
                        payoutWalletId = payoutWalletId ? payoutWalletId : "not yet provided";
                        //@ts-ignore
                        isInvestmentAutomated = isInvestmentAutomated ? isInvestmentAutomated : true;
                        //@ts-ignore
                        isRolloverAutomated = isRolloverAutomated ? isRolloverAutomated : true;
                        //@ts-ignore
                        tagName = tagName ? tagName : "default setting";
                        //@ts-ignore
                        initiationNotificationEmail = initiationNotificationEmail ? initiationNotificationEmail : email;
                        //@ts-ignore
                        activationNotificationEmail = activationNotificationEmail ? activationNotificationEmail : email;
                        //@ts-ignore
                        maturityNotificationEmail = maturityNotificationEmail ? maturityNotificationEmail : email;
                        //@ts-ignore
                        payoutNotificationEmail = payoutNotificationEmail ? payoutNotificationEmail : email;
                        //@ts-ignore
                        rolloverNotificationEmail = rolloverNotificationEmail ? rolloverNotificationEmail : email;
                        //@ts-ignore
                        liquidationNotificationEmail = liquidationNotificationEmail ? liquidationNotificationEmail : email;
                        //@ts-ignore
                        isAllPayoutSuspended = isAllPayoutSuspended ? isAllPayoutSuspended : false;
                        //@ts-ignore
                        isAllRolloverSuspended = isAllRolloverSuspended ? isAllRolloverSuspended : false;
                        //@ts-ignore
                        liquidationPenalty = liquidationPenalty ? liquidationPenalty : 25;

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
                        console.log("New RFI record created successfully line 285 ===== ")
                    } else {
                        console.log("payload for existing RFI record line 287 ===== ", payload)
                        if (payload.rfiName) {
                            let rfiNameExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiNameAndWhereRfiCodeIsNotThis(payload.rfiName, payload.rfiCode);
                            if (rfiNameExist) {
                                console.log('Consumer cancelled by server, line 290 =====');
                                console.log(`rfiName ${payload.rfiName} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`rfiName ${payload.rfiName} already exist`);
                            }
                        }
                        if (payload.rfiCode) {
                            let rfiCodeExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiCodeAndWhereRfiNameIsNotThis(payload.rfiCode, payload.rfiName);
                            if (rfiCodeExist) {
                                console.log('Consumer cancelled by server, line 299 =====');
                                console.log(`rfiCode ${payload.rfiCode} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`rfiCode ${payload.rfiCode} already exist`);
                            }
                        }

                        if (payload.phone) {
                            let phoneExist = await rfiRecordsService.getRfiRecordByRfiRecordPhoneAndWhereRfiCodeIsNotThis(payload.phone, payload.rfiCode);
                            if (phoneExist && phoneExist.phone != `${payload.rfiName} phone was not provided`) {
                                console.log('Consumer cancelled by server, line 308 =====');
                                console.log(`phone number ${payload.phone} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`phone number ${payload.phone} already exist`);
                            }
                        }

                        if (payload.phone2) {
                            let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2AndWhereRfiCodeIsNotThis(payload.phone2, payload.rfiCode);
                            if (phone2Exist && phone2Exist.phone2 != `${payload.rfiName} phone2 was not provided`) {
                                console.log('Consumer cancelled by server, line 317 =====');
                                console.log(`phone2 ${payload.phone2} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`phone2 ${payload.phone2} already exist`);
                            }
                        }

                        if (payload.email) {
                            let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmailAndWhereRfiCodeIsNotThis(payload.email, payload.rfiCode);
                            if (emailExist) {
                                console.log('Consumer cancelled by server, line 326 =====');
                                console.log(`email ${payload.email} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`email ${payload.email} already exist`);
                            }

                        }

                        if (payload.website) {
                            let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsiteAndWhereRfiCodeIsNotThis(payload.website, payload.rfiCode);
                            if (websiteExist && websiteExist.website != "http://www.no_website_provided.com") {
                                console.log('Consumer cancelled by server, line 335 =====');
                                console.log(`website ${payload.website} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`website ${payload.website} already exist`);
                            }
                        }

                        if (payload.slogan) {
                            let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSloganAndWhereRfiCodeIsNotThis(payload.slogan, payload.rfiCode);
                            if (sloganExist && sloganExist.slogan != "slogan was not provided") {
                                console.log('Consumer cancelled by server, line 344 =====');
                                console.log(`slogan ${payload.slogan} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`slogan ${payload.slogan} already exist`);
                            }
                        }

                        // Update the Rfi record
                        rfiRecord = await rfiRecordsService.updateRfiRecord(rfiRecord, payload);
                        if (!rfiRecord) {
                            console.log('Consumer cancelled by server, line 352 =====');
                            // @ts-ignore
                            throw Error(rfiRecord);
                        }
                        // Create or update setting
                        // debugger
                        //@ts-ignore
                        let { rfiName, rfiCode, email, imageUrl, } = rfiRecord
                        // debugger
                        let rfiImageUrl = imageUrl;
                        //@ts-ignore
                        currencyCode = currencyCode ? currencyCode : "NGN";
                        //@ts-ignore
                        isPayoutAutomated = isPayoutAutomated ? isPayoutAutomated : true;
                        //@ts-ignore
                        fundingSourceTerminal = fundingSourceTerminal ? fundingSourceTerminal : "Sigma Octantis";
                        //@ts-ignore
                        investmentWalletId = investmentWalletId ? investmentWalletId : "not yet provided";
                        //@ts-ignore
                        payoutWalletId = payoutWalletId ? payoutWalletId : "not yet provided";
                        //@ts-ignore
                        isInvestmentAutomated = isInvestmentAutomated ? isInvestmentAutomated : true;
                        //@ts-ignore
                        isRolloverAutomated = isRolloverAutomated ? isRolloverAutomated : true;
                        //@ts-ignore
                        tagName = tagName ? tagName : "default setting";
                        //@ts-ignore
                        initiationNotificationEmail = initiationNotificationEmail ? initiationNotificationEmail : email;
                        //@ts-ignore
                        activationNotificationEmail = activationNotificationEmail ? activationNotificationEmail : email;
                        //@ts-ignore
                        maturityNotificationEmail = maturityNotificationEmail ? maturityNotificationEmail : email;
                        //@ts-ignore
                        payoutNotificationEmail = payoutNotificationEmail ? payoutNotificationEmail : email;
                        //@ts-ignore
                        rolloverNotificationEmail = rolloverNotificationEmail ? rolloverNotificationEmail : email;
                        //@ts-ignore
                        liquidationNotificationEmail = liquidationNotificationEmail ? liquidationNotificationEmail : email;
                        //@ts-ignore
                        isAllPayoutSuspended = isAllPayoutSuspended ? isAllPayoutSuspended : false;
                        //@ts-ignore
                        isAllRolloverSuspended = isAllRolloverSuspended ? isAllRolloverSuspended : false;
                        //@ts-ignore
                        liquidationPenalty = liquidationPenalty ? liquidationPenalty : 25;

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
                        console.log("Existing RFI record updated successfully line 448 ===== ")
                    }
                    // debugger
                    ch1.ack(msg);
                } catch (error) {
                    console.log('Consumer cancelled by server, line 452 =====');
                    console.log(error);
                    ch1.nack(msg, false, false); // requeue set to false
                    // ch1.reject(msg, false, false); // requeue set to false
                }
            } else {
                console.log('Consumer cancelled by server, line 457 =====');
                throw Error();
            }
        });

        //     // Sender
        //     // const ch2 = await conn.createChannel();

        //     // setInterval(() => {
        //     //     ch2.sendToQueue(queue, Buffer.from('something to do'));
        //     // }, 1000);
    } catch (error) {
        console.log('Consumer cancelled by server, line 469 =====');
        console.log(error);
    }
})();


