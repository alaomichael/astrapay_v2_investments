import RfiRecordsServices from "App/Services/RfiRecordsServices";
import { RfiRecordType } from "App/Services/types/rfirecord_type";
import SettingServices from "App/Services/SettingsServices";
import { SettingType } from "App/Services/types/setting_type";
import PaymentServices from "App/Services/PaymentsServices";
import InvestmentsService from "App/Services/InvestmentsServices";


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
const INVESTMENT_RABBITMQ_QUEUE_NAME = Env.get("INVESTMENT_RABBITMQ_QUEUE_NAME");
const RABBITMQ_ONBOARDING_ROUTING_KEY = Env.get("RABBITMQ_ONBOARDING_ROUTING_KEY");
const INVESTMENT_RABBITMQ_CONFIG_QUEUE_NAME = Env.get("INVESTMENT_RABBITMQ_CONFIG_QUEUE_NAME");
const INVESTMENT_RABBITMQ_CONFIG_ROUTING_KEY = Env.get("INVESTMENT_RABBITMQ_CONFIG_ROUTING_KEY");
const INVESTMENT_RABBITMQ_TRANSACTION_QUEUE_NAME = Env.get("INVESTMENT_RABBITMQ_TRANSACTION_QUEUE_NAME");
const INVESTMENT_RABBITMQ_TRANSACTION_ROUTING_KEY = Env.get("INVESTMENT_RABBITMQ_TRANSACTION_ROUTING_KEY");

const amqplib = require('amqplib');

// const rabbitMQService = 
(async () => {
    try {
        const queue = INVESTMENT_RABBITMQ_QUEUE_NAME;//'tasks';
        const configQueue = INVESTMENT_RABBITMQ_CONFIG_QUEUE_NAME;
        const transactionQueue = INVESTMENT_RABBITMQ_TRANSACTION_QUEUE_NAME;
        // const conn = await amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); //amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}` || 'amqp://localhost')
        // debugger
        // debugger
        const conn = await amqplib.connect(RABBITMQ_HOSTNAME);// amqplib.connect(`amqp://${RABBITMQ_HOSTNAME}`); 
        // console.log("RabbitMQ Connected",conn)
        const investmentsService = new InvestmentsService();
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

                    //                    {"rfi":{
                    //     "id": "069ee6a3-13e7-4b56-91fb-5fb109fefddf",
                    //     "name": "company namekujjkkkk",
                    //     "email": "business@gmail.com",
                    //     "code": "code",
                    //     "createdBy": "08102872652",
                    //     "status": "Onboarding",
                    //     "address": {
                    //         "street": "joceyB, Mokola",
                    //         "city": "ibadan",
                    //         "state": "Oyo",
                    //         "country": "Nigeria"
                    //     }}
                    // }

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
                            console.log('Consumer cancelled by server, line 252 =====');
                            // @ts-ignore
                            throw Error(rfiRecord);
                        }
                        console.log("Existing RFI record updated successfully line 256 ===== ")
                    }
                    // debugger
                    ch1.ack(msg);
                } catch (error) {
                    console.log('Consumer cancelled by server, line 261 =====');
                    console.log(error);
                    ch1.nack(msg, false, false); // requeue set to false
                    // ch1.reject(msg, false, false); // requeue set to false
                }
            } else {
                console.log('Consumer cancelled by server, line 267 =====');
                throw Error();
            }
        });

        const ch2 = await conn.createChannel();
        await ch2.assertQueue(configQueue);
        await ch2.bindQueue(configQueue, RABBITMQ_EXCHANGE_NAME, INVESTMENT_RABBITMQ_CONFIG_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
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

        const ch3 = await conn.createChannel();
        await ch3.assertQueue(transactionQueue);
        await ch3.bindQueue(transactionQueue, RABBITMQ_EXCHANGE_NAME, INVESTMENT_RABBITMQ_TRANSACTION_ROUTING_KEY); //bindQueue(queue, RABBITMQ_EXCHANGE_NAME, severity);
        await ch3.checkQueue(transactionQueue);
        await ch3.get(transactionQueue);
        // console.log("channel details: ", ch3);
        // debugger
        // Listener
        await ch3.consume(transactionQueue, async (msg) => {
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
                    // console.log('Received message converted to string, line 459 =========:', content);
                    content = JSON.parse(content);
                    // console.log('Received the fields message, line 461 ======:', fields);
                    // console.log('Received message converted to json, line 462 =========:', content);
                    // debugger
                    let {
                        consumerTag,//: 'amq.ctag-ihMXzcY0EI6bWrseyN52Hg',
                        deliveryTag,//: 1,
                        redelivered,//: true,
                        exchange,//: 'config',
                        routingKey,//: 'investment.configuration'
                    } = fields;
                    // {
                    //     "id": "defddb06-c27d-4255-aa6a-2d483ed8de40",
                    //     "correlationId": "68678989IO09",
                    //     "transactionId": "16759132994525197",
                    //     "customerReference": "16708830553194Kt90",
                    //     "batchId": "aee5adf2-d32c-44a1-b3cd-9be941c7b48b",
                    //     "indexInBatch": 0,
                    //     "performedBy": "485885869",
                    //     "description": " NGN 38 investment for Tomiwa Folalu. ",
                    //     "product": "Funds transfer",
                    //     "subproduct": "mobilebanking.fundstransfer.wallettowallet",
                    //     "process": "WALLET_TO_WALLET_TRANSFER",
                    //     "senderFirstName": "Tomiwa Folalu",
                    //     "senderOtherName": "Tomiwa Folalu",
                    //     "senderAccountNumber": "12345678",
                    //     "senderAccountName": "Tomiwa Folalu",
                    //     "senderPhoneNumber": "2348161885549",
                    //     "senderEmail": "tomiczilla@gmail.com",
                    //     "senderBankName": "Sigma Octantis",
                    //     "senderBankCode": "s8",
                    //     "senderBankAlias": "s8",
                    //     "senderBankCategory": "SIGMA_OCTANTIS",
                    //     "beneficiaryFirstName": "Sigma Octantis",
                    //     "beneficiaryOtherName": "Sigma Octantis",
                    //     "beneficiaryAccountNumber": "65656565",
                    //     "beneficiaryAccountName": "Sigma Octantis",
                    //     "beneficiaryPhoneNumber": "07033680599",
                    //     "beneficiaryEmail": "devmichaelalao@gmail.com",
                    //     "beneficiaryBankName": "Sigma Octantis",
                    //     "beneficiaryBankCode": "s8",
                    //     "beneficiaryBankAlias": "s8",
                    //     "beneficiaryBankCategory": "SIGMA_OCTANTIS",
                    //     "billerId": null,
                    //     "paymentCode": null,
                    //     "facilitatorName": "Jane Wood",
                    //     "facilitatorId": "485885869",
                    //     "facilitatorPhoneNumber": "2348079859043",
                    //     "facilitatorEmail": "test@email.com",
                    //     "amount": 3800,
                    //     "currency": "NGN",
                    //     "serviceCharge": 3000,
                    //     "serviceChargeWalletHolderId": "123456",
                    //     "serviceChargeWalletHolderName": "SigmaOctantis",
                    //     "serviceChargeWalletIdentifier": "1234567",
                    //     "serviceChargeWalletName": "Mock Service Charge Wallet",
                    //     "vat": 225,
                    //     "vatWalletHolderId": "123456",
                    //     "vatWalletHolderName": "SigmaOctantis",
                    //     "vatWalletIdentifier": "1234567",
                    //     "vatWalletName": "Mock vat Wallet",
                    //     "commissionWalletHolderId": "12345",
                    //     "commissionWalletHolderName": "SigmaOctantis",
                    //     "commissionWalletIdentifier": "1234567",
                    //     "commissionWalletName": "Mock commission Wallet",
                    //     "lng": "64532111",
                    //     "lat": "12234435",
                    //     "transactionStatus": "AWAITING_APPROVAL",
                    //     "screenStatus": "AWAITING_APPROVAL",
                    //     "createdAt": "2023-02-09T04:28:20.417098",
                    //     "updatedAt": "2023-02-09T04:28:20.417098",
                    //     "systemMetadata": null,
                    //     "customerMetadata": {
                    //         "cool": "cool"
                    //     },
                    //     "timeline": [
                    //         {
                    //             "id": "04bd6a4e-e2c3-40fd-819a-fb8ae93f03be",
                    //             "transactionId": "defddb06-c27d-4255-aa6a-2d483ed8de40",
                    //             "transactionStatus": "AWAITING_APPROVAL",
                    //             "createdAt": "2023-02-09T04:28:20.418097",
                    //             "updatedAt": "2023-02-09T04:28:20.418097",
                    //             "systemMetadata": null
                    //         }
                    //     ],
                    //     "commissions": [],
                    //     "clientApp": "OCTANTIS_MOBILE",
                    //     "userAgent": "PostmanRuntime/7.30.1",
                    //     "ffiCode": "s8",
                    //     "ffiName": "s8",
                    //     "ofiCode": "s8",
                    //     "ofiName": "s8",
                    //     "bfiCode": "s8",
                    //     "bfiName": "s8",
                    //     "notifiable": {
                    //         "id": "cb3dbc59-cf32-49ed-b647-d17c70e6dfa2",
                    //         "createdAt": "2023-02-09T04:28:20.417098",
                    //         "updatedAt": "2023-02-09T04:28:20.417098",
                    //         "notifications": [
                    //             {
                    //                 "id": "8470432e-25c3-4882-8534-a30c7da72949",
                    //                 "notifiableId": "cb3dbc59-cf32-49ed-b647-d17c70e6dfa2",
                    //                 "channel": "SMS",
                    //                 "handle": "07033680599",
                    //                 "recipientName": "Sigma Octantis",
                    //                 "walletToBillId": "12345678",
                    //                 "walletToBillName": "Mock Wallet",
                    //                 "eventType": "TRANSACTION_SUCCESS",
                    //                 "createdAt": "2023-02-09T04:28:20.417098",
                    //                 "updatedAt": "2023-02-09T04:28:20.417098"
                    //             }
                    //         ]
                    //     },
                    //     "authorizable": {
                    //         "id": "65cad0cd-1df2-4d3e-9c3b-7e985caaa40a",
                    //         "createdAt": "2023-02-09T04:28:20.296422",
                    //         "updatedAt": "2023-02-09T04:28:20.296422",
                    //         "authorizations": [
                    //             {
                    //                 "id": "e881f905-7f5a-46b6-903f-ed67110d8b44",
                    //                 "authorizableId": "65cad0cd-1df2-4d3e-9c3b-7e985caaa40a",
                    //                 "requiredAuthorityId": "12345",
                    //                 "requiredAuthorityName": "Mock authority",
                    //                 "authorityId": null,
                    //                 "authorityName": null,
                    //                 "authorityActionAt": null,
                    //                 "authorityAction": null,
                    //                 "createdAt": "2023-02-09T04:28:20.412112",
                    //                 "updatedAt": "2023-02-09T04:28:20.412112"
                    //             }
                    //         ]
                    //     },
                    //     "tenant": null,
                    //     "senderWalletIdentifier": "12345678",
                    //     "senderWalletName": "Tomiwa Folalu",
                    //     "senderWalletHolderId": "5886990",
                    //     "senderWalletHolderName": "MockWalletHolder",
                    //     "beneficiaryWalletIdentifier": "65656565",
                    //     "beneficiaryWalletName": "Sigma Octantis",
                    //     "beneficiaryWalletHolderId": "5886990",
                    //     "beneficiaryWalletHolderName": "MockWalletHolder"
                    // }
                    let { amount, customerReference, senderAccountNumber, senderAccountName, senderPhoneNumber, senderEmail, senderBankCode, senderBankName,
                        currency, transactionStatus, screenStatus,
                    } = content;
                    console.log("fields line 606", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
                    // let { code, name, email, street, city, state, country } = rfi;
                    // debugger
                    console.log("Content of message @ start/rabbit.ts line 608 =====", amount, customerReference, senderAccountNumber, senderAccountName, senderPhoneNumber, senderEmail, senderBankCode, senderBankName,
                        currency, transactionStatus, screenStatus,)
                    // debugger
                    // console.log("content line 615 ===== ", name, email, code, status,)
                    // Check if the record is existing
                    // const rfiRecordsService = new RfiRecordsServices();
                    // const settingsService = new SettingServices();
                    const paymentsService = new PaymentServices();
                    // debugger
                    // let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
                    if (screenStatus === "FAILED") {
                        console.log("screenStatus line 623 ===== ", screenStatus)
                        console.log(`Consumer cancelled by server, Payment status is ${screenStatus}, line 624 =====`);
                        // Send message to customer / admin
                        // Try to debit the use again
                        throw Error();
                    } else if (screenStatus === "SUCCESSFUL" || screenStatus === "APPROVED") {
                        // console.log("payment details @ start/rabbit.ts; line 629 ===== ", content)
                        // Create or update investment payment status
                        // debugger
                        // check if investment record exist and update changed value
                        const investmentDebitWallet = await investmentsService.getInvestmentByInvestmentRequestReference(customerReference);
                        const investmentCreditWalletWithPrincipal = await investmentsService.getInvestmentByPrincipalPayoutRequestReference(customerReference);
                        const investmentCreditWalletWithInterest = await investmentsService.getInvestmentByInterestPayoutRequestReference(customerReference);
                        if (!investmentDebitWallet && !investmentCreditWalletWithPrincipal && !investmentCreditWalletWithInterest) throw Error(`The investment record with InvestmentRequestReference : ${customerReference} does not exist , please select another one and try again.`);

                        if (investmentDebitWallet) {
                            let record = investmentDebitWallet;
                            const amountPaid = Number(amount / 100);// Convert Kobo to Naira
                            if (record.amount > amountPaid) throw Error(`The amount paid :${currency} ${amountPaid} is less than the amount :${currency} ${record.amount} to be investmented, please check and try again.`);
                            if (record.status == "active") {
                                debugger

                                console.log(`@start/rabbit.ts : The Investment record selected is currently ${record.status} , please check and try again.`);
                                // ch3.reject(msg, false, false); // requeue set to false
                                ch3.ack(msg);
                                // throw Error(`The investment record selected is currently ${record.status} , please check and try again.`);
                            } else {
                                let selectedInvestmentForPaymentUpdate = await paymentsService.processInvestmentTransaction(content)
                                if (!selectedInvestmentForPaymentUpdate) {
                                    console.log("Existing Investment record, investment payment status was not updated successfully line 652 ===== ")
                                } else {
                                    console.log("selectedInvestmentForPaymentUpdate details line 654 ===== ", selectedInvestmentForPaymentUpdate)
                                    console.log("Existing Investment record, investment payment status updated successfully line 655 ===== ")
                                    debugger
                                    ch3.ack(msg);
                                }
                            }
                        } else if (investmentCreditWalletWithPrincipal) {
                            let record = investmentCreditWalletWithPrincipal;
                            // const amountPaid = Number(amount / 100);// Convert Kobo to Naira
                            // if (record.amount > amountPaid) throw Error(`The amount paid :${currency} ${amountPaid} is less than the amount :${currency} ${record.amount} to be investmented, please check and try again.`);
                            if (record.status == "completed") {
                                debugger

                                console.log(`@start/rabbit.ts : The Investment record selected is currently ${record.status} , please check and try again.`);
                                // ch3.reject(msg, false, false); // requeue set to false
                                ch3.ack(msg);
                                // throw Error(`The investment record selected is currently ${record.status} , please check and try again.`);
                            } else {
                                let selectedInvestmentForPaymentUpdate = await paymentsService.updatePrincipalPayout(content)
                                if (!selectedInvestmentForPaymentUpdate) {
                                    console.log("Existing Investment record, investment payment status was not updated successfully line 674 ===== ")
                                } else {
                                    console.log("selectedInvestmentForPaymentUpdate details line 676 ===== ", selectedInvestmentForPaymentUpdate)
                                    console.log("Existing Investment record, investment payment status updated successfully line 677 ===== ")
                                    debugger
                                    ch3.ack(msg);
                                }
                            }
                        } else if (investmentCreditWalletWithInterest) {
                            let record = investmentCreditWalletWithInterest;
                            // const amountPaid = Number(amount / 100);// Convert Kobo to Naira
                            // if (record.amount > amountPaid) throw Error(`The amount paid :${currency} ${amountPaid} is less than the amount :${currency} ${record.amount} to be investmented, please check and try again.`);
                            if (record.status == "completed") {
                                debugger

                                console.log(`@start/rabbit.ts : The Investment record selected is currently ${record.status} , please check and try again.`);
                                // ch3.reject(msg, false, false); // requeue set to false
                                ch3.ack(msg);
                                // throw Error(`The investment record selected is currently ${record.status} , please check and try again.`);
                            } else {
                                let selectedInvestmentForPaymentUpdate = await paymentsService.updateInterestPayout(content)
                                if (!selectedInvestmentForPaymentUpdate) {
                                    console.log("Existing Investment record, investment payment status was not updated successfully line 696 ===== ")
                                } else {
                                    console.log("selectedInvestmentForPaymentUpdate details line 698 ===== ", selectedInvestmentForPaymentUpdate)
                                    console.log("Existing Investment record, investment payment status updated successfully line 699 ===== ")
                                    debugger
                                    ch3.ack(msg);
                                }
                            }
                        }

                    }
                    // debugger
                    // ch3.ack(msg);
                } catch (error) {
                    console.log('Consumer cancelled by server @ start/rabbit.ts, line 710 =====');
                    console.log(error);
                    ch3.nack(msg, false, false); // requeue set to false
                    // ch3.reject(msg, false, false); // requeue set to false
                }
            } else {
                console.log('Consumer cancelled by server @ start/rabbit.ts, line 716 =====');
                throw Error();
            }
        });

        //     // Sender
        //     // const ch4 = await conn.createChannel();

        //     // setInterval(() => {
        //     //     ch4.sendToQueue(queue, Buffer.from('something to do'));
        //     // }, 1000);
    } catch (error) {
        console.log('Consumer cancelled by server @ start/rabbit.ts, line 728 ======');
        console.log(error);
    }
})();


