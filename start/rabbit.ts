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
const RABBITMQ_CONFIG_QUEUE_NAME = Env.get("RABBITMQ_CONFIG_QUEUE_NAME");
const RABBITMQ_ONBOARDING_ROUTING_KEY = Env.get("RABBITMQ_ONBOARDING_ROUTING_KEY");
const RABBITMQ_CONFIG_ROUTING_KEY = Env.get("RABBITMQ_CONFIG_ROUTING_KEY");

const amqplib = require('amqplib');

// const rabbitMQService = 
(async () => {
    try {
        const queue = RABBITMQ_QUEUE_NAME;//'tasks';
        const configQueue = RABBITMQ_CONFIG_QUEUE_NAME;
        const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); //amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}` || 'amqp://localhost');
        // debugger
        const ch1 = await conn.createChannel();
        await ch1.assertQueue(queue);
        await ch1.bindQueue(queue, RABBITMQ_EXCHANGE_NAME, RABBITMQ_ONBOARDING_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
        await ch1.checkQueue(queue);
        await ch1.get(queue);
        // console.log("channel details: ", ch1);
        // debugger
        // Listener
        await ch1.consume(queue, async (msg) => {
            if (msg !== null) {
                try {
                    // console.log('Received the whole message ======:', msg);
                    // console.log('Received the fields message ======:', msg.fields);
                    // console.log('Received message converted to string =========:', msg.content.toString());
                    // console.log('Received in json format ========:', msg.content);
                    let { fields, content } = msg;
                    content = content.toString();
                    // console.log('Received message converted to string, line 51 =========:', content);
                    content = JSON.parse(content);
                    console.log('Received message converted to json, line 53 =========:', content);
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

                    let { id, name, email, code, status, address, } = content.rfi;
                    console.log("fields line 76 =====", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
                    console.log("content line 77 ===== ", id, name, email, code, status, address)
                    // Check if the record is existing

                    const rfiRecordsService = new RfiRecordsServices();

                    let externalRfiRecordId = id;
                    let rfiCode = code;
                    let rfiName = name;
                    let phone = content.phone ? content.phone : `${rfiName} phone was not provided`; //directors[0].phoneNumber
                    let imageUrl = content.imageUrl ? content.imageUrl : `http://www.${rfiName}.no_image_provided.com`;
                    let website = content.website ? content.website : `http://www.${rfiName}.no_website_provided.com`;
                    let phone2 = content.phone2 ? content.phone2 : `${rfiName} phone2 was not provided`;
                    let slogan = content.slogan ? content.slogan : `${rfiName} slogan was not provided`;
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
                    // debugger
                    let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
                    debugger
                    if (!rfiRecord) {
                        console.log("payload line 106 ===== ", payload)
                        let rfiNameExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiName(payload.rfiName);
                        if (rfiNameExist) {
                            console.log('Consumer cancelled by server, line 109 =====');
                            console.log(`rfiName ${payload.rfiName} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`rfiName ${payload.rfiName} already exist`);
                        }

                        let rfiCodeExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(payload.rfiCode);
                        if (rfiCodeExist) {
                            console.log('Consumer cancelled by server, line 118 =====');
                            console.log(`rfiCode ${payload.rfiCode} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`rfiCode ${payload.rfiCode} already exist`);
                        }

                        let phoneExist = await rfiRecordsService.getRfiRecordByRfiRecordPhone(payload.phone);
                        if (phoneExist && phoneExist.phone != `${payload.rfiName} phone was not provided`) {
                            console.log('Consumer cancelled by server, line 127 =====');
                            console.log(`phone number ${payload.phone} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`phone number ${payload.phone} already exist`);
                        }

                        let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2(payload.phone2);
                        if (phone2Exist && phone2Exist.phone2 != `${payload.rfiName} phone2 was not provided`) {
                            console.log('Consumer cancelled by server, line 135 =====');
                            console.log(`phone2 ${payload.phone2} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`phone2 ${payload.phone2} already exist`);
                        }

                        let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmail(payload.email);
                        if (emailExist) {
                            console.log('Consumer cancelled by server, line 144 =====');
                            console.log(`email ${payload.email} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`email ${payload.email} already exist`);
                        }

                        let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsite(payload.website);
                        if (websiteExist && websiteExist.website != `http://www.${payload.rfiName}.no_website_provided.com`) {
                            console.log('Consumer cancelled by server, line 153 =====');
                            console.log(`website ${payload.website} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`website ${payload.website} already exist`);
                        }

                        let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSlogan(payload.slogan);
                        if (sloganExist && sloganExist.slogan != `${payload.rfiName} slogan was not provided`) {
                            console.log('Consumer cancelled by server, line 162 =====');
                            console.log(`slogan ${payload.slogan} already exist`);
                            debugger
                            //@ts-ignore
                            throw Error(`slogan ${payload.slogan} already exist`);
                        }
                        // debugger
                        rfiRecord = await rfiRecordsService.createRfiRecord(payload);
                        debugger
                        if (!rfiRecord) {
                            console.log('Consumer cancelled by server, line 172 =====');
                            throw Error(rfiRecord);
                        }
                        console.log("New RFI record created successfully line 175 ===== ")
                    } else {
                        console.log("payload for existing RFI record line 177 ===== ", payload)
                        if (payload.rfiName) {
                            let rfiNameExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiNameAndWhereRfiCodeIsNotThis(payload.rfiName, payload.rfiCode);
                            if (rfiNameExist) {
                                console.log('Consumer cancelled by server, line 181 =====');
                                console.log(`rfiName ${payload.rfiName} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`rfiName ${payload.rfiName} already exist`);
                            }
                        }
                        if (payload.rfiCode) {
                            let rfiCodeExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiCodeAndWhereRfiNameIsNotThis(payload.rfiCode, payload.rfiName);
                            if (rfiCodeExist) {
                                console.log('Consumer cancelled by server, line 191 =====');
                                console.log(`rfiCode ${payload.rfiCode} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`rfiCode ${payload.rfiCode} already exist`);
                            }
                        }


                        if (payload.phone) {
                            let phoneExist = await rfiRecordsService.getRfiRecordByRfiRecordPhoneAndWhereRfiCodeIsNotThis(payload.phone, payload.rfiCode);
                            if (phoneExist && phoneExist.phone != `${payload.rfiName} phone was not provided`) {
                                console.log('Consumer cancelled by server, line 203 =====');
                                console.log(`phone number ${payload.phone} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`phone number ${payload.phone} already exist`);
                            }
                        }


                        if (payload.phone2) {
                            let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2AndWhereRfiCodeIsNotThis(payload.phone2, payload.rfiCode);
                            if (phone2Exist && phone2Exist.phone2 != `${payload.rfiName} phone2 was not provided`) {
                                console.log('Consumer cancelled by server, line 215 =====');
                                console.log(`phone2 ${payload.phone2} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`phone2 ${payload.phone2} already exist`);
                            }
                        }


                        if (payload.email) {
                            let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmailAndWhereRfiCodeIsNotThis(payload.email, payload.rfiCode);
                            if (emailExist) {
                                console.log('Consumer cancelled by server, line 227 =====');
                                console.log(`email ${payload.email} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`email ${payload.email} already exist`);
                            }

                        }

                        if (payload.website) {
                            let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsiteAndWhereRfiCodeIsNotThis(payload.website, payload.rfiCode);
                            if (websiteExist && websiteExist.website != `http://www.${payload.rfiName}.no_website_provided.com`) {
                                console.log('Consumer cancelled by server, line 239 =====');
                                console.log(`website ${payload.website} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`website ${payload.website} already exist`);
                            }
                        }


                        if (payload.slogan) {
                            let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSloganAndWhereRfiCodeIsNotThis(payload.slogan, payload.rfiCode);
                            if (sloganExist && sloganExist.slogan != `${payload.rfiName} slogan was not provided`) {
                                console.log('Consumer cancelled by server, line 251 =====');
                                console.log(`slogan ${payload.slogan} already exist`);
                                debugger
                                //@ts-ignore
                                throw Error(`slogan ${payload.slogan} already exist`);
                            }
                        }


                        // Update the Rfi record
                        rfiRecord = await rfiRecordsService.updateRfiRecord(rfiRecord, payload);
                        if (!rfiRecord) {
                            console.log('Consumer cancelled by server, line 263 =====');
                            // @ts-ignore
                            throw Error(rfiRecord);
                        }
                        console.log("Existing RFI record updated successfully line 267 ===== ")
                    }
                    // debugger
                    ch1.ack(msg);
                } catch (error) {
                    console.log('Consumer cancelled by server, line 272 =====');
                    console.log(error);
                    ch1.nack(msg, false, false); // requeue set to false
                    // ch1.reject(msg, false, false); // requeue set to false
                }
            } else {
                console.log('Consumer cancelled by server, line 278 =====');
                throw Error();
            }
        });

        const ch2 = await conn.createChannel();
        await ch2.assertQueue(configQueue);
        await ch2.bindQueue(configQueue, RABBITMQ_EXCHANGE_NAME, RABBITMQ_CONFIG_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
        await ch2.checkQueue(configQueue);
        await ch2.get(configQueue);
        // console.log("channel details: ", ch2);
        // debugger
        // Listener
        await ch2.consume(configQueue, async (msg) => {
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
                    // console.log('Received message converted to string, line 303 =========:', content);
                    content = JSON.parse(content);
                    // console.log('Received the fields message, line 305 ======:', fields);
                    // console.log('Received message converted to json, line 306 =========:', content);
                    // debugger
                    let {
                        consumerTag,//: 'amq.ctag-ihMXzcY0EI6bWrseyN52Hg',
                        deliveryTag,//: 1,
                        redelivered,//: true,
                        exchange,//: 'config',
                        routingKey,//: 'investment.configuration'
                    } = fields;

                    let { investment } = content;
                    let { rfiId, initiationNotificationEmail, activationNotificationEmail, maturityNotificationEmail,
                        payoutNotificationEmail, rolloverNotificationEmail, liquidationNotificationEmail, investmentWalletId, payoutWalletId,
                        isPayoutAutomated, fundingSourceTerminal, liquidationPenalty, isInvestmentAutomated, isRolloverAutomated, isAllPayoutSuspended,
                        isAllRolloverSuspended, tagName, currencyCode, status, rfi, } = investment;
                    let { code, name, email, street, city, state, country } = rfi;
                    debugger
                    console.log("fields line 323 =====", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
                    console.log("content line 324 ===== ", name, email, code, status,)
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
                        console.log("payload line 352 ===== ", payload)
                        console.log('Consumer cancelled by server, RFI Record does not exist, line 353 =====');
                        throw Error();

                    } else {
                        console.log("payload for existing RFI record line 357 ===== ", payload)
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
                            console.log("Existing RFI record, investment config setting created successfully line 424 ===== ")
                        } else {
                            await settingsService.updateSetting(selectedSetting, payload2);
                            console.log("Existing RFI record, investment config setting updated successfully line 427 ===== ")
                        }
                        // console.log("Existing RFI record, investment config updated successfully line 431 ===== ")
                    }
                    // debugger
                    ch2.ack(msg);
                } catch (error) {
                    console.log('Consumer cancelled by server, line 436 =====');
                    console.log(error);
                    ch2.nack(msg, false, false); // requeue set to false
                    // ch2.reject(msg, false, false); // requeue set to false
                }
            } else {
                console.log('Consumer cancelled by server, line 442 =====');
                throw Error();
            }
        });

        //     // Sender
        //     // const ch2 = await conn.createChannel();

        //     // setInterval(() => {
        //     //     ch2.sendToQueue(queue, Buffer.from('something to do'));
        //     // }, 1000);
    } catch (error) {
        console.log('Consumer cancelled by server, line 454 =====');
        console.log(error);
    }
})();


