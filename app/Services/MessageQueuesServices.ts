'use strict'

import Database from '@ioc:Adonis/Lucid/Database'
import SettingServices from "App/Services/SettingsServices";
import { SettingType } from './types/setting_type';
import RfiRecordsServices from './RfiRecordsServices';
import { RfiRecordType } from './types/rfirecord_type';
// import { parse } from 'url'
Database.query()

export default class MessageQueuesServices {
    public async createRfiRecord(content: any): Promise<any> {
        try {
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
            const { rfi } = content;

            let { id, name, email, code, status, address, directors } = rfi;
            // console.log("fields line 16 =====", consumerTag, deliveryTag, redelivered, exchange, routingKey,)
            console.log("content line 17 ===== ", id, name, email, code, status, address, directors)
            // Check if the record is existing
            //TODO: Create MessageQueuesServices
            const rfiRecordsService = new RfiRecordsServices();

            let externalRfiRecordId = id || undefined;
            let rfiCode = code || undefined;
            let rfiName = name || undefined;
            // let phone = content.phone ? content.phone : `${rfiName} phone was not provided`; //directors[0].phoneNumber
            let phone = directors && directors[0] && directors[0].phoneNumber || `${rfiName} phone was not provided`;
            let addressString;
            if (address && address.street && address.city && address.state && address.country) {
                addressString = `${address.street}, ${address.city}, ${address.state}, ${address.country}`;
            } else {
                addressString = 'Address information is not complete'; // Provide a default message if any part of the address is not defined
            }
            let imageUrl = content.imageUrl ? content.imageUrl : `http://www.${rfiName}.no_image_provided.com`;
            let website = content.website ? content.website : `http://www.${rfiName}.no_website_provided.com`;
            let phone2 = content.phone2 ? content.phone2 : `${rfiName} phone2 was not provided`;
            let slogan = content.slogan ? content.slogan : `${rfiName} slogan was not provided`;
            // address = `${address.street}, ${address.city}, ${address.state}, ${address.country}`;
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
                address: addressString,// address,
            }
            debugger
            let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
            debugger
            if (!rfiRecord) {
                // console.log("payload line 106 ===== ", payload)
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
                    // throw Error(`phone number ${payload.phone} already exist`);
                }

                let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2(payload.phone2);
                if (phone2Exist && phone2Exist.phone2 != `${payload.rfiName} phone2 was not provided`) {
                    console.log('Consumer cancelled by server, line 135 =====');
                    console.log(`phone2 ${payload.phone2} already exist`);
                    debugger
                    //@ts-ignore
                    // throw Error(`phone2 ${payload.phone2} already exist`);
                }

                let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmail(payload.email);
                if (emailExist) {
                    console.log('Consumer cancelled by server, line 144 =====');
                    console.log(`email ${payload.email} already exist`);
                    debugger
                    //@ts-ignore
                    // throw Error(`email ${payload.email} already exist`);
                }

                let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsite(payload.website);
                if (websiteExist && websiteExist.website != `http://www.${payload.rfiName}.no_website_provided.com`) {
                    console.log('Consumer cancelled by server, line 153 =====');
                    console.log(`website ${payload.website} already exist`);
                    debugger
                    //@ts-ignore
                    // throw Error(`website ${payload.website} already exist`);
                }

                let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSlogan(payload.slogan);
                if (sloganExist && sloganExist.slogan != `${payload.rfiName} slogan was not provided`) {
                    console.log('Consumer cancelled by server, line 162 =====');
                    console.log(`slogan ${payload.slogan} already exist`);
                    debugger
                    //@ts-ignore
                    // throw Error(`slogan ${payload.slogan} already exist`);
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

                const { externalRfiRecordId, rfiName, rfiCode, email, address, } = rfiRecord;
                let updatedExternalRfiRecordId = id || externalRfiRecordId; // Provide an empty string as the default value if id is not defined
                let updatedRfiCode = code || rfiCode; // Provide an empty string as the default value if code is not defined
                let updatedRfiName = name || rfiName; // Provide an empty string as the default value if name is not defined
                let updatedEmail = rfi.email || email; // Provide an empty string as the default value if name is not defined
                let updatedPhone = directors && directors[0] && directors[0].phoneNumber || `${updatedRfiName} phone was not provided`;//''; // Provide an empty string as the default value if directors or phoneNumber is not defined
                let addressString;
                if (rfi.address && rfi.address.street && rfi.address.city && rfi.address.state && rfi.address.country) {
                    addressString = `${rfi.address.street}, ${rfi.address.city}, ${rfi.address.state}, ${rfi.address.country}`;
                } else {
                    addressString = address;//'Address information is not complete'; // Provide a default message if any part of the address is not defined
                }

                let updatedImageUrl = content.imageUrl ? content.imageUrl : `http://www.${updatedRfiName}.no_image_provided.com`;
                let updatedWebsite = content.website ? content.website : `http://www.${updatedRfiName}.no_website_provided.com`;
                let updatedPhone2 = content.phone2 ? content.phone2 : `${updatedRfiName} phone2 was not provided`;
                let updatedSlogan = content.slogan ? content.slogan : `${updatedRfiName} slogan was not provided`;
                debugger

                const payload: RfiRecordType = {
                    externalRfiRecordId: updatedExternalRfiRecordId,//externalRfiRecordId,
                    rfiName: updatedRfiName,//rfiName,
                    rfiCode: updatedRfiCode,//rfiCode,
                    phone: updatedPhone,//phone,
                    phone2: updatedPhone2,//phone2,
                    email: updatedEmail,//email,
                    website: updatedWebsite,//website,
                    slogan: updatedSlogan,//slogan,
                    imageUrl: updatedImageUrl,//imageUrl,
                    address: addressString,//address,
                }
                debugger
                if (payload.rfiName) {
                    let rfiNameExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiNameAndWhereRfiCodeIsNotThis(payload.rfiName, rfiCode);
                    if (rfiNameExist) {
                        console.log('Consumer cancelled by server, line 181 =====');
                        console.log(`rfiName ${payload.rfiName} already exist`);
                        debugger
                        //@ts-ignore
                        throw Error(`rfiName ${payload.rfiName} already exist`);
                    }
                }
                if (payload.rfiCode) {
                    let rfiCodeExist = await rfiRecordsService.getRfiRecordByRfiRecordRfiCodeAndWhereRfiNameIsNotThis(payload.rfiCode, rfiName);
                    if (rfiCodeExist) {
                        console.log('Consumer cancelled by server, line 191 =====');
                        console.log(`rfiCode ${payload.rfiCode} already exist`);
                        debugger
                        //@ts-ignore
                        throw Error(`rfiCode ${payload.rfiCode} already exist`);
                    }
                }
                if (payload.phone) {
                    let phoneExist = await rfiRecordsService.getRfiRecordByRfiRecordPhoneAndWhereRfiCodeIsNotThis(payload.phone, rfiCode);
                    if (phoneExist && phoneExist.phone != `${rfiName} phone was not provided`) {
                        console.log('Consumer cancelled by server, line 203 =====');
                        console.log(`phone number ${payload.phone} already exist`);
                        debugger
                        //@ts-ignore
                        // throw Error(`phone number ${payload.phone} already exist`);
                    }
                }
                if (payload.phone2) {
                    let phone2Exist = await rfiRecordsService.getRfiRecordByRfiRecordPhone2AndWhereRfiCodeIsNotThis(payload.phone2, rfiCode);
                    if (phone2Exist && phone2Exist.phone2 != `${rfiName} phone2 was not provided`) {
                        console.log('Consumer cancelled by server, line 215 =====');
                        console.log(`phone2 ${payload.phone2} already exist`);
                        debugger
                        //@ts-ignore
                        // throw Error(`phone2 ${payload.phone2} already exist`);
                    }
                }
                if (payload.email) {
                    let emailExist = await rfiRecordsService.getRfiRecordByRfiRecordEmailAndWhereRfiCodeIsNotThis(payload.email, rfiCode);
                    if (emailExist) {
                        console.log('Consumer cancelled by server, line 227 =====');
                        console.log(`email ${payload.email} already exist`);
                        debugger
                        //@ts-ignore
                        // throw Error(`email ${payload.email} already exist`);
                    }

                }
                if (payload.website) {
                    let websiteExist = await rfiRecordsService.getRfiRecordByRfiRecordWebsiteAndWhereRfiCodeIsNotThis(payload.website, rfiCode);
                    if (websiteExist && websiteExist.website != `http://www.${rfiName}.no_website_provided.com`) {
                        console.log('Consumer cancelled by server, line 239 =====');
                        console.log(`website ${payload.website} already exist`);
                        debugger
                        //@ts-ignore
                        // throw Error(`website ${payload.website} already exist`);
                    }
                }
                if (payload.slogan) {
                    let sloganExist = await rfiRecordsService.getRfiRecordByRfiRecordSloganAndWhereRfiCodeIsNotThis(payload.slogan, rfiCode);
                    if (sloganExist && sloganExist.slogan != `${rfiName} slogan was not provided`) {
                        console.log('Consumer cancelled by server, line 251 =====');
                        console.log(`slogan ${payload.slogan} already exist`);
                        debugger
                        //@ts-ignore
                        // throw Error(`slogan ${payload.slogan} already exist`);
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

            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async createRfiRecordSetting(investment: any): Promise<any> {
        try {

// {
//   "action": "Investment config persist",
//   "investment": {
//     "id": "10ffa360-05d0-4995-91e6-e48b64244020",
//     "rfiId": "b503f9fb-093d-41a0-acaa-caa5d5356774",
//     "bundleId": "0d8a074e-a1e0-47c4-badb-1940c3b50669",
//     "productId": "8efad311-ea14-400e-8a2b-6059e2716947",
//     "initiationNotificationEmail": "mazojynuj@mailinator.com",
//     "activationNotificationEmail": "zihituf@mailinator.com",
//     "maturityNotificationEmail": "cinanicecu@mailinator.com",
//     "payoutNotificationEmail": "doxamo@mailinator.com",
//     "rolloverNotificationEmail": "xypemyca@mailinator.com",
//     "liquidationNotificationEmail": "quqiwaguny@mailinator.com",
//     "investmentWalletId": "Adipisci iure eiusmo",
//     "payoutWalletId": "Ullamco voluptatem",
//     "isPayoutAutomated": false,
//     "fundingSourceTerminal": "Veniam enim corrupt",
//     "liquidationPenalty": 45,
//     "isInvestmentAutomated": false,
//     "isRolloverAutomated": false,
//     "isAllPayoutSuspended": false,
//     "isAllRolloverSuspended": false,
//     "tagName": "Petra Freeman New",
//     "currencyCode": "NGN",
//     "createdAt": "2023-02-07T13:55:51.263+00:00",
//     "updatedAt": "2023-02-07T13:55:51.263+00:00",
//     "status": "Pending",
//     "rfi": {
//       "id": "b503f9fb-093d-41a0-acaa-caa5d5356774",
//       "code": "ASD",
//       "isVerified": true,
//       "name": "Adisababaio inc.",
//       "registrationNumberType": "CAC",
//       "registrationNumber": "09876543",
//       "memorandomOfAssociationUrl": "memorandom.pdf",
//       "email": "businessnewupdate@gmail.com",
//       "street": "65b,joyceB, Mokola",
//       "city": "ibadan",
//       "state": "Oyo",
//       "country": "Nigeria",
//       "createdBy": "08102872652",
//       "isDeleted": false,
//       "createdAt": "2023-01-12T14:56:25.508+00:00",
//       "updatedAt": "2023-01-12T15:17:44.067+00:00",
//       "onboardingState": "Go Live",
//       "verificationStatus": "VERIFIED",
//       "isUpdateRequired": false,
//       "isOnboardingMeetingHeld": true,
//       "isRealmCreated": true,
//       "isRootUserCreated": true,
//       "status": "Active",
//       "contactPersonEmail": "oremei.akande@gmail.com",
//       "contactPersonFirstname": "ade",
//       "contactPersonSurname": "adejuwon",
//       "isContactPersonEmailVerified": true,
//       "isRootUserEmailVerified": false,
//       "realm": "abds",
//       "rfiOnboardingStep": null,
//       "isRootUserRequested": false,
//       "rootUserRequestedAt": null
//     },
//     "bundle": {
//       "id": "0d8a074e-a1e0-47c4-badb-1940c3b50669",
//       "name": "Mobile Banking",
//       "label": "Mobile Banking",
//       "description": "Manage all banking operations ranging from customers deposits, withdrawals, payments, complaints and accounts discrepancies resolution.",
//       "thumbnailUrl": "fe43b932-6578-4f06-8f89-be9860d8bb8c.jpg",
//       "isActive": true,
//       "createdAt": "2022-11-28T15:39:35.444+00:00",
//       "updatedAt": "2022-11-28T15:39:35.444+00:00"
//     },
//     "product": {
//       "id": "8efad311-ea14-400e-8a2b-6059e2716947",
//       "name": "Investment",
//       "label": "Investment",
//       "description": "Introduce investment to your customers.",
//       "thumbnailUrl": "fe43b932-6578-4f06-8f89-be9860d8bb8c.jpg",
//       "isActive": true,
//       "createdAt": "2022-11-28T15:39:35.595+00:00",
//       "updatedAt": "2022-11-28T15:39:35.595+00:00"
//     }
//   }
// }

            let { rfiId, initiationNotificationEmail, activationNotificationEmail, maturityNotificationEmail,
                payoutNotificationEmail, rolloverNotificationEmail, liquidationNotificationEmail, investmentWalletId, payoutWalletId,
                isPayoutAutomated, fundingSourceTerminal, liquidationPenalty, isInvestmentAutomated, isRolloverAutomated, isAllPayoutSuspended,
                isAllRolloverSuspended, tagName, currencyCode, status, rfi, } = investment;
            let { code, name, email, street, city, state, country } = rfi;
            debugger

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
                const { rfiName, rfiCode, email, imageUrl, } = rfiRecord
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

                // const payload2: SettingType = {
                //     rfiName: rfiName,
                //     rfiCode: rfiCode,
                //     rfiImageUrl: rfiImageUrl,
                //     isPayoutAutomated: isPayoutAutomated,
                //     investmentWalletId: investmentWalletId,
                //     payoutWalletId: payoutWalletId,
                //     isInvestmentAutomated: isInvestmentAutomated,
                //     isRolloverAutomated: isRolloverAutomated,
                //     fundingSourceTerminal: fundingSourceTerminal,
                //     // investmentType: investmentType,
                //     tagName: tagName,
                //     currencyCode: currencyCode,
                //     initiationNotificationEmail: initiationNotificationEmail,
                //     activationNotificationEmail: activationNotificationEmail,
                //     maturityNotificationEmail: maturityNotificationEmail,
                //     payoutNotificationEmail: payoutNotificationEmail,
                //     rolloverNotificationEmail: rolloverNotificationEmail,
                //     liquidationNotificationEmail: liquidationNotificationEmail,
                //     isAllPayoutSuspended: isAllPayoutSuspended,
                //     isAllRolloverSuspended: isAllRolloverSuspended,
                //     liquidationPenalty: liquidationPenalty,
                // }
                // check if setting exist and update changed value
                let selectedSetting = await settingsService.getSettingBySettingRfiCode(rfiCode)
                if (!selectedSetting) {
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
                    await settingsService.createSetting(payload2);
                    console.log("Existing RFI record, investment config setting created successfully line 424 ===== ")
                } else {
                    const payload2: SettingType = {
                        rfiName: rfiName ? rfiName : selectedSetting.rfiName,
                        rfiCode: rfiCode ? rfiCode : selectedSetting.rfiCode,
                        rfiImageUrl: rfiImageUrl ? rfiImageUrl : selectedSetting.rfiImageUrl,
                        isPayoutAutomated: isPayoutAutomated ? isPayoutAutomated : selectedSetting.isPayoutAutomated,
                        investmentWalletId: investmentWalletId ? investmentWalletId : selectedSetting.investmentWalletId,
                        payoutWalletId: payoutWalletId ? payoutWalletId : selectedSetting.payoutWalletId,
                        isInvestmentAutomated: isInvestmentAutomated ? isInvestmentAutomated : selectedSetting.isInvestmentAutomated,
                        isRolloverAutomated: isRolloverAutomated ? isRolloverAutomated : selectedSetting.isRolloverAutomated,
                        fundingSourceTerminal: fundingSourceTerminal ? fundingSourceTerminal : selectedSetting.fundingSourceTerminal,
                        // investmentType: investmentType,
                        tagName: tagName ? tagName : selectedSetting.tagName,
                        currencyCode: currencyCode ? currencyCode : selectedSetting.currencyCode,
                        initiationNotificationEmail: initiationNotificationEmail ? initiationNotificationEmail : selectedSetting.initiationNotificationEmail,
                        activationNotificationEmail: activationNotificationEmail ? activationNotificationEmail : selectedSetting.activationNotificationEmail,
                        maturityNotificationEmail: maturityNotificationEmail ? maturityNotificationEmail : selectedSetting.maturityNotificationEmail,
                        payoutNotificationEmail: payoutNotificationEmail ? payoutNotificationEmail : selectedSetting.payoutNotificationEmail,
                        rolloverNotificationEmail: rolloverNotificationEmail ? rolloverNotificationEmail : selectedSetting.rolloverNotificationEmail,
                        liquidationNotificationEmail: liquidationNotificationEmail ? liquidationNotificationEmail : selectedSetting.liquidationNotificationEmail,
                        isAllPayoutSuspended: isAllPayoutSuspended ? isAllPayoutSuspended : selectedSetting.isAllPayoutSuspended,
                        isAllRolloverSuspended: isAllRolloverSuspended ? isAllRolloverSuspended : selectedSetting.isAllRolloverSuspended,
                        liquidationPenalty: liquidationPenalty ? liquidationPenalty : selectedSetting.liquidationPenalty,
                    }
                    await settingsService.updateSetting(selectedSetting, payload2);
                    console.log("Existing RFI record, investment config setting updated successfully line 427 ===== ")
                }
                // console.log("Existing RFI record, investment config updated successfully line 431 ===== ")
            }
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }


}
