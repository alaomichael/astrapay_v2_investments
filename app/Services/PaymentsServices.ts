'use strict'

import { InvestmentType } from 'App/Services/types/investment_type'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
// import { parse } from 'url'
import Investment from 'App/Models/Investment'
import AppException from 'App/Exceptions/AppException';
import ApprovalsServices from './ApprovalsServices';
import SettingsServices from './SettingsServices';
// InvestmentsServices
import InvestmentsServices from './InvestmentsServices';
import { dueForPayout, investmentDuration, } from 'App/Helpers/utils';
import TimelinesServices from './TimelinesServices';
import TypesServices from './TypesServices';
import { debitUserWallet } from 'App/Helpers/debitUserWallet';
// import { sendNotification } from 'App/Helpers/sendNotification';
import { creditUserWallet } from 'App/Helpers/creditUserWallet';
import { sendNotificationWithoutPdf } from 'App/Helpers/sendNotificationWithoutPdf';
import { sendNotificationWithPdf } from 'App/Helpers/sendNotificationWithPdf';
import { checkTransactionStatus } from 'App/Helpers/checkTransactionStatus';
// Testing
const randomstring = require("randomstring");
const Env = require("@ioc:Adonis/Core/Env");
const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
// const PENALTY_FOR_LIQUIDATION = Env.get("PENALTY_FOR_LIQUIDATION");
const TRANSACTION_PREFIX = Env.get("TRANSACTION_PREFIX");
// const CHARGE = Env.get("SERVICE_CHARGE");
// const API_URL = Env.get("API_URL");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
// import AppException from 'App/Exceptions/AppException';

Database.query()

export default class PaymentsServices {

    // createNewInvestment
    public async processInvestmentTransaction(paymentDetails: any): Promise<Investment> {
        try {
            // const investment = await Investment.create(createInvestment)
            // let payload = paymentDetails;
            // let record = payload;
            // START
            const investmentsService = new InvestmentsServices();
            const timelineService = new TimelinesServices();
            const typesService = new TypesServices();
            // Get the investment with the customer reference
            const customerReference = paymentDetails.customerReference;
            let investment = await investmentsService.getInvestmentByInvestmentRequestReference(customerReference)
            if (!investment) throw Error(`The investment record with InvestmentRequestReference : ${customerReference} does not exist , please select another one and try again.`);  //throw new AppException({ message: `The investment record with InvestmentRequestReference : ${customerReference} does not exist , please select another one and try again.`, codeSt: "422" });
            let record = investment;
            const amountPaid = Number(paymentDetails.amount / 100);// Convert Kobo to Naira  
            if (record.amount > amountPaid) throw Error(`The amount paid :${paymentDetails.currency} ${amountPaid} is less than the amount :${paymentDetails.currency} ${record.amount} to be investmented, please check and try again.`); // throw new AppException({ message: `The amount paid is less than the amount to be investmented, please check and try again.`, codeSt: "422" });
            if (record.status == "active") throw Error(`The status of the investment record selected is currently ${record.status} , please check and try again.`); //throw new AppException({ message: `@PaymentsServices : The investment selected is currently ${record.status} , please check and try again.`, codeSt: "422" });
            // const amountToInvest = amountPaid;
            //    debugger
            // payload.amount = amountToInvest;
            record.amount = amountPaid; //Number(payload.amount/100); // Convert Kobo to Naira
            // let payloadAmount = payload.amount;
            // let payloadDuration = payload.duration;
            // let payloadInvestmentType = payload.investmentType;
            // let payloadinvestmentTypeId = payload.investmentTypeId;
            // Data to send for transfer of fund 
            let {
                // start
                //@ts-ignore
                id,
                lastName,
                firstName,
                walletId,investorFundingWalletId,
                userId,
                investmentTypeId,
                rfiCode,
                currencyCode,
                lng,
                lat,
                phone,
                email,
                amount,
                duration,
                //@ts-ignore
                principalPayoutRequestReference,
                //@ts-ignore
                // interestPayoutRequestReference,
                // interestRate: 0,
                // interestDueOnInvestment: 0,
                // interestDueOnInvestment,
                // end
            } = record;
            const investmentId = investment.id;
            // debugger
            // let { amount, investmentTypeId, rfiCode, walletId, userId, firstName, duration, currencyCode } = payload;
            let timelineObject;
            // console.log(
            //     ' The Rate return for RATE line 59: ',
            //     await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            // )
            // let rate = await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            let investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);

            // let rate;
            // if (investmentTypeDetails) {
            //     let { interestRate } = investmentTypeDetails;
            //     rate = interestRate;
            // }

            let beneficiaryName = `${firstName} ${lastName}`;
            let beneficiaryAccountNumber =investorFundingWalletId;// walletId;
            let beneficiaryAccountName = beneficiaryName;
            let beneficiaryPhoneNumber = phone;
            let beneficiaryEmail = email;
            // Send to the endpoint for debit of wallet
            let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;

            if (investmentTypeDetails) {
                let { status, lowestAmount, highestAmount, investmentTenures } = investmentTypeDetails;
                if (status !== "active") {
                    // Payout the amount that is to be rollover
                    // check if transaction with same customer ref exist
                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                    debugger
                    // if (checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                        //@ts-ignore
                        // let investmentId = record.id;
                        // Create Unique payment reference for the customer
                        let reference = DateTime.now() + randomstring.generate(4);
                        let numberOfAttempts = 1;
                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 124 ==================")
                        // console.log(paymentReference);
                        let getNumberOfAttempt = paymentReference.split("/");
                        console.log("getNumberOfAttempt line 131 =====", getNumberOfAttempt[1]);
                        // debugger;
                        // @ts-ignore
                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                        principalPayoutRequestReference = paymentReference;
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // debugger
                        // console.log("Current log, line 136 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // initiate a new  transaction
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal)
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 174 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 178 :", updatedInvestment);

                            // console.log("Updated record Status line 180: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid, because the investment type you selected for your rollover is presently not active, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 194:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 197:", newTimeline);
                            // update record

                            // Send Details to notification service
                            //         let subject = "AstraPay Investment Payout";
                            //         let message = `
                            // ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid, because the investment type you selected for your rollover is presently not active.

                            // Please check your device.

                            // Thank you.

                            // AstraPay Investment.`;
                            //         let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                            //         // console.log("newNotificationMessage line 211:", newNotificationMessage);
                            //         // debugger
                            //         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            //             console.log("Notification sent successfully");
                            //         } else if (newNotificationMessage.message !== "Success") {
                            //             console.log("Notification NOT sent successfully");
                            //             console.log(newNotificationMessage);
                            //         }
                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 223:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = 'failed';
                            // record.interestPayoutStatus = 'completed';
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 207 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 211 :", updatedInvestment);

                            // console.log("Updated record Status line 213: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 230:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 233:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 274:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        }
                        throw new AppException({ message: `The investment type you selected is ${status} , please select another one and try again.`, codeSt: "422" })


                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                        // update the value for number of attempts
                        // get the current investmentRef, split , add one to the current number, update and try again
                        let getNumberOfAttempt = principalPayoutRequestReference.split("_");
                        // console.log("getNumberOfAttempt line 367 =====", getNumberOfAttempt[1]);
                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                        let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 371 ==================")
                        // console.log(newPaymentReference);
                        principalPayoutRequestReference = newPaymentReference;
                        record.principalPayoutRequestReference = principalPayoutRequestReference;
                        record.numberOfAttempts = numberOfAttempts;
                        // update record
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                        // console.log(" Current log, line 310 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 314 :", updatedInvestment);

                        // console.log("Updated record Status line 316: ", record);
                        // Send to the endpoint for debit of wallet
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal);
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 141 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 145 :", updatedInvestment);

                            // console.log("Updated record Status line 147: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid, because the investment type you selected for your rollover is presently not active, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 161:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 164:", newTimeline);
                            // update record

                            // Send Details to notification service
                            //         let subject = "AstraPay Investment Payout";
                            //         let message = `
                            // ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid, because the investment type you selected for your rollover is presently not active.

                            // Please check your device.

                            // Thank you.

                            // AstraPay Investment.`;
                            //         let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                            //         // console.log("newNotificationMessage line 178:", newNotificationMessage);
                            //         // debugger
                            //         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            //             console.log("Notification sent successfully");
                            //         } else if (newNotificationMessage.message !== "Success") {
                            //             console.log("Notification NOT sent successfully");
                            //             console.log(newNotificationMessage);
                            //         }
                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 191:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = 'failed';
                            // record.interestPayoutStatus = 'completed';
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 207 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 211 :", updatedInvestment);

                            // console.log("Updated record Status line 213: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 230:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 233:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 274:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        }
                        throw new AppException({ message: `The investment type you selected is ${status} , please select another one and try again.`, codeSt: "422" })

                    }
                }
                if (amount < lowestAmount || amount > highestAmount) {
                    let message
                    if (amount < lowestAmount) {
                        message = `The least amount allowed for this type of investment is ${currencyCode} ${lowestAmount} , please input an amount that is at least ${currencyCode} ${lowestAmount} but less than or equal to ${currencyCode} ${highestAmount} and try again. Thank you.`;
                    } else if (amount > highestAmount) {
                        message = `The highest amount allowed for this type of investment is ${currencyCode} ${highestAmount} , please input an amount less than or equal to ${currencyCode} ${highestAmount} but at least ${currencyCode} ${lowestAmount} and try again. Thank you.`;
                    }
                    // check if transaction with same customer ref exist
                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                    debugger
                    // if (checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                        //@ts-ignore
                        // let investmentId = record.id
                        // Create Unique payment reference for the customer
                        let reference = DateTime.now() + randomstring.generate(4);
                        let numberOfAttempts = 1;
                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 501 ==================")
                        // console.log(paymentReference);
                        // let getNumberOfAttempt = paymentReference.split("/");
                        // console.log("getNumberOfAttempt line 504 =====", getNumberOfAttempt[1]);
                        // debugger;
                        // @ts-ignore
                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                        principalPayoutRequestReference = paymentReference;

                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // debugger
                        // console.log(" Current log, line 511 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // initiate a new  transaction
                        // Payout the amount that is to be rollover
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal);
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            record.principalPayoutStatus = "completed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 332 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 336 :", updatedInvestment);

                            // console.log("Updated record Status line 338: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the amount to be rollover is not within the allowed range for this type of investment, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 352:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 355:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 378:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = "failed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 415 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 419 :", updatedInvestment);

                            // console.log("Updated record Status line 421: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 435:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 438:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_and_rollover_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 461:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        }
                        throw new AppException({ message: `${message}`, codeSt: "422" })

                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                        // update the value for number of attempts
                        // get the current investmentRef, split , add one to the current number, update and try again
                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                        // console.log("getNumberOfAttempt line 663 =====", getNumberOfAttempt[1]);
                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 667 ==================")
                        // console.log(newPaymentReference);
                        principalPayoutRequestReference = newPaymentReference;
                        // update record
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                        // console.log(" Current log, line 826 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 830 :", updatedInvestment);

                        // console.log("Updated record Status line 832: ", record);
                        // Payout the amount that is to be rollover
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal);
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            record.principalPayoutStatus = "completed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 870 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 874 :", updatedInvestment);

                            // console.log("Updated record Status line 876: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the amount to be rollover is not within the allowed range for this type of investment, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 890:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 893:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 900:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = "failed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 934 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 938 :", updatedInvestment);

                            // console.log("Updated record Status line 940: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 954:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 957:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_and_rollover_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 964:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        }
                        throw new AppException({ message: `${message}`, codeSt: "422" })
                    }

                }
                // if (investmentTenures.includes(duration) === false) {
                //     throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })
                // }
                let isTenureExisting = investmentTenures.find(o => o.$original.tenure == duration)
                if (isTenureExisting == false || isTenureExisting == undefined) {
                    // check if transaction with same customer ref exist
                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                    debugger
                    // if (checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                        //@ts-ignore
                        // let investmentId = record.id
                        // Create Unique payment reference for the customer
                        let reference = DateTime.now() + randomstring.generate(4);
                        let numberOfAttempts = 1;
                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 838 ==================")
                        // console.log(paymentReference);
                        // let getNumberOfAttempt = paymentReference.split("/");
                        // console.log("getNumberOfAttempt line 841 =====", getNumberOfAttempt[1]);
                        debugger;
                        // @ts-ignore
                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);

                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // debugger
                        // console.log(" Current log, line 848 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // initiate a new  transaction
                        // Payout the amount that is to be rollover
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal);
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            record.principalPayoutStatus = "completed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 1171 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 1175 :", updatedInvestment);

                            // console.log("Updated record Status line 1177: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the tenure selected is not available on this type of investment, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 1191:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 1194:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 1201:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = "failed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 1235 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 1239 :", updatedInvestment);

                            // console.log("Updated record Status line 1241: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 1255:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 1258:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_and_rollover_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 1265:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }
                        }
                        throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })


                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                        // update the value for number of attempts
                        // get the current investmentRef, split , add one to the current number, update and try again
                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                        // console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 821 ==================")
                        // console.log(newPaymentReference);
                        principalPayoutRequestReference = newPaymentReference;
                        record.principalPayoutRequestReference = newPaymentReference;
                        // update record
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                        // console.log(" Current log, line 826 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 1316 :", updatedInvestment);

                        // console.log("Updated record Status line 1318: ", record);
                        // Payout the amount that is to be rollover
                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode,
                            descriptionForPrincipal);
                            debugger
                        // if successful
                        let decPl = 3;
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record!.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record!.status = 'completed';
                            record.principalPayoutStatus = "completed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record!.isPayoutAuthorized = true;
                            //@ts-ignore
                            record!.isPayoutSuccessful = true;
                            //@ts-ignore
                            record!.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 1171 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 1175 :", updatedInvestment);

                            // console.log("Updated record Status line 1177: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the tenure selected is not available on this type of investment, please check your device. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 1191:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 1194:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 1201:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }

                        } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                            let amountPaidOut = amount;
                            // let decPl = 3;
                            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                            // update the investment details
                            //@ts-ignore
                            record.isInvestmentCompleted = true;
                            //@ts-ignore
                            record.investmentCompletionDate = DateTime.now();
                            //@ts-ignore
                            record.status = 'completed_with_principal_payout_outstanding';
                            record.principalPayoutStatus = "failed";
                            // record.interestPayoutStatus = "pending";
                            // record.approvalStatus = approval.approvalStatus;//'payout'
                            //@ts-ignore
                            record.isPayoutAuthorized = true;
                            //@ts-ignore
                            record.isPayoutSuccessful = false;
                            // record.datePayoutWasDone = DateTime.now();
                            // debugger

                            // Save the updated record
                            // await record.save();
                            // update record
                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                            // console.log(" Current log, line 1235 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 1239 :", updatedInvestment);

                            // console.log("Updated record Status line 1241: ", record);

                            // update timeline
                            timelineObject = {
                                id: uuid(),
                                action: "investment payout failed",
                                investmentId: id,//id,
                                walletId: walletId,// walletId,
                                userId: userId,// userId,
                                // @ts-ignore
                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            // console.log("Timeline object line 1255:", timelineObject);
                            await timelineService.createTimeline(timelineObject);
                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                            // console.log("new Timeline object line 1258:", newTimeline);
                            // update record

                            // Send Notification to admin and others stakeholder
                            let investment = record;
                            let messageKey = "payout_and_rollover_failed";
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // console.log("newNotificationMessage line 1265:", newNotificationMessageWithoutPdf);
                            // debugger
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }
                        }
                        throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })

                    }
                }
                // debugger
                // rate = interestRate;
            }

            // console.log(' Rate return line 1280 : ', rate)
            // if (rate === undefined) {
            //     throw Error('no investment rate matched your search, please try again.')
            // }
            // const investment = await Investment.create(payload)
            // @ts-ignore
            // payload.investmentRequestReference = DateTime.now() + randomstring.generate(4);
            // @ts-ignore
            // payload.isRequestSent = true;
            // let investment = await investmentsService.createInvestment(payload);
            // // console.log("New investment request line 1290: ", investment);
            // let investmentId = investment.id
            // // Create Unique payment reference for the customer
            // let reference = DateTime.now() + randomstring.generate(4);
            // let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}`;
            // console.log("Customer Transaction Reference ,@ InvestmentsServices line 590 ==================")
            // console.log(paymentReference);
            // debugger;
            // // @ts-ignore
            // investment.investmentRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);

            let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // debugger
            // console.log(" Current log, line 1303 :", currentInvestment);
            // send for update
            await this.updateInvestment(currentInvestment, investment);
            // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 1307 =========:", updatedInvestment);

            // let decPl = 2;
            // let interestRateByDuration = rate * (Number(investment.duration) / 360);
            // console.log(`Interest rate by Investment duration for ${duration} day(s), @ investmentService line 684:`, interestRateByDuration)
            // // convert to decimal places
            // // interestRateByDuration = Number(getDecimalPlace(interestRateByDuration, decPl))
            // interestRateByDuration = Number(interestRateByDuration.toFixed(decPl));
            // console.log(`Interest rate by Investment duration for ${duration} day(s), in ${decPl} dp, @ investmentService line 687:`, interestRateByDuration);
            // investment.interestRate = interestRateByDuration;
            // // debugger
            // // investment.interestRate = rate
            // // investment.rolloverDone = payload.rolloverDone

            // // When the Invest has been approved and activated
            // // let amount = investment.amount
            // let investmentDuration = investment.duration
            // let amountDueOnPayout = await interestDueOnPayout(amountToInvest, rate, investmentDuration)
            // // @ts-ignore
            // investment.interestDueOnInvestment = amountDueOnPayout
            // // @ts-ignore
            // investment.totalAmountToPayout = investment.amount + amountDueOnPayout

            // investment.payoutDate = await payoutDueDate(investment.startDate, investment.duration)
            // @ts-ignore
            // investment.walletId = investorFundingWalletId
            // await investment.save()
            // console.log('The new investment:', investment)

            // Send Investment Initiation Message to Queue

            // check if Approval is set to Auto, from Setting Controller
            // let userId = investment.userId
            // let investmentId = investment.id
            // let requestType = 'start_investment'
            // let settings = await Setting.query().where({ rfiCode: rfiCode })
            // console.log('Approval setting line 728:', settings[0])
            const settingsService = new SettingsServices();
            const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
            if (!settings) {
                throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
            }
            // let timeline: any[] = []
            //  create a new object for the timeline
            // timelineObject = {
            //     id: uuid(),
            //     investmentId: investmentId,
            //     walletId: walletId,
            //     userId: userId,
            //     action: 'investment initiated',
            //     // @ts-ignore
            //     message: `${firstName}, you just initiated an investment.`,
            //     createdAt: investment.createdAt,
            //     metadata: `duration: ${investment.duration}`,
            // }
            // // console.log('Timeline object line 747:', timelineObject)
            // await timelineService.createTimeline(timelineObject);
            // // let newTimeline = await timelineService.createTimeline(timelineObject);
            // // console.log('Timeline object line 750:', newTimeline)
            // // Send Notification to admin and others stakeholder
            // let messageKey = "initiation";
            // let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 754:", newNotificationMessageWithoutPdf);
            // // debugger
            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            // }
            //  Check if investment activation is automated
            // let approvalIsAutomated = settings.isInvestmentAutomated
            // let approvalIsAutomated = false
            // if (approvalIsAutomated === false) {
            //     // Send Approval Request to Admin
            //     // let approval = await approvalRequest(userId, investmentId, requestType)
            //     // console.log(' Approval request return line 938 : ', approval)
            //     // if (approval === undefined) {
            //     //   return response.status(400).json({
            //     //     status: 'OK',
            //     //     message: 'investment approval request was not successful, please try again.',
            //     //     data: [],
            //     //   })
            //     // }
            //     const approvalsService = new ApprovalsServices()
            //     let approvalObject;

            //     // TODO: Send to the Admin for approval
            //     // update approvalObject
            //     approvalObject = {
                // rfiCode:rfiCode,
            //         walletId: investment.walletId,
            //         investmentId: investment.id,
            //         userId: investment.userId,
            //         requestType: "start_investment_rollover",
            //         approvalStatus: investment.approvalStatus,
            //         assignedTo: "",//investment.assignedTo,
            //         processedBy: "",//investment.processedBy,
            //         // remark: "",
            //     };
            //     // console.log("ApprovalRequest object line 690:", approvalObject);
            //     // check if the approval request is not existing
            //     let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
            //     if (!approvalRequestIsExisting) {
            //         let newApprovalRequest = await approvalsService.createApproval(approvalObject);
            //         console.log("new ApprovalRequest object line 1740:", newApprovalRequest);
            //     }

            // } else if (approvalIsAutomated === true) {
            // TODO
            // Send Investment Payload To Transaction Service
            // let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
            // console.log(' Feedback from Transaction service: ', sendToTransactionService)
            investment.approvedBy = investment.approvedBy !== undefined ? investment.approvedBy : "automation"
            investment.assignedTo = investment.assignedTo !== undefined ? investment.assignedTo : "automation"
            // investment.approvalStatus = "approved"//approval.approvalStatus;
            // Data to send for transfer of fund
            // let { amount,// lng, lat, investmentRequestReference,
            //     firstName,// lastName,
            //     walletId, userId,
            //     // phone,
            //     email,
            //     // rfiCode,
            //     currencyCode } = investment;
            // let senderName = `${firstName} ${lastName}`;
            // let senderAccountNumber = walletId;
            // let senderAccountName = senderName;
            // let senderPhoneNumber = phone;
            // let senderEmail = email;
            // Send to the endpoint for debit of wallet
            // let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
            //     senderName,
            //     senderAccountNumber,
            //     senderAccountName,
            //     senderPhoneNumber,
            //     senderEmail,
            //     rfiCode)
            // debugger

            // // update the investment details
            // investment.status = 'investment_approved'
            // investment.approvalStatus = 'approved'
            // investment.principalPayoutStatus = "pending";
            // investment.interestPayoutStatus = "pending";
            // // investment.startDate = DateTime.now() //.toISODate()
            // // investment.payoutDate = DateTime.now().plus({ days: investment.duration })
            // // investment.isInvestmentCreated = true

            // // Save the updated record
            // // await record.save();
            // // update record
            // let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // // console.log(" Current log, line 840 :", currentInvestment);
            // // send for update
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 843 :", updatedInvestment);

            // // console.log("Updated record Status line 845: ", record);

            // // update timeline
            // timelineObject = {
            //     id: uuid(),
            //     action: "investment approved",
            //     investmentId: investmentId,//id,
            //     walletId: walletId,// walletId,
            //     userId: userId,// userId,
            //     // @ts-ignore
            //     message: `${firstName}, your investment request has been approved, please wait while the investment is activated. Thank you.`,
            //     createdAt: DateTime.now(),
            //     metadata: ``,
            // };
            // // console.log("Timeline object line 849:", timelineObject);
            // await timelineService.createTimeline(timelineObject);

            // Send Details to notification service
            // let subject = "AstraPay Investment Approval";
            // let message = `
            // ${firstName} this is to inform you, that your Investment request, has been approved.

            // Please wait while the investment is being activated.

            // Thank you.

            // AstraPay Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 864:", newNotificationMessage);
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //     console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessage);
            // }
            // Send Notification to admin and others stakeholder
            // let messageKey = "approval";
            // let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 875:", newNotificationMessageWithoutPdf);
            // // debugger
            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            // }

            // Testing
            // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
            // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
            // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
            // console.log('Testing Payout Date: ' + testingPayoutDate)

            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 790 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 793 :", updatedInvestment);
            // if successful
            // // if (debitUserWalletForInvestment.status == 200) {
            // update the investment details
            investment.status = 'active'
            investment.approvalStatus = 'approved'
            investment.startDate = DateTime.now() //.toISODate()
            investment.payoutDate = DateTime.now().plus({ days: investment.duration })
            investment.isInvestmentCreated = true
            // debugger

            // Save the updated record
            // await record.save();
            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 908 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);
            // updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 912 :", updatedInvestment);

            // console.log("Updated record Status line 914: ", record);
            timelineObject = {
                id: uuid(),
                investmentId: investmentId,
                userId: userId,
                walletId: walletId,
                action: 'investment activated',
                // @ts-ignore
                message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated.`,
                createdAt: investment.startDate,
                metadata: `duration: ${investment.duration}, payout date : ${investment.payoutDate}`,
            }
            // console.log('Timeline object line 928:', timelineObject)
            await timelineService.createTimeline(timelineObject);
            // Send Details to notification service
            let subject = "AstraPay Investment Activation";
            let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${investment.duration} days, has been activated on ${investment.startDate} and it will be mature for payout on ${investment.payoutDate}.

                Your certificate is attached.

                Please check your device.

                Thank you.

                AstraPay Investment.`;
            // START OF NEW NOTIFICATION WITH CERTIFICATE ATTACHMENT AS PDF
            let recepients = [
                {
                    "email": email,
                    "name": `${firstName} ${lastName} `
                },
                // {
                //   "email": activationNotificationEmail,
                //   "name": `${rfiName} `
                // },
            ];
            let newNotificationMessageWithPdf = await sendNotificationWithPdf(CERTIFICATE_URL, rfiCode, message, subject, recepients,);
            // console.log("newNotificationMessage line 972:", newNotificationMessageWithPdf);
            // debugger
            if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
            } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithPdf);
            }

            // Send Notification to admin and others stakeholder
            let messageKey = "activation";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 997:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
            }

            // }

            // END
            return investment
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async updatePrincipalPayout(paymentDetails: any): Promise<Investment> {
        try {
            // debugger

            // START
            const investmentsService = new InvestmentsServices();
            const timelineService = new TimelinesServices();
            // const typesService = new TypesServices();
            // Get the investment with the customer reference
            const customerReference = paymentDetails.customerReference;
            let investment = await investmentsService.getInvestmentByPrincipalPayoutRequestReference(customerReference)
            if (!investment) throw Error(`The investment record with PrincipalPayoutRequestReference : ${customerReference} does not exist , please select another one and try again.`);  //throw new AppException({ message: `The investment record with InvestmentRequestReference : ${customerReference} does not exist , please select another one and try again.`, codeSt: "422" });
            let record = investment;
            const amountPaid = Number(paymentDetails.amount / 100);// Convert Kobo to Naira  
            // if ( record.amount > amountPaid) throw Error(`The amount paid :${paymentDetails.currency} ${amountPaid} is less than the amount :${paymentDetails.currency} ${record.amount} to be investmented, please check and try again.`); // throw new AppException({ message: `The amount paid is less than the amount to be investmented, please check and try again.`, codeSt: "422" });
            if (record.status == "completed_with_interest_payout_outstanding") throw Error(`The status of the investment record selected is currently ${record.status} , please check and try again.`); //throw new AppException({ message: `@PaymentsServices : The investment selected is currently ${record.status} , please check and try again.`, codeSt: "422" });
            // const amountToInvest = amountPaid;
            //    debugger
            // payload.amount = amountToInvest;
            // record.amount = amountPaid; //Number(payload.amount/100); // Convert Kobo to Naira
            // let payloadAmount = payload.amount;
            // let payloadDuration = payload.duration;
            // let payloadInvestmentType = payload.investmentType;
            // let payloadinvestmentTypeId = payload.investmentTypeId;
            // Data to send for transfer of fund
            let { //amount, id, 
                userId,
                firstName, //lastName,
                walletId,
                // phone,
                // email,
                currencyCode,
                rfiCode,// interestDueOnInvestment,
                // principalPayoutRequestReference, interestPayoutRequestReference
            } = record;
            // let beneficiaryName = `${firstName} ${lastName}`;
            // let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
            // let beneficiaryAccountName = beneficiaryName;
            // let beneficiaryPhoneNumber = phone;
            // let beneficiaryEmail = email;
            // Send to the endpoint for debit of wallet
            // let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
            // let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
            // NEW CODE START
            // let creditUserWalletWithPrincipal;
            // let creditUserWalletWithInterest;
            const investmentId = investment.id;
            // debugger
            // let { amount, investmentTypeId, rfiCode, walletId, userId, firstName, duration, currencyCode } = payload;
            let timelineObject;

            let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // debugger
            // console.log(" Current log, line 1303 :", currentInvestment);
            // send for update
            await this.updateInvestment(currentInvestment, investment);
            const settingsService = new SettingsServices();
            const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
            if (!settings) {
                throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
            }
            investment.approvedBy = investment.approvedBy !== undefined ? investment.approvedBy : "automation"
            investment.assignedTo = investment.assignedTo !== undefined ? investment.assignedTo : "automation"

            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 790 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);

            //  To be changed for interest Start

            let amountPaidOut = amountPaid; // amount; 
            let decPl = 3;
            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            // record.status = 'completed_with_interest_payout_outstanding';
            if (record.status == 'completed_with_principal_payout_outstanding') {
                record.status = 'completed';
            } else {
                record.status = 'completed_with_interest_payout_outstanding';
            }

            record.principalPayoutStatus = 'completed';
            // record.interestPayoutStatus = 'failed';
            // record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // debugger
            // Save the updated record
            // await record.save();
            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 1369 :", currentInvestment);
            // send for update
            const trx = await Database.transaction();
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1372 :", updatedInvestment);
            // console.log("Updated record Status line 1374: ", record);
            // commit transaction and changes to database
            await trx.commit();
            // update timeline
            timelineObject = {
                id: uuid(),
                action: "investment payout",
                investmentId: investmentId,//id,
                walletId: walletId,// walletId,
                userId: userId,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the Principal for your matured investment has been paid out, please check your account. Thank you.`,
                createdAt: DateTime.now(),
                metadata: ``,
            };
            // console.log("Timeline object line 1388:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1391:", newTimeline);
            // update record
            // Send Notification to admin and others stakeholder
            // let investment = record;
            let messageKey = "payout";
            investment = record;
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 4948:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
            }

            debugger
            return investment;
            //  To be changed for interest End
            // END
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    console.log("Entering update 2232 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 2252 =========================");
                    // console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 1175 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 1177 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 1181 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 1186 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 1199 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 1200 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 1201 ===================================", approval.tokenId)
                    // console.log("cardId line 1202 ===================================", approval.cardId)
                    // console.log("accountId line 1203 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 2295 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);
                    let { rfiCode } = record;
                    const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                    if (!settings) {
                        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                    }
                    //  Check if investment payout is not suspended and activation is automated

                    // isAllPayoutSuspended
                    // isAllRolloverSuspended

                    let isAllPayoutSuspended = settings.isAllPayoutSuspended
                    if (isAllPayoutSuspended === false) {
                        if (investment) {
                            console.log("Investment approval Selected for Update line 6163:");
                            // update the data
                            // TODO: Uncomment to use loginAdminFullName
                            // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                            // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                            // payload.remark = remark !== undefined ? remark : approval.remark;
                            // console.log("Admin remark line 6169 ==================== ", approval.remark);
                            // console.log("Admin remark line 6170 ========*******************=========== ", remark);
                            // let newStatus;
                            // await approval.save();
                            // console.log("Update Approval Request line 3498:", approval);
                            let { currencyCode, lastName, startDate, duration } = record;
                            // let { currencyCode, lastName, startDate, duration } = record;
                            console.log("Surname: ", lastName)
                            // console.log("CurrencyCode: ", currencyCode)
                            // debugger
                            // let email = email;
                            let timelineObject;
                            // console.log("Approval.requestType: ===========================================>", approval.requestType)
                            // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                            // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                            // let duration = 4
                            console.log('Time investment was started line 6185: ', startDate)
                            // let timelineObject
                            // let timeline
                            let isDueForPayout = await dueForPayout(startDate, duration)
                            console.log('Is due for payout status line 6189:', isDueForPayout)
                            // debugger
                            if (isDueForPayout === true) {
                                //                          record.isPayoutAuthorized === true,
                                //   record.isPayoutSuspended === false,
                                // payoutReactivationDate: null,

                                // record.status === "matured" &&
                                //     record.status === "matured" &&

                                if ((record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false) || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                        record.isPayoutSuspended === false)) {
                                    console.log("Approval for investment payout processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // Data to send for transfer of fund
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber =investorFundingWalletId;// walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // NEW CODE START
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;
                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                    debugger
                                    // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 1142 ==================")
                                        // console.log(paymentReference);
                                        // let getNumberOfAttempt = paymentReference.split("/");
                                        // console.log("getNumberOfAttempt line 6251 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        principalPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 6258 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger

                                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                                        // console.log("getNumberOfAttempt line 6276 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 6280 ==================")
                                        // console.log(newPaymentReference);
                                        principalPayoutRequestReference = newPaymentReference;
                                        record.principalPayoutRequestReference = principalPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 6286 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 6290 :", updatedInvestment);

                                        // console.log("Updated record Status line 6292: ", record);
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger
                                    }

                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                    // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                     if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 6313 ==================")
                                        console.log(paymentReference);
                                        let getNumberOfAttempt = paymentReference.split("/");
                                        console.log("getNumberOfAttempt line 6315 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        interestPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 6322 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest)

                                    } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                        console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 6412 ==================")
                                        console.log(newPaymentReference);
                                        interestPayoutRequestReference = newPaymentReference;
                                        record.interestPayoutRequestReference = interestPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 826 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 6421 :", updatedInvestment);

                                        // console.log("Updated record Status line 6423: ", record);
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger
                                    }

                                    // NEW CODE END

                                    // debugger
                                    // if successful
                                    // TO BE USED START

                                    let decPl = 3;
                                    if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = amount + interestDueOnInvestment;
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger


                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1302 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1313 :", updatedInvestment);

                                        // console.log("Updated record Status line 1315: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 551:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 553:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment);
                                        // console.log("newNotificationMessage line 4869:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                        let amountPaidOut = amount
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_interest_payout_outstanding';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'failed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1369 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1372 :", updatedInvestment);
                                        // console.log("Updated record Status line 1374: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 1388:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 1391:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        // let investment = record;
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 4948:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = interestDueOnInvestment
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_principal_payout_outstanding';
                                        record.principalPayoutStatus = 'failed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 5002 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 5003 :", updatedInvestment);
                                        // console.log("Updated record Status line 5009: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 5024:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 5027:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 5028:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else {
                                        console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1484 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 4605 :", updatedInvestment);
                                        // debugger
                                        await trx.commit();
                                        throw Error();
                                    }
                                    // TO BE USED END
                                } else {
                                    // console.log("Entering no data 4611 ==================================")
                                    // await trx.commit();
                                    // await trx.rollback();
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }
                            } else {
                                // await trx.rollback();
                                return {
                                    status: 'OK',
                                    message: 'this investment is not mature for payout.',
                                    data: [],
                                }
                            }
                        }
                    } else {
                        // await trx.rollback();
                        return {
                            status: 'OK',
                            message: 'Payout of investment is currently suspended.',
                            data: [],
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 4637", error.messages);
                    console.log("Error line 4638", error.message);
                    // console.log("Error line 4641", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 4644, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }
            let responseData: any[] = [];
            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    // debugger
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 4656 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 4662:", investmentArray);
            // return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async updateInterestPayout(paymentDetails: any): Promise<Investment> {
        try {
            // debugger

            // START
            const investmentsService = new InvestmentsServices();
            const timelineService = new TimelinesServices();
            // const typesService = new TypesServices();
            // Get the investment with the customer reference
            const customerReference = paymentDetails.customerReference;
            let investment = await investmentsService.getInvestmentByInterestPayoutRequestReference(customerReference)
            if (!investment) throw Error(`The investment record with InterestPayoutRequestReference : ${customerReference} does not exist , please select another one and try again.`);  //throw new AppException({ message: `The investment record with InvestmentRequestReference : ${customerReference} does not exist , please select another one and try again.`, codeSt: "422" });
            let record = investment;
            const amountPaid = Number(paymentDetails.amount / 100);// Convert Kobo to Naira  
            // if ( record.amount > amountPaid) throw Error(`The amount paid :${paymentDetails.currency} ${amountPaid} is less than the amount :${paymentDetails.currency} ${record.amount} to be investmented, please check and try again.`); // throw new AppException({ message: `The amount paid is less than the amount to be investmented, please check and try again.`, codeSt: "422" });
            if (record.status == "completed_with_principal_payout_outstanding" || record.status == "completed") throw Error(`The status of the investment record selected is currently ${record.status} , please check and try again.`); //throw new AppException({ message: `@PaymentsServices : The investment selected is currently ${record.status} , please check and try again.`, codeSt: "422" });
            // const amountToInvest = amountPaid;
            //    debugger
            // payload.amount = amountToInvest;
            // record.amount = amountPaid; //Number(payload.amount/100); // Convert Kobo to Naira
            // let payloadAmount = payload.amount;
            // let payloadDuration = payload.duration;
            // let payloadInvestmentType = payload.investmentType;
            // let payloadinvestmentTypeId = payload.investmentTypeId;
            // Data to send for transfer of fund
            let { //amount, id, 
                userId,
                firstName, //lastName,
                walletId,
                // phone,
                // email,
                currencyCode,
                rfiCode,// interestDueOnInvestment,
                // principalPayoutRequestReference, interestPayoutRequestReference
            } = record;
            // let beneficiaryName = `${firstName} ${lastName}`;
            // let beneficiaryAccountNumber = walletId;
            // let beneficiaryAccountName = beneficiaryName;
            // let beneficiaryPhoneNumber = phone;
            // let beneficiaryEmail = email;
            // Send to the endpoint for debit of wallet
            // let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
            // let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
            // NEW CODE START
            // let creditUserWalletWithPrincipal;
            // let creditUserWalletWithInterest;
            const investmentId = investment.id;
            // debugger
            // let { amount, investmentTypeId, rfiCode, walletId, userId, firstName, duration, currencyCode } = payload;
            let timelineObject;

            let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // debugger
            // console.log(" Current log, line 1303 :", currentInvestment);
            // send for update
            await this.updateInvestment(currentInvestment, investment);
            const settingsService = new SettingsServices();
            const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
            if (!settings) {
                throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
            }
            investment.approvedBy = investment.approvedBy !== undefined ? investment.approvedBy : "automation"
            investment.assignedTo = investment.assignedTo !== undefined ? investment.assignedTo : "automation"

            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 790 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);

            //  To be changed for interest Start

            let amountPaidOut = amountPaid; // amount; 
            let decPl = 3;
            amountPaidOut = Number(amountPaidOut.toFixed(decPl));
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            if (record.status == 'completed_with_interest_payout_outstanding') {
                record.status = 'completed';
            } else {
                record.status = 'completed_with_principal_payout_outstanding';
            }

            // record.principalPayoutStatus = 'failed';
            record.interestPayoutStatus = 'completed';
            // record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // debugger
            // Save the updated record
            // await record.save();
            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 1369 :", currentInvestment);
            // send for update
            const trx = await Database.transaction();
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1372 :", updatedInvestment);
            // console.log("Updated record Status line 1374: ", record);
            // commit transaction and changes to database
            await trx.commit();
            // update timeline
            timelineObject = {
                id: uuid(),
                action: "investment payout",
                investmentId: investmentId,//id,
                walletId: walletId,// walletId,
                userId: userId,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the Interest for your matured investment has been paid out, please check your account. Thank you.`,
                createdAt: DateTime.now(),
                metadata: ``,
            };
            // console.log("Timeline object line 1388:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1391:", newTimeline);
            // update record
            // Send Notification to admin and others stakeholder
            // let investment = record;
            let messageKey = "payout";
            investment = record;
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 4948:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
            }

            debugger
            return investment;
            //  To be changed for interest End
            // END
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async getInvestments(queryParams: any): Promise<Investment[] | any> {
        try {
            console.log("Query params in investment service:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, } = queryParams;
            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
            }

            // console.log(" updatedAtFrom line 406 ==============================================================");
            // console.log(queryParams);
            // debugger;
            const queryGetter = await this.queryBuilder(queryParams)
            // debugger;
            let responseData = await Investment.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            // console.log("Response data in investment service:", responseData)
            // debugger;
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async collateAboutToBeMatureInvestment(queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 40:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo, numberOfDaysFromToday, numberOfDaysBeforeToday } = queryParams;

            if (!numberOfDaysFromToday) {
                numberOfDaysFromToday = 1; // i.e tomorrow
            }
            if (!numberOfDaysBeforeToday) {
                numberOfDaysBeforeToday = 90; // i.e 3 months
            }
            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months, i.e 90 days
                queryParams.payoutDateFrom = DateTime.now().minus({ days: numberOfDaysBeforeToday }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: numberOfDaysBeforeToday }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().plus({ days: numberOfDaysFromToday }).toISO();//.toISODate();
                payoutDateTo = DateTime.now().plus({ days: numberOfDaysFromToday }).toISO();//.toISODate();
            }
            // console.log("queryParams line 142 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 149 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 151 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', "active")
                // .where('payout_date', '>=', payoutDateFrom)
                // .where('payout_date', '<=', payoutDateTo)
                .where('payout_date', '=', payoutDateTo)
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log("Investment Info, line 583: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no active investment or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no active investment or payout has been completed. Please, check and try again.`, codeSt: "500" })
            }

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                const trx = await Database.transaction();
                try {
                    // const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    // let currentDate = DateTime.now().toISO()
                    // @ts-ignore
                    // let id = request.input('userId')
                    // let { userId, investmentId } = request.all()
                    // let { userId, investmentId } = investment;//request.all()
                    // console.log('Params for update line 956: ' + ' userId: ' + userId + ', investmentId: ' + id)
                    // let investment = await Investment.query().where('user_id', id).where('id', params.id)
                    // let investment = await Investment.query().where('id', investmentId)
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 961: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "active") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for payout status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        // let duration = 4
                        // console.log('Time investment was started line 973: ', startDate)
                        // let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        // console.log('Is due for payout status line 976:', isDueForPayout)
                        // let amt = investment.amount
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        // console.log('Approval setting line 984:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                   rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    await approvalsService.createApproval(approvalObject);
                                    // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    // console.log("new ApprovalRequest object line 1040:", newApprovalRequest);
                                }


                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                // START
                                // console.log('Updated investment Status line 1379: ', investment)
                                // console.log('Payout investment data line 1380:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1655 :", updatedInvestment);
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'active') {
                                    // update status of investment
                                    // investment.requestType = requestType
                                    // investment.approvalStatus = 'approved'
                                    // investment.status = 'matured'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 1119 :", updatedInvestment);
                                    // const approvalsService = new ApprovalsServices()
                                    let approvalObject;

                                    // TODO: Send to the Admin for approval
                                    // update approvalObject
                                    approvalObject = {
                                        rfiCode:rfiCode,
                                        walletId: walletId,
                                        investmentId: investmentId,
                                        userId: userId,
                                        requestType: requestType,//"start_investment",
                                        approvalStatus: "pending",//approvalStatus,//"",
                                        assignedTo: "",//investment.assignedTo,
                                        processedBy: "",//investment.processedBy,
                                        // remark: "",
                                    };
                                    // console.log("ApprovalRequest object line 1134:", approvalObject);
                                    // check if the approval request is not existing
                                    let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                    if (!approvalRequestIsExisting) {
                                        await approvalsService.createApproval(approvalObject);
                                        // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                        // console.log("new ApprovalRequest object line 1040:", newApprovalRequest);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 680 :", updatedInvestment);
                            }

                            // console.log('Investment data after payout request line 685:', investment)
                            await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        } else if (isDueForPayout === false) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }

                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1248:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 1253:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                // START
                                // console.log('Updated investment Status line 1379: ', investment)
                                // console.log('Payout investment data line 1380:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1294 :", updatedInvestment);
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'active') {

                                    // const approvalsService = new ApprovalsServices()
                                    let approvalObject;

                                    // TODO: Send to the Admin for approval
                                    // update approvalObject
                                    approvalObject = {
                                        rfiCode:rfiCode,
                                        walletId: walletId,
                                        investmentId: investmentId,
                                        userId: userId,
                                        requestType: requestType,//"start_investment",
                                        approvalStatus: "pending",//approvalStatus,//"",
                                        assignedTo: "",//investment.assignedTo,
                                        processedBy: "",//investment.processedBy,
                                        // remark: "",
                                    };
                                    // console.log("ApprovalRequest object line 1314:", approvalObject);
                                    // check if the approval request is not existing
                                    let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                    if (!approvalRequestIsExisting) {
                                        let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                        console.log("new ApprovalRequest object line 1319:", newApprovalRequest);
                                    }

                                    // investment = await Investment.query().where('id', investmentId)
                                    investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                    // investment.requestType = requestType
                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1347 :", updatedInvestment);
                            }

                            // console.log('Investment data after payout request line 685:', investment)
                            await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 494");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 1353", error.messages);
                    console.log("Error line 1354", error.message);
                    await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 1367:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 516:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async collateMaturedInvestment(queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 40:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 142 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 149 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 151 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', "active")
                // .where('payout_date', '>=', payoutDateFrom)
                .where('payout_date', '<=', payoutDateTo)
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log("Investment Info, line 583: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no active investment or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no active investment or payout has been completed. Please, check and try again.`, codeSt: "500" })
            }

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    // let currentDate = DateTime.now().toISO()
                    // @ts-ignore
                    // let id = request.input('userId')
                    // let { userId, investmentId } = request.all()
                    // let { userId, investmentId } = investment;//request.all()
                    // console.log('Params for update line 494: ' + ' userId: ' + userId + ', investmentId: ' + id)
                    // let investment = await Investment.query().where('user_id', id).where('id', params.id)
                    // let investment = await Investment.query().where('id', investmentId)
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 499: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "active") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for payout status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        // let duration = 4
                        // console.log('Time investment was started line 1469: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 1472:', isDueForPayout)
                        // let amt = investment.amount
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 1480:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 1585:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = requestType
                                investment.status = "matured";
                                investment.approvalStatus = 'pending';
                                investment.isPayoutSuspended = false;

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout initiated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName}, your investment has just been sent for payout processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 1429:', timelineObject)
                                //  Push the new object to the array
                                // timeline = investment.timeline
                                // timeline.push(timelineObject)
                                // console.log('Timeline object line 1433:', timeline)
                                // stringify the timeline array
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "payout_initiation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 1605:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // START
                                // console.log('Updated investment Status line 1379: ', investment)
                                // console.log('Payout investment data line 1380:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // Check if the user set Rollover
                                // "rolloverType": "101",
                                // "rolloverTarget": 3,
                                // "rolloverDone": 0,
                                // '100' = 'no rollover',
                                //   '101' = 'rollover principal only',
                                //   '102' = 'rollover principal with interest',
                                // if (investment.rolloverTarget > 0 && investment.rolloverTarget > investment.rolloverDone && investment.rolloverType !== "100") {
                                //   // check type of rollover

                                //   if (investment.rollOverType == "101") {

                                //   } else if (investment.rollOverType == "101") {

                                //   }
                                // } else {

                                // }

                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1655 :", updatedInvestment);
                                await trx.commit();
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'active') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'matured'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 654 :", updatedInvestment);
                                    await trx.commit();
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout initiated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName}, your investment has just been sent for payout processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 667:', timelineObject)
                                    //  Push the new object to the array
                                    // timeline = investment.timeline
                                    // timeline.push(timelineObject)
                                    // console.log('Timeline object line 671:', timeline)
                                    // stringify the timeline array
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "payout_initiation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 1705:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }


                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 680 :", updatedInvestment);
                                await trx.commit();
                            }

                            // console.log('Investment data after payout request line 685:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        // await trx.rollback();
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 494");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 1709", error.messages);
                    console.log("Error line 1710", error.message);
                    // await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 1723:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 516:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }


    public async activateApprovedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 40:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 142 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 149 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 151 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', "investment_approved")
                .where('request_type', "start_investment")
                .orWhere('request_type', "start_investment_rollover")
                .where('approval_status', "approved")
                // .where('payout_date', '<=', payoutDateTo)
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log("Investment Info, line 1811: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no approved investment that is yet to be activated or wallet has been successfully debited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is yet to be activated or wallet has been successfully debited. Please, check and try again.`, codeSt: "404" })
            }

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                debugger
                try {
                    console.log("Entering update 1823 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 1843 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 1851 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 1853 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 1857 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 1859 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 1874 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 1875 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 1876 ===================================", approval.tokenId)
                    // console.log("cardId line 1877 ===================================", approval.cardId)
                    // console.log("accountId line 1878 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 1837 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        // await trx.isCompleted()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);

                    if (investment) {
                        console.log("Investment approval Selected for Update line 1845:");
                        // update the data
                        // TODO: Uncomment to use loginAdminFullName
                        // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                        // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                        // payload.remark = remark !== undefined ? remark : approval.remark;
                        // console.log("Admin remark line 1902 ==================== ", approval.remark);
                        // console.log("Admin remark line 1903 ========*******************=========== ", remark);
                        // let newStatus;
                        // await approval.save();
                        // console.log("Update Approval Request line 1906:", approval);
                        let { currencyCode, lastName, } = record;
                        console.log("Surname: ", lastName)
                        // console.log("CurrencyCode: ", currencyCode)
                        // debugger
                        // let email = email;
                        let timelineObject;
                        // console.log("Approval.requestType: ===========================================>", approval.requestType)
                        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                        if ((record.status === "investment_approved" && record.requestType === "start_investment" && record.approvalStatus === "approved") || (record.status === "investment_approved" && record.requestType === "start_investment_rollover" && record.approvalStatus === "approved")) { //&& record.status == "submitted"
                            console.log("Activation for investment request processing line 2007: ===========================================>")
                            // TODO: Uncomment to use loginAdminFullName
                            // record.processedBy = loginAdminFullName;
                            // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                            // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                            // record.approvalStatus = approval.approvalStatus;

                            // console.log("Updated record Status line 1923: ", record);
                            // Data to send for transfer of fund
                            let { amount, lng, lat, investmentRequestReference,
                                firstName, lastName, userId, walletId,
                                phone,
                                email,
                                rfiCode,numberOfAttempts } = record;
                            let senderName = `${firstName} ${lastName}`;
                            let senderAccountNumber = walletId;
                            let senderAccountName = senderName;
                            let senderPhoneNumber = phone;
                            let senderEmail = email;

                            // check if transaction with same customer ref exist
                            let checkTransactionStatusByCustomerRef = await checkTransactionStatus(investmentRequestReference,rfiCode);
                            debugger
                            // if ( checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                              if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                // initiate a new  transaction
                                // Send to the endpoint for debit of wallet
                                // debugger
                                let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                                    senderName,
                                    senderAccountNumber,
                                    senderAccountName,
                                    senderPhoneNumber,
                                    senderEmail,
                                    rfiCode)
                                debugger
                                // console.log("debitUserWalletForInvestment reponse data 1938 ==================================", debitUserWalletForInvestment)
                                // if successful
                                if (debitUserWalletForInvestment.status == 200) {
                                    // update the investment details
                                    record.status = 'active'
                                    // record.approvalStatus = 'approved'
                                    record.startDate = DateTime.now() //.toISODate()
                                    record.payoutDate = DateTime.now().plus({ days: record.duration })
                                    record.isInvestmentCreated = true
                                    // console.log("Updated record Status line 1946: ", record);

                                    // update record
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // debugger
                                    // console.log(" Current log, line 1951 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1955 =========:", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: "investment activation",
                                        investmentId: investmentId,//id,
                                        walletId: walletIdToSearch,// walletId,
                                        userId: userIdToSearch,// userId,
                                        // @ts-ignore
                                        message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated, please check your device. Thank you.`,
                                        createdAt: DateTime.now(),
                                        metadata: ``,
                                    };
                                    // console.log("Timeline object line 2084:", timelineObject);
                                    await timelineService.createTimeline(timelineObject);
                                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                                    // console.log("new Timeline object line 2087:", newTimeline);
                                    // update record
                                    // debugger
                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Activation";
                                    let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} has been activated.

                Please check your device.

                Thank you.

                AstraPay Investment.`;
                                    // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // // console.log("newNotificationMessage line 2070:", newNotificationMessage);
                                    // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    //     console.log("Notification sent successfully");
                                    // } else if (newNotificationMessage.message !== "Success") {
                                    //     console.log("Notification NOT sent successfully");
                                    //     console.log(newNotificationMessage);
                                    // }
                                    // START OF NEW NOTIFICATION WITH CERTIFICATE ATTACHMENT AS PDF
                                    let recepients = [
                                        {
                                            "email": email,
                                            "name": `${firstName} ${lastName} `
                                        },
                                        // {
                                        //   "email": activationNotificationEmail,
                                        //   "name": `${rfiName} `
                                        // },
                                    ];
                                    let newNotificationMessageWithPdf = await sendNotificationWithPdf(CERTIFICATE_URL, rfiCode, message, subject, recepients,);
                                    // console.log("newNotificationMessage line 2139:", newNotificationMessageWithPdf);
                                    // debugger
                                    if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithPdf);
                                    }
                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "activation";
                                    let investment = record;
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2081:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                    // debugger
                                } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                                    console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 2036 ============`);
                                    // debugger
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // console.log(" Current log, line 2039 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    await trx.rollback()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: "investment activation failed",
                                        investmentId: investmentId,//id,
                                        walletId: walletIdToSearch,// walletId,
                                        userId: userIdToSearch,// userId,
                                        // @ts-ignore
                                        message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again. Thank you.`,
                                        createdAt: DateTime.now(),
                                        metadata: ``,
                                    };
                                    // console.log("Timeline object line 1088:", timelineObject);
                                    await timelineService.createTimeline(timelineObject);
                                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                                    // console.log("new Timeline object line 1091:", newTimeline);
                                    // update record
                                    // debugger

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "activation_failed";
                                    let investment = record;
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2136:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1051 =========:", updatedInvestment);
                                    // console.log("debitUserWalletForInvestment reponse data 1052 ==================================", debitUserWalletForInvestment)
                                    // debugger
                                    // throw Error(debitUserWalletForInvestment);
                                    throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                                    // return {
                                    //         status: "FAILED",//debitUserWalletForInvestment.status,
                                    //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                                    //     };
                                }

                                // Save the updated record
                                // await record.save();
                                // update record
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // debugger
                                // console.log(" Current log, line 2114 :", currentInvestment);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(currentInvestment, record);
                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                // console.log(" Current log, line 2118 =========:", updatedInvestment);
                                await trx.commit();

                            } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                // update the value for number of attempts
                                // get the current investmentRef, split , add one to the current number, update and try again
                                let getNumberOfAttempt = investmentRequestReference.split("-");
                                console.log("getNumberOfAttempt line 2121 =====", getNumberOfAttempt[1]);
                                let updatedNumberOfAttempts = numberOfAttempts + 1 ;// Number(getNumberOfAttempt[1]) + 1;
                                let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                let newPaymentReference = `${uniqueInvestmentRequestReference}-${updatedNumberOfAttempts}`;
                                console.log("Customer Transaction Reference ,@ InvestmentsServices line 2125 ==================")
                                console.log(newPaymentReference);
                                investmentRequestReference = newPaymentReference;
                                record.investmentRequestReference = newPaymentReference;
                                record.numberOfAttempts = updatedNumberOfAttempts;
                                // Send to the endpoint for debit of wallet
                                debugger
                                let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                                    senderName,
                                    senderAccountNumber,
                                    senderAccountName,
                                    senderPhoneNumber,
                                    senderEmail,
                                    rfiCode)
                                debugger
                                // console.log("debitUserWalletForInvestment reponse data 2138 ==================================", debitUserWalletForInvestment)
                                // if successful
                                if (debitUserWalletForInvestment.status == 200) {
                                    // update the investment details
                                    record.status = 'active'
                                    // record.approvalStatus = 'approved'
                                    record.startDate = DateTime.now() //.toISODate()
                                    record.payoutDate = DateTime.now().plus({ days: record.duration })
                                    record.isInvestmentCreated = true
                                    // console.log("Updated record Status line 2147: ", record);

                                    // update record
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // debugger
                                    // console.log(" Current log, line 2152 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 2157 =========:", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: "investment activation",
                                        investmentId: investmentId,//id,
                                        walletId: walletIdToSearch,// walletId,
                                        userId: userIdToSearch,// userId,
                                        // @ts-ignore
                                        message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated, please check your device. Thank you.`,
                                        createdAt: DateTime.now(),
                                        metadata: ``,
                                    };
                                    // console.log("Timeline object line 2171:", timelineObject);
                                    await timelineService.createTimeline(timelineObject);
                                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                                    // console.log("new Timeline object line 2174:", newTimeline);
                                    // update record
                                    // debugger
                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Activation";
                                    let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} has been activated.

                Please check your device.

                Thank you.

                AstraPay Investment.`;
                                    // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // // console.log("newNotificationMessage line 2070:", newNotificationMessage);
                                    // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    //     console.log("Notification sent successfully");
                                    // } else if (newNotificationMessage.message !== "Success") {
                                    //     console.log("Notification NOT sent successfully");
                                    //     console.log(newNotificationMessage);
                                    // }
                                    // START OF NEW NOTIFICATION WITH CERTIFICATE ATTACHMENT AS PDF
                                    let recepients = [
                                        {
                                            "email": email,
                                            "name": `${firstName} ${lastName} `
                                        },
                                        // {
                                        //   "email": activationNotificationEmail,
                                        //   "name": `${rfiName} `
                                        // },
                                    ];
                                    let newNotificationMessageWithPdf = await sendNotificationWithPdf(CERTIFICATE_URL, rfiCode, message, subject, recepients,);
                                    // console.log("newNotificationMessage line 2207:", newNotificationMessageWithPdf);
                                    // debugger
                                    if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithPdf);
                                    }
                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "activation";
                                    let investment = record;
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2219:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                    // debugger
                                } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                                    console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 2036 ============`);
                                    // debugger
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // console.log(" Current log, line 2233 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    await trx.rollback()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: "investment activation failed",
                                        investmentId: investmentId,//id,
                                        walletId: walletIdToSearch,// walletId,
                                        userId: userIdToSearch,// userId,
                                        // @ts-ignore
                                        message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again. Thank you.`,
                                        createdAt: DateTime.now(),
                                        metadata: ``,
                                    };
                                    // console.log("Timeline object line 1088:", timelineObject);
                                    await timelineService.createTimeline(timelineObject);
                                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                                    // console.log("new Timeline object line 1091:", newTimeline);
                                    // update record
                                    // debugger

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "activation_failed";
                                    let investment = record;
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2136:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1051 =========:", updatedInvestment);
                                    // console.log("debitUserWalletForInvestment reponse data 1052 ==================================", debitUserWalletForInvestment)
                                    // debugger
                                    // throw Error(debitUserWalletForInvestment);
                                    throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                                    // return {
                                    //         status: "FAILED",//debitUserWalletForInvestment.status,
                                    //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                                    //     };
                                }

                                // Save the updated record
                                // await record.save();
                                // update record
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // debugger
                                // console.log(" Current log, line 2287 :", currentInvestment);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(currentInvestment, record);
                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                // console.log(" Current log, line 2292 =========:", updatedInvestment);
                                await trx.commit();
                            }

                        }
                        // Update Investment data
                        // console.log(" Updated record line 2464: ", record.$original);
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                        // send to user
                        // await trx.commit();
                        // await trx.rollback();
                        return {
                            status: 'OK',
                            data: currentInvestment,
                        }
                    } else {
                        // console.log("Entering no data 2475 ==================================")
                        // await trx.commit()
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 2487", error.messages);
                    console.log("Error line 2488", error.message);
                    // console.log("Error line 2489", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 2492, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 2503 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 2509:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }


    public async reactivateSuspendedPayoutInvestment(queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 2240:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo, payoutReactivationDate } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }

            if (!payoutReactivationDate) {
                queryParams.payoutReactivationDate = DateTime.now().toISO();//.toISODate();
                payoutReactivationDate = DateTime.now().toISO();//.toISODate();
            }

            // console.log("queryParams line 2190 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 2192 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 2194 =========================")
            // console.log(updatedAtTo)

            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData;
            if (payoutReactivationDate) {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('status', "payout_suspended")
                    .where('is_payout_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                    .where('approval_status', "suspend_payout")
                    .offset(offset)
                    .limit(limit)
                // debugger
            } else {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('status', "payout_suspended")
                    .where('is_payout_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    // .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                    .where('approval_status', "suspend_payout")
                    .offset(offset)
                    .limit(limit)
                // debugger
            }
            //    responseData  = await Database
            //         .from('investments')
            //         .useTransaction(trx) // 👈
            //         .where('status', "payout_suspended")
            //         .where('is_payout_suspended', true)
            //         // .where('payout_date', '>=', payoutDateFrom)
            //         .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
            //         .where('approval_status', "suspend_payout")
            //         .offset(offset)
            //         .limit(limit)
            // .forUpdate()

            // console.log("Investment Info, line 2213: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no suspended investment payout or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no suspended investment payout or payout has been completed. Please, check and try again.`, codeSt: "500" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    // let currentDate = DateTime.now().toISO()
                    // @ts-ignore
                    // let id = request.input('userId')
                    // let { userId, investmentId } = request.all()
                    // let { userId, investmentId } = investment;//request.all()
                    // console.log('Params for update line 2326: ' + ' userId: ' + userId + ', investmentId: ' + id)
                    // let investment = await Investment.query().where('user_id', id).where('id', params.id)
                    // let investment = await Investment.query().where('id', investmentId)
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 2331: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "payout_suspended") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for payout status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        // let duration = 4
                        console.log('Time investment was started line 2249: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 2252:', isDueForPayout)
                        // let amt = investment.amount
                        // debugger
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        // console.log('Approval setting line 2260:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2316:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = requestType
                                investment.status = "matured"
                                investment.approvalStatus = 'pending'
                                investment.isPayoutSuspended = false;

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 2337:', timelineObject)
                                //  Push the new object to the array
                                // timeline = investment.timeline
                                // timeline.push(timelineObject)
                                // console.log('Timeline object line 2341:', timeline)
                                // stringify the timeline array
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)
                                // Send Notification to admin and others stakeholder
                                // let investment = record;
                                let messageKey = "payout_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 2463:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // START
                                // console.log('Updated investment Status line 2368: ', investment)
                                // console.log('Payout investment data line 2386:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2379 :", updatedInvestment);
                                await trx.commit();
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'payout_suspended') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'matured'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 2394 :", updatedInvestment);
                                    await trx.commit();
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 2830:', timelineObject)
                                    //  Push the new object to the array
                                    // timeline = investment.timeline
                                    // timeline.push(timelineObject)
                                    // console.log('Timeline object line 2834:', timeline)
                                    // stringify the timeline array
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "payout_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2545:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2559 :", updatedInvestment);
                                await trx.commit();
                            }

                            // console.log('Investment data after payout request line 2860:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        } else if (isDueForPayout === false) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2316:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = "start_investment"; //requestType
                                investment.status = "active"
                                investment.approvalStatus = 'pending'
                                investment.isPayoutSuspended = false;

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 2337:', timelineObject)
                                //  Push the new object to the array
                                // timeline = investment.timeline
                                // timeline.push(timelineObject)
                                // console.log('Timeline object line 2341:', timeline)
                                // stringify the timeline array
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "payout_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 2677:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // START
                                // console.log('Updated investment Status line 2368: ', investment)
                                // console.log('Payout investment data line 2386:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2379 :", updatedInvestment);
                                await trx.commit();
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'payout_suspended') {
                                    // update status of investment
                                    investment.requestType = "start_investment";//requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'active'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 2394 :", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 2691:', timelineObject)
                                    //  Push the new object to the array
                                    // timeline = investment.timeline
                                    // timeline.push(timelineObject)
                                    // console.log('Timeline object line 2695:', timeline)
                                    // stringify the timeline array
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "payout_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 2758:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2772 :", updatedInvestment);
                                await trx.commit();
                            }

                            // console.log('Investment data after payout request line 2729:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 2743");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 2758", error.messages);
                    console.log("Error line 2759", error.message);
                    // await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 2766:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 2772:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async reactivateSuspendedPayoutInvestmentByInvestmentId(investmentId: string, queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 2240:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo, payoutReactivationDate } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }

            // if (!payoutReactivationDate) {
            //     queryParams.payoutReactivationDate = DateTime.now().toISO();//.toISODate();
            //     payoutReactivationDate = DateTime.now().toISO();//.toISODate();
            // }

            // console.log("queryParams line 2190 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 2192 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 2194 =========================")
            // console.log(updatedAtTo)

            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData;
            if (payoutReactivationDate) {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('id', investmentId)
                    .where('status', "payout_suspended")
                    .where('is_payout_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                    .where('approval_status', "suspend_payout")
                    .offset(offset)
                    .limit(limit)
                // debugger
            } else {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('id', investmentId)
                    .where('status', "payout_suspended")
                    .where('is_payout_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    // .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                    .where('approval_status', "suspend_payout")
                    .offset(offset)
                    .limit(limit)
                // debugger
            }
            // .forUpdate()

            // console.log("Investment Info, line 2213: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no suspended investment payout or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no suspended investment payout or payout has been completed. Please, check and try again.`, codeSt: "500" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 2331: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "payout_suspended") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        console.log('Time investment was started line 2249: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 2252:', isDueForPayout)
                        // let amt = investment.amount
                        // debugger
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 2260:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2316:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = requestType
                                investment.status = "matured"
                                investment.approvalStatus = 'pending'
                                investment.isPayoutSuspended = false;

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 2337:', timelineObject)
                                //  Push the new object to the array
                                // timeline = investment.timeline
                                // timeline.push(timelineObject)
                                // console.log('Timeline object line 2341:', timeline)
                                // stringify the timeline array
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "payout_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 3048:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // START
                                // console.log('Updated investment Status line 3058: ', investment)
                                // console.log('Payout investment data line 3059:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2379 :", updatedInvestment);
                                await trx.commit()
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'payout_suspended') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'matured'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 2394 :", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 667:', timelineObject)
                                    //  Push the new object to the array
                                    // timeline = investment.timeline
                                    // timeline.push(timelineObject)
                                    // console.log('Timeline object line 671:', timeline)
                                    // stringify the timeline array
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "payout_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 3128:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 680 :", updatedInvestment);
                                await trx.commit()
                            }

                            // console.log('Investment data after payout request line 685:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        } else if (isDueForPayout === false) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 1194:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2316:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = "start_investment"; //requestType
                                investment.status = "active"
                                investment.approvalStatus = 'pending'
                                investment.isPayoutSuspended = false;

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 2337:', timelineObject)
                                //  Push the new object to the array
                                // timeline = investment.timeline
                                // timeline.push(timelineObject)
                                // console.log('Timeline object line 2341:', timeline)
                                // stringify the timeline array
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "payout_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 3260:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // START
                                // console.log('Updated investment Status line 2368: ', investment)
                                // console.log('Payout investment data line 2386:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2379 :", updatedInvestment);
                                await trx.commit()
                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'payout_suspended') {
                                    // update status of investment
                                    investment.requestType = "start_investment";//requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'active'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 2394 :", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} ,your investment has just been sent for payout processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 2691:', timelineObject)
                                    //  Push the new object to the array
                                    // timeline = investment.timeline
                                    // timeline.push(timelineObject)
                                    // console.log('Timeline object line 2695:', timeline)
                                    // stringify the timeline array
                                    await timelineService.createTimeline(timelineObject);
                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "payout_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 3342:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2726 :", updatedInvestment);
                                await trx.commit()
                            }

                            // console.log('Investment data after payout request line 2729:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 2743");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 2758", error.messages);
                    console.log("Error line 2759", error.message);
                    // await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 2766:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 2772:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async reactivateSuspendedRolloverInvestment(queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 2800:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo, rolloverReactivationDate } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }

            if (!rolloverReactivationDate) {
                queryParams.rolloverReactivationDate = DateTime.now().toISO();//.toISODate();
                rolloverReactivationDate = DateTime.now().toISO();//.toISODate();
            }

            // console.log("queryParams line 2820 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 2822 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 2824 =========================")
            // console.log(updatedAtTo)

            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData;
            if (rolloverReactivationDate) {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('status', "rollover_suspended")
                    .where('is_rollover_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    .orWhere('rollover_reactivation_date', '<=', rolloverReactivationDate)
                    .where('approval_status', "suspend_rollover")
                    .offset(offset)
                    .limit(limit)
                // debugger
            } else {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('status', "rollover_suspended")
                    .where('is_rollover_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    // .orWhere('rollover_reactivation_date', '<=', rolloverReactivationDate)
                    .where('approval_status', "suspend_rollover")
                    .offset(offset)
                    .limit(limit)
                // debugger
            }
            // console.log("Investment Info, line 2867: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no suspended investment rollover or rollover has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no suspended investment rollover or rollover has been completed. Please, check and try again.`, codeSt: "404" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    // let currentDate = DateTime.now().toISO()
                    // @ts-ignore
                    // let id = request.input('userId')
                    // let { userId, investmentId } = request.all()
                    // let { userId, investmentId } = investment;//request.all()
                    // console.log('Params for update line 2888: ' + ' userId: ' + userId + ', investmentId: ' + id)
                    // let investment = await Investment.query().where('user_id', id).where('id', params.id)
                    // let investment = await Investment.query().where('id', investmentId)
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 2892: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "rollover_suspended") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for rollover status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        // let duration = 4
                        console.log('Time investment was started line 2904: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 2907:', isDueForPayout)
                        // let amt = investment.amount
                        // debugger
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 2916:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 2940: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 2943 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 2967:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2972:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = requestType
                                investment.status = "matured"
                                investment.approvalStatus = 'pending'
                                // investment.isPayoutSuspended = false;
                                investment.isRolloverSuspended = false;

                                // START
                                // console.log('Updated investment Status line 3017: ', investment)
                                // console.log('Payout investment data line 3018:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3028 :", updatedInvestment);
                                await trx.commit()
                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment rollover reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 3815:', timelineObject)
                                await timelineService.createTimeline(timelineObject);

                                // Send Notification to admin and others stakeholder
                                let messageKey = "rollover_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 3634:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }

                                // debugger
                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'rollover_suspended') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'matured'
                                    // investment.isPayoutAuthorized = true
                                    // investment.isTerminationAuthorized = true
                                    investment.isRolloverSuspended = false;
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 3045 :", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment rollover reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 3741:', timelineObject)
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "rollover_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 3710:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3087 :", updatedInvestment);
                                await trx.commit()
                            }

                            // console.log('Investment data after rollover request line 685:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        } else if (isDueForPayout === false) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 3145:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 3150:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = "start_investment"; //requestType
                                investment.status = "active"
                                investment.approvalStatus = 'pending'
                                // investment.isPayoutSuspended = false;
                                investment.isRolloverSuspended = false;

                                // START
                                // console.log('Updated investment Status line 3198: ', investment)
                                // console.log('Payout investment data line 3199:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3209 :", updatedInvestment);
                                await trx.commit()
                                // debugger
                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment rollover reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 3173:', timelineObject)
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "rollover_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 3837:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }


                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'rollover_suspended') {
                                    // update status of investment
                                    investment.requestType = "start_investment";//requestType
                                    investment.approvalStatus = 'approved';
                                    investment.status = 'active';
                                    // investment.isPayoutAuthorized = true;
                                    // investment.isTerminationAuthorized = true;
                                    investment.isRolloverSuspended = false;
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 3225 :", updatedInvestment);
                                    await trx.commit()

                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment rollover reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 3238:', timelineObject)
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "rollover_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 3913:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3273 :", updatedInvestment);
                                await trx.commit()
                            }

                            // console.log('Investment data after rollover request line 3276:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 3285");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 3298", error.messages);
                    console.log("Error line 3299", error.message);
                    // await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 3308:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 3314:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async reactivateSuspendedRolloverInvestmentByInvestmentId(investmentId: string, queryParams: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 2800:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo, rolloverReactivationDate } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }

            // if (!rolloverReactivationDate) {
            //     queryParams.rolloverReactivationDate = DateTime.now().toISO();//.toISODate();
            //     rolloverReactivationDate = DateTime.now().toISO();//.toISODate();
            // }

            // console.log("queryParams line 2820 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 2822 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 2824 =========================")
            // console.log(updatedAtTo)

            offset = Number(offset);
            limit = Number(limit);
            //    const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            let responseData;
            if (rolloverReactivationDate) {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('id', investmentId)
                    .where('status', "rollover_suspended")
                    .where('is_rollover_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    .orWhere('rollover_reactivation_date', '<=', rolloverReactivationDate)
                    .where('approval_status', "suspend_rollover")
                    .offset(offset)
                    .limit(limit)
                // debugger
            } else {
                responseData = await Database
                    .from('investments')
                    // .useTransaction(trx) // 👈
                    .where('id', investmentId)
                    .where('status', "rollover_suspended")
                    .where('is_rollover_suspended', true)
                    // .where('payout_date', '>=', payoutDateFrom)
                    // .orWhere('rollover_reactivation_date', '<=', rolloverReactivationDate)
                    .where('approval_status', "suspend_rollover")
                    .offset(offset)
                    .limit(limit)
                // debugger
            }
            // console.log("Investment Info, line 2867: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no suspended investment rollover or rollover has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no suspended investment rollover or rollover has been completed. Please, check and try again.`, codeSt: "404" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    const approvalsService = new ApprovalsServices()
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 2892: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "rollover_suspended") {
                        // console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        console.log('Time investment was started line 2904: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 2907:', isDueForPayout)
                        // debugger
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 2916:', settings)
                        // let { isPayoutAutomated, fundingSourceTerminal, isInvestmentAutomated, isRolloverAutomated, } = settings;
                        let { isPayoutAutomated, } = settings;
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 2940: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 2943 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 2967:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 2972:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = requestType
                                investment.status = "matured"
                                investment.approvalStatus = 'pending'
                                // investment.isPayoutSuspended = false;
                                investment.isRolloverSuspended = false;

                                // START
                                // console.log('Updated investment Status line 4201: ', investment)
                                // console.log('Payout investment data line 4202:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 4294 :", updatedInvestment);
                                await trx.commit()
                                // debugger

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment rollover reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 4310:', timelineObject)
                                await timelineService.createTimeline(timelineObject);

                                // Send Notification to admin and others stakeholder
                                let messageKey = "rollover_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 4316:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }


                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'rollover_suspended') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'matured'
                                    // investment.isPayoutAuthorized = true
                                    // investment.isTerminationAuthorized = true
                                    investment.isRolloverSuspended = false;
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 3045 :", updatedInvestment);
                                    await trx.commit()

                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment rollover reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 667:', timelineObject)
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "rollover_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 3899:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 4282 :", updatedInvestment);
                                await trx.commit();
                            }

                            // console.log('Investment data after rollover request line 4285:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        } else if (isDueForPayout === false) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            // let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'
                            // let { firstName, email } = payload;
                            let approvalIsAutomated = isPayoutAutomated; // settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
                                // approvalRequestIsExisting = await Approval.query().where({
                                //   investment_id: investmentId,
                                //   user_id: userId,
                                //   request_type: requestType,
                                //   //  approval_status: approvalStatus,
                                // })

                                // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
                                // if (approvalRequestIsExisting.length < 1) {
                                //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                                //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
                                //   if (approvalRequestIsDone === undefined) {
                                //     return response.status(400).json({
                                //       status: 'OK',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }
                                // const approvalsService = new ApprovalsServices()
                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
                                    rfiCode:rfiCode,
                                    walletId: walletId,
                                    investmentId: investmentId,
                                    userId: userId,
                                    requestType: requestType,//"start_investment",
                                    approvalStatus: "pending",//approvalStatus,//"",
                                    assignedTo: "",//investment.assignedTo,
                                    processedBy: "",//investment.processedBy,
                                    // remark: "",
                                };
                                // console.log("ApprovalRequest object line 3145:", approvalObject);
                                // check if the approval request is not existing
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
                                if (!approvalRequestIsExisting) {
                                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                    console.log("new ApprovalRequest object line 3150:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                investment.requestType = "start_investment"; //requestType
                                investment.status = "active"
                                investment.approvalStatus = 'pending'
                                // investment.isPayoutSuspended = false;
                                investment.isRolloverSuspended = false;

                                // START
                                // console.log('Updated investment Status line 3198: ', investment)
                                // console.log('Payout investment data line 3199:', payload)
                                payload.investmentId = investmentId
                                payload.requestType = requestType
                                // debugger
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3209 :", updatedInvestment);
                                await trx.commit();
                                // debugger
                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment rollover reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId,
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                    createdAt: DateTime.now(),
                                    metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                }
                                // console.log('Timeline object line 3173:', timelineObject)
                                await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)

                                // Send Notification to admin and others stakeholder
                                let messageKey = "rollover_reactivation";
                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                // console.log("newNotificationMessage line 4395:", newNotificationMessageWithoutPdf);
                                // debugger
                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessageWithoutPdf);
                                }


                            } else if (isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'completed' && investment.status == 'rollover_suspended') {
                                    // update status of investment
                                    investment.requestType = "start_investment";//requestType
                                    investment.approvalStatus = 'approved';
                                    investment.status = 'active';
                                    // investment.isPayoutAuthorized = true;
                                    // investment.isTerminationAuthorized = true;
                                    investment.isRolloverSuspended = false;
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 3225 :", updatedInvestment);
                                    await trx.commit()
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment rollover reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId,
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for rollover processing.`,
                                        createdAt: DateTime.now(),
                                        metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    }
                                    // console.log('Timeline object line 3238:', timelineObject)
                                    await timelineService.createTimeline(timelineObject);

                                    // Send Notification to admin and others stakeholder
                                    let messageKey = "rollover_reactivation";
                                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                    // console.log("newNotificationMessage line 4472:", newNotificationMessageWithoutPdf);
                                    // debugger
                                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessageWithoutPdf);
                                    }

                                }
                                // await investment save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                const trx = await Database.transaction();
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 3273 :", updatedInvestment);
                                await trx.commit()
                            }

                            // console.log('Investment data after rollover request line 3276:', investment)
                            // await trx.commit();
                            return {
                                status: 'OK',
                                data: investment//.map((inv) => inv.$original),
                            }
                            // END
                        }
                    } else {
                        // await trx.commit()
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'no investment matched your search',
                            data: [],
                        }
                        //                 console.log("No Investment is pending disbursement, line 3285");
                        //                 await trx.commit();
                        //                 return {
                        //                     status: "OK",
                        //                     message: "No Investment is pending disbursement.",
                        //                 };
                    }
                } catch (error) {
                    console.error(error)
                    console.log("Error line 3298", error.messages);
                    console.log("Error line 3299", error.message);
                    // await trx.rollback()
                    console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 3308:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 3314:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async payoutMaturedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 40:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 142 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 149 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 151 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);

            // const timelineService = new TimelinesServices();
            const settingsService = new SettingsServices();
            // TESTING
            let selectedDate;
            let currentDate = DateTime.now().toISO()

            if (payoutDateTo) {
                selectedDate = payoutDateTo;
            } else {
                selectedDate = currentDate;
            }
            // debugger
            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', 'matured')
                .andWhere('request_type', 'payout_investment')
                .andWhere('approval_status', 'approved')
                .andWhere('is_payout_successful', 'false')
                .andWhere('is_payout_suspended', 'false')
                .andWhere('is_rollover_activated', 'false')
                .andWhere('is_rollover_suspended', 'false')
                .andWhere('payout_date', '<=', selectedDate)
                .offset(offset)
                .limit(limit)

            // .andWhere('is_payout_suspended', 'false')
            // .orWhere('status', "completed_with_interest_payout_outstanding")
            // .orWhere('status', "completed_with_principal_payout_outstanding")
            // .andWhereNot('status', "completed")
            // .orWhere('is_rollover_activated', 'true')
            // .forUpdate()

            console.log(" responseData line 3391 ==============")
            console.log(responseData)
            // debugger
            if (responseData.length < 1) {
                console.log(`There is no approved investment that is matured for payout or wallet has been successfully credited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is matured for payout or wallet has been successfully credited. Please, check and try again.`, codeSt: "404" })
            }

            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    console.log("Entering update 2232 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 2252 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 1175 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 1177 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 1181 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 1186 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 1199 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 1200 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 1201 ===================================", approval.tokenId)
                    // console.log("cardId line 1202 ===================================", approval.cardId)
                    // console.log("accountId line 1203 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 2295 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);
                    let { rfiCode } = record;
                    const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                    if (!settings) {
                        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                    }
                    //  Check if investment payout is not suspended and activation is automated

                    // isAllPayoutSuspended
                    // isAllRolloverSuspended

                    let isAllPayoutSuspended = settings.isAllPayoutSuspended
                    if (isAllPayoutSuspended === false) {
                        if (investment) {
                            console.log("Investment approval Selected for Update line 6163:");
                            // update the data
                            // TODO: Uncomment to use loginAdminFullName
                            // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                            // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                            // payload.remark = remark !== undefined ? remark : approval.remark;
                            // console.log("Admin remark line 6169 ==================== ", approval.remark);
                            // console.log("Admin remark line 6170 ========*******************=========== ", remark);
                            // let newStatus;
                            // await approval.save();
                            // console.log("Update Approval Request line 3498:", approval);
                            let { currencyCode, lastName, startDate, duration } = record;
                            // let { currencyCode, lastName, startDate, duration } = record;
                            console.log("Surname: ", lastName)
                            // console.log("CurrencyCode: ", currencyCode)
                            // debugger
                            // let email = email;
                            let timelineObject;
                            // console.log("Approval.requestType: ===========================================>", approval.requestType)
                            // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                            // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                            // let duration = 4
                            console.log('Time investment was started line 6185: ', startDate)
                            // let timelineObject
                            // let timeline
                            let isDueForPayout = await dueForPayout(startDate, duration)
                            console.log('Is due for payout status line 6189:', isDueForPayout)
                            // debugger
                            if (isDueForPayout === true) {
                                //                          record.isPayoutAuthorized === true,
                                //   record.isPayoutSuspended === false,
                                // payoutReactivationDate: null,

                                // record.status === "matured" &&
                                //     record.status === "matured" &&

                                if ((record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false) || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                        record.isPayoutSuspended === false)) {
                                    console.log("Approval for investment payout processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // Data to send for transfer of fund
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber =investorFundingWalletId;// walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // NEW CODE START
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;
                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                    debugger
                                    // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 1142 ==================")
                                        console.log(paymentReference);
                                        let getNumberOfAttempt = paymentReference.split("/");
                                        console.log("getNumberOfAttempt line 6251 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        principalPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 6258 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger

                                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                                        console.log("getNumberOfAttempt line 6276 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 6280 ==================")
                                        console.log(newPaymentReference);
                                        principalPayoutRequestReference = newPaymentReference;
                                        record.principalPayoutRequestReference = principalPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 6286 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 6290 :", updatedInvestment);

                                        // console.log("Updated record Status line 6292: ", record);
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger;
                                    }

                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                    // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                      if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 6313 ==================")
                                        console.log(paymentReference);
                                        let getNumberOfAttempt = paymentReference.split("/");
                                        console.log("getNumberOfAttempt line 6315 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        interestPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 6322 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger

                                    } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                        console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 6412 ==================")
                                        console.log(newPaymentReference);
                                        interestPayoutRequestReference = newPaymentReference;
                                        record.interestPayoutRequestReference = interestPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 826 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 6421 :", updatedInvestment);

                                        // console.log("Updated record Status line 6423: ", record);
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger
                                    }

                                    // NEW CODE END

                                    // debugger
                                    // if successful
                                    // TO BE USED START

                                    let decPl = 3;
                                    if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = amount + interestDueOnInvestment;
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger


                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1302 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1313 :", updatedInvestment);

                                        // console.log("Updated record Status line 1315: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 551:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 553:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment);
                                        // console.log("newNotificationMessage line 4869:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                        let amountPaidOut = amount
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_interest_payout_outstanding';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'failed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1369 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1372 :", updatedInvestment);
                                        // console.log("Updated record Status line 1374: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 1388:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 1391:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        // let investment = record;
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 4948:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = interestDueOnInvestment
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_principal_payout_outstanding';
                                        record.principalPayoutStatus = 'failed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 5002 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 5003 :", updatedInvestment);
                                        // console.log("Updated record Status line 5009: ", record);
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 5024:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 5027:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 5028:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // debugger
                                    } else {
                                        console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1484 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 4605 :", updatedInvestment);
                                        // debugger
                                        await trx.commit();
                                        throw Error();
                                    }
                                    // TO BE USED END
                                } else {
                                    // console.log("Entering no data 4611 ==================================")
                                    // await trx.commit();
                                    // await trx.rollback();
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }
                            } else {
                                // await trx.rollback();
                                return {
                                    status: 'OK',
                                    message: 'this investment is not mature for payout.',
                                    data: [],
                                }
                            }
                        }
                    } else {
                        // await trx.rollback();
                        return {
                            status: 'OK',
                            message: 'Payout of investment is currently suspended.',
                            data: [],
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 4637", error.messages);
                    console.log("Error line 4638", error.message);
                    // console.log("Error line 4641", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 4644, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    // debugger
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 4656 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 4662:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async retryFailedPayoutOfMaturedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 3859:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 3882 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 3884 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 3886 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);
            const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            // TESTING
            let selectedDate;
            let currentDate = DateTime.now().toISO()

            if (payoutDateTo) {
                selectedDate = payoutDateTo;
            } else {
                selectedDate = currentDate;
            }
            // debugger
            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', "completed_with_interest_payout_outstanding")
                .orWhere('status', "completed_with_principal_payout_outstanding")
                .where('interest_payout_status', "failed")
                .orWhere('principal_payout_status', "failed")
                .andWhere('request_type', 'payout_investment')
                .andWhere('approval_status', 'approved')
                // .andWhere('is_payout_successful', 'false')
                // .andWhere('is_rollover_activated', 'false')
                // .andWhere('is_rollover_suspended', 'false')
                // .andWhere('is_payout_suspended', 'false')
                .andWhere('payout_date', '<=', selectedDate)
                .offset(offset)
                .limit(limit)

            // .andWhereNot('status', "completed")
            // .orWhere('is_rollover_activated', 'true')
            // .forUpdate()

            console.log(" responseData line 3924 ==============")
            console.log(responseData)
            // debugger
            if (responseData.length < 1) {
                console.log(`There is no approved investment that is matured for payout or wallet has been successfully credited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is matured for payout or wallet has been successfully credited. Please, check and try again.`, codeSt: "404" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    console.log("Entering update 5199 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 3956 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 3961 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 3963 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 3967 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 3972 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 1199 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 1200 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 1201 ===================================", approval.tokenId)
                    // console.log("cardId line 1202 ===================================", approval.cardId)
                    // console.log("accountId line 1203 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 2295 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);
                    let { rfiCode } = record;
                    const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                    if (!settings) {
                        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                    }
                    let isAllPayoutSuspended = settings.isAllPayoutSuspended
                    if (isAllPayoutSuspended === false) {
                        if (investment) {
                            console.log("Investment approval Selected for Update line 3272:");
                            // update the data
                            // TODO: Uncomment to use loginAdminFullName
                            // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                            // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                            // payload.remark = remark !== undefined ? remark : approval.remark;
                            // console.log("Admin remark line 1220 ==================== ", approval.remark);
                            // console.log("Admin remark line 1221 ========*******************=========== ", remark);
                            // let newStatus;
                            // await approval.save();
                            // console.log("Update Approval Request line 504:", approval);
                            let { currencyCode, lastName, startDate, duration, status } = record;
                            // let { currencyCode, lastName, startDate, duration } = record;
                            console.log("Surname: ", lastName)
                            // console.log("CurrencyCode: ", currencyCode)
                            // debugger
                            // let email = email;
                            let timelineObject;
                            // console.log("Approval.requestType: ===========================================>", approval.requestType)
                            // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                            // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                            // let duration = 4
                            console.log('Time investment was started line 2325: ', startDate)
                            // let timelineObject
                            // let timeline
                            let isDueForPayout = await dueForPayout(startDate, duration)
                            console.log('Is due for payout status line 2329:', isDueForPayout)
                            // debugger
                            if (isDueForPayout === true) {
                                //                          record.isPayoutAuthorized === true,
                                //   record.isPayoutSuspended === false,
                                // payoutReactivationDate: null,

                                // record.status === "matured" &&
                                //     record.status === "matured" &&

                                if ((record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false) || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                        record.isPayoutSuspended === false)) {
                                    console.log("Approval for investment payout processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // Data to send for transfer of fund
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, interestPayoutRequestReference, principalPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber =investorFundingWalletId;// walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;
                                    if (status == "completed_with_interest_payout_outstanding") {
                                        // ADD NEW CODE HERE
                                        // check if transaction with same customer ref exist
                                        let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                        // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                          if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                            //@ts-ignore
                                            let investmentId = record.id
                                            // Create Unique payment reference for the customer
                                            let reference = DateTime.now() + randomstring.generate(4);
                                            let numberOfAttempts = 1;
                                            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 6313 ==================")
                                            console.log(paymentReference);
                                            let getNumberOfAttempt = paymentReference.split("/");
                                            console.log("getNumberOfAttempt line 6315 =====", getNumberOfAttempt[1]);
                                            debugger;
                                            // @ts-ignore
                                            record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                            interestPayoutRequestReference = paymentReference;
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                            // debugger
                                            // console.log(" Current log, line 6322 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // initiate a new  transaction
                                            // Payout Interest
                                            // Payout Interest
                                            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForInterest)
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = interestDueOnInvestment;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1302 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1313 :", updatedInvestment);
                                                // console.log("Updated record Status line 1315: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 551:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 553:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5418:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                                let amountPaidOut = interestDueOnInvestment
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_interest_payout_outstanding';
                                                // record.principalPayoutStatus = 'completed';
                                                record.interestPayoutStatus = 'failed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1369 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1372 :", updatedInvestment);
                                                // console.log("Updated record Status line 1374: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 1388:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 1391:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5498:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }

                                        } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                            // update the value for number of attempts
                                            // get the current investmentRef, split , add one to the current number, update and try again
                                            let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                            console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
                                            let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                            let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 7052 ==================")
                                            console.log(newPaymentReference);
                                            interestPayoutRequestReference = newPaymentReference;
                                            record.interestPayoutRequestReference = interestPayoutRequestReference;
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                            // console.log(" Current log, line 7058 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 7062 :", updatedInvestment);

                                            // console.log("Updated record Status line 6423: ", record);
                                            // Payout Interest
                                            // Payout Interest
                                            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForInterest);
                                                debugger
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = interestDueOnInvestment;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1302 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1313 :", updatedInvestment);
                                                // console.log("Updated record Status line 1315: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 551:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 553:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5418:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                                let amountPaidOut = interestDueOnInvestment
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_interest_payout_outstanding';
                                                // record.principalPayoutStatus = 'completed';
                                                record.interestPayoutStatus = 'failed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1369 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1372 :", updatedInvestment);
                                                // console.log("Updated record Status line 1374: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 1388:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 1391:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5498:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }
                                        }

                                        // Payout Interest
                                        // creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                        //     beneficiaryName,
                                        //     beneficiaryAccountNumber,
                                        //     beneficiaryAccountName,
                                        //     beneficiaryEmail,
                                        //     beneficiaryPhoneNumber,
                                        //     rfiCode,
                                        //     descriptionForInterest)
                                        // // if successful
                                        // let decPl = 3;
                                        // if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL" ) {
                                        //     let amountPaidOut = interestDueOnInvestment;
                                        //     // let decPl = 3;
                                        //     amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        //     // update the investment details
                                        //     record.isInvestmentCompleted = true;
                                        //     record.investmentCompletionDate = DateTime.now();
                                        //     record.status = 'completed';
                                        //     record.interestPayoutStatus = 'completed';
                                        //     // record.approvalStatus = approval.approvalStatus;//'payout'
                                        //     record.isPayoutAuthorized = true;
                                        //     record.isPayoutSuccessful = true;
                                        //     record.datePayoutWasDone = DateTime.now();
                                        //     // debugger
                                        //     // Save the updated record
                                        //     // await record.save();
                                        //     // update record
                                        //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        //     // console.log(" Current log, line 1302 :", currentInvestment);
                                        //     // send for update
                                        //     const trx = await Database.transaction();
                                        //     await investmentsService.updateInvestment(currentInvestment, record);
                                        //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        //     // console.log(" Current log, line 1313 :", updatedInvestment);
                                        //     // console.log("Updated record Status line 1315: ", record);
                                        //     await trx.commit()
                                        //     // update timeline
                                        //     timelineObject = {
                                        //         id: uuid(),
                                        //         action: "investment payout",
                                        //         investmentId: investmentId,//id,
                                        //         walletId: walletIdToSearch,// walletId,
                                        //         userId: userIdToSearch,// userId,
                                        //         // @ts-ignore
                                        //         message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                        //         createdAt: DateTime.now(),
                                        //         metadata: ``,
                                        //     };
                                        //     // console.log("Timeline object line 551:", timelineObject);
                                        //     await timelineService.createTimeline(timelineObject);
                                        //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        //     // console.log("new Timeline object line 553:", newTimeline);
                                        //     // update record
                                        //     // Send Notification to admin and others stakeholder
                                        //     let messageKey = "payout";
                                        //     let investment = record;
                                        //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        //     // console.log("newNotificationMessage line 5418:", newNotificationMessageWithoutPdf);
                                        //     // debugger
                                        //     if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        //         console.log("Notification sent successfully");
                                        //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        //         console.log("Notification NOT sent successfully");
                                        //         console.log(newNotificationMessageWithoutPdf);
                                        //     }

                                        //     // commit transaction and changes to database
                                        //     // await trx.commit();
                                        //     // debugger
                                        // } else if (creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                        //     let amountPaidOut = interestDueOnInvestment
                                        //     // let decPl = 3;
                                        //     amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        //     // update the investment details
                                        //     // record.isInvestmentCompleted = true;
                                        //     // record.investmentCompletionDate = DateTime.now();
                                        //     record.status = 'completed_with_interest_payout_outstanding';
                                        //     // record.principalPayoutStatus = 'completed';
                                        //     record.interestPayoutStatus = 'failed';
                                        //     // record.approvalStatus = approval.approvalStatus;//'payout'
                                        //     // record.isPayoutAuthorized = true;
                                        //     // record.isPayoutSuccessful = true;
                                        //     // record.datePayoutWasDone = DateTime.now();
                                        //     // debugger
                                        //     // Save the updated record
                                        //     // await record.save();
                                        //     // update record
                                        //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        //     // console.log(" Current log, line 1369 :", currentInvestment);
                                        //     // send for update
                                        //     const trx = await Database.transaction();
                                        //     await investmentsService.updateInvestment(currentInvestment, record);
                                        //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        //     // console.log(" Current log, line 1372 :", updatedInvestment);
                                        //     // console.log("Updated record Status line 1374: ", record);
                                        //     await trx.commit()
                                        //     // update timeline
                                        //     timelineObject = {
                                        //         id: uuid(),
                                        //         action: "investment payout failed",
                                        //         investmentId: investmentId,//id,
                                        //         walletId: walletIdToSearch,// walletId,
                                        //         userId: userIdToSearch,// userId,
                                        //         // @ts-ignore
                                        //         message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                        //         createdAt: DateTime.now(),
                                        //         metadata: ``,
                                        //     };
                                        //     // console.log("Timeline object line 1388:", timelineObject);
                                        //     await timelineService.createTimeline(timelineObject);
                                        //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        //     // console.log("new Timeline object line 1391:", newTimeline);
                                        //     // update record
                                        //     // Send Notification to admin and others stakeholder
                                        //     let messageKey = "payout_failed";
                                        //     let investment = record;
                                        //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        //     // console.log("newNotificationMessage line 5498:", newNotificationMessageWithoutPdf);
                                        //     // debugger
                                        //     if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                        //         console.log("Notification sent successfully");
                                        //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                        //         console.log("Notification NOT sent successfully");
                                        //         console.log(newNotificationMessageWithoutPdf);
                                        //     }

                                        //     // commit transaction and changes to database
                                        //     // await trx.commit();
                                        //     // debugger
                                        // }
                                    }

                                    if (status == "completed_with_principal_payout_outstanding") {
                                        // ADD NEW CODE HERE 06
                                        // check if transaction with same customer ref exist
                                        let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                        debugger
                                        // if ( checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                          if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                            //@ts-ignore
                                            let investmentId = record.id
                                            // Create Unique payment reference for the customer
                                            let reference = DateTime.now() + randomstring.generate(4);
                                            let numberOfAttempts = 1;
                                            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 6313 ==================")
                                            console.log(paymentReference);
                                            let getNumberOfAttempt = paymentReference.split("/");
                                            console.log("getNumberOfAttempt line 6315 =====", getNumberOfAttempt[1]);
                                            debugger;
                                            // @ts-ignore
                                            record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                            interestPayoutRequestReference = paymentReference;
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                            // debugger
                                            // console.log(" Current log, line 6322 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // initiate a new  transaction
                                            // Payout Principal
                                            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForPrincipal);
                                                debugger
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.principalPayoutStatus = 'completed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 5502 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 5513 :", updatedInvestment);
                                                // console.log("Updated record Status line 5515: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 551:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 553:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5590:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_principal_payout_outstanding';
                                                record.principalPayoutStatus = 'failed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1369 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1372 :", updatedInvestment);
                                                // console.log("Updated record Status line 1374: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 3132:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 3135:", newTimeline);
                                                // update record

                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5669:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }

                                        } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                            // update the value for number of attempts
                                            // get the current investmentRef, split , add one to the current number, update and try again
                                            let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                                            console.log("getNumberOfAttempt line 7495 =====", getNumberOfAttempt[1]);
                                            let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                            let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 6412 ==================")
                                            console.log(newPaymentReference);
                                            principalPayoutRequestReference = newPaymentReference;
                                            record.principalPayoutRequestReference = principalPayoutRequestReference;
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                            // console.log(" Current log, line 826 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 6421 :", updatedInvestment);

                                            // console.log("Updated record Status line 6423: ", record);
                                            // Payout Principal
                                            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForPrincipal);
                                                debugger
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.principalPayoutStatus = 'completed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 5502 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 5513 :", updatedInvestment);
                                                // console.log("Updated record Status line 5515: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 551:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 553:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5590:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_principal_payout_outstanding';
                                                record.principalPayoutStatus = 'failed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 1369 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 1372 :", updatedInvestment);
                                                // console.log("Updated record Status line 1374: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 3132:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 3135:", newTimeline);
                                                // update record

                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 5669:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }
                                        }


                                    }
                                    // debugger

                                    // else {
                                    // console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                    // update record
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // console.log(" Current log, line 3168 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 3172 :", updatedInvestment);
                                    await trx.commit()
                                    // debugger
                                    // throw Error();
                                    //}
                                } else {
                                    // console.log("Entering no data 3177 ==================================")
                                    // await trx.rollback()
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }
                            } else {
                                // await trx.rollback()
                                return {
                                    status: 'OK',
                                    message: 'this investment is not mature for payout.',
                                    data: [],
                                }
                            }
                        }
                    } else {
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'Payout of investment is currently suspended.',
                            data: [],
                        }
                    }

                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 5665", error.messages);
                    console.log("Error line 5666", error.message);
                    // console.log("Error line 5667", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 5669, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    // debugger
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 5680 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 3218:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async retryFailedPayoutOfLiquidatedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 7864:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 3882 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 3884 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 3886 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);
            const settingsService = new SettingsServices();
            // const timelineService = new TimelinesServices();

            // TESTING
            let selectedDate;
            let currentDate = DateTime.now().toISO()

            if (payoutDateTo) {
                selectedDate = payoutDateTo;
            } else {
                selectedDate = currentDate;
            }
            // debugger
            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('status', "liquidated_with_interest_payout_outstanding")
                .orWhere('status', "liquidated_with_principal_payout_outstanding")
                .where('interest_payout_status', "failed")
                .orWhere('principal_payout_status', "failed")
                .andWhere('request_type', 'start_investment')
                .andWhere('approval_status', 'approved')
                // .andWhere('is_payout_successful', 'false')
                // .andWhere('is_rollover_activated', 'false')
                // .andWhere('is_rollover_suspended', 'false')
                // .andWhere('is_payout_suspended', 'false')
                .andWhere('payout_date', '<=', selectedDate)
                .offset(offset)
                .limit(limit)

            // .andWhereNot('status', "completed")
            // .orWhere('is_rollover_activated', 'true')
            // .forUpdate()

            console.log(" responseData line 7929 ==============")
            console.log(responseData)
            // debugger
            if (responseData.length < 1) {
                console.log(`There is no approved investment that is liquidated for payout or wallet has been successfully credited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is liquidated for payout or wallet has been successfully credited. Please, check and try again.`, codeSt: "404" })
            }
            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    console.log("Entering update 7942 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 7962 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 3961 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 3963 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 3967 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 3972 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 1199 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 1200 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 1201 ===================================", approval.tokenId)
                    // console.log("cardId line 1202 ===================================", approval.cardId)
                    // console.log("accountId line 1203 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 8005 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);
                    let { rfiCode } = record;
                    const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                    if (!settings) {
                        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                    }
                    let isAllPayoutSuspended = settings.isAllPayoutSuspended
                    if (isAllPayoutSuspended === false) {
                        if (investment) {
                            console.log("Investment approval Selected for Update line 8020:");
                            // update the data
                            // TODO: Uncomment to use loginAdminFullName
                            // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                            // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                            // payload.remark = remark !== undefined ? remark : approval.remark;
                            // console.log("Admin remark line 1220 ==================== ", approval.remark);
                            // console.log("Admin remark line 1221 ========*******************=========== ", remark);
                            // let newStatus;
                            // await approval.save();
                            // console.log("Update Approval Request line 504:", approval);
                            let { currencyCode, lastName, startDate, duration, status } = record;
                            // let { currencyCode, lastName, startDate, duration } = record;
                            console.log("Surname: ", lastName)
                            // console.log("CurrencyCode: ", currencyCode)
                            // debugger
                            // let email = email;
                            let timelineObject;
                            // console.log("Approval.requestType: ===========================================>", approval.requestType)
                            // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                            // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                            // let duration = 4
                            console.log('Time investment was started line 8042: ', startDate)
                            // let timelineObject
                            // let timeline
                            let isDueForPayout = await dueForPayout(startDate, duration)
                            console.log('Is due for payout status line 8046:', isDueForPayout)
                            // debugger
                            if (isDueForPayout === true) {
                                //                          record.isPayoutAuthorized === true,
                                //   record.isPayoutSuspended === false,
                                // payoutReactivationDate: null,

                                // record.status === "matured" &&
                                //     record.status === "matured" &&

                                if ((record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false) || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                        record.isPayoutSuspended === false)) {
                                    console.log("Approval for investment payout processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // Data to send for transfer of fund
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, interestPayoutRequestReference, principalPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;

                                    if (status == "completed_with_interest_payout_outstanding") {
                                        // ADD NEW CODE HERE 02
                                        // let creditUserWalletWithInterest;
                                        // check if transaction with same customer ref exist
                                        let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                        // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                          if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                            //@ts-ignore
                                            let investmentId = record.id
                                            // Create Unique payment reference for the customer
                                            let reference = DateTime.now() + randomstring.generate(4);
                                            let numberOfAttempts = 1;
                                            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                            // console.log("Customer Transaction Reference ,@ InvestmentsServices line 8107 ==================")
                                            // console.log(paymentReference);
                                            // let getNumberOfAttempt = paymentReference.split("/");
                                            // console.log("getNumberOfAttempt line 8110 =====", getNumberOfAttempt[1]);
                                            debugger;
                                            // @ts-ignore
                                            record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                            interestPayoutRequestReference = paymentReference;
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                            // debugger
                                            // console.log(" Current log, line 8117 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // initiate a new  transaction
                                            // Payout Interest
                                            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForInterest);
                                                debugger

                                        } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                            // update the value for number of attempts
                                            // get the current investmentRef, split , add one to the current number, update and try again
                                            let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                            console.log("getNumberOfAttempt line 8135 =====", getNumberOfAttempt[1]);
                                            let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                            let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 8139 ==================")
                                            console.log(newPaymentReference);
                                            interestPayoutRequestReference = newPaymentReference;
                                            record.interestPayoutRequestReference = interestPayoutRequestReference;
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                            // console.log(" Current log, line 8145 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 6421 :", updatedInvestment);

                                            // console.log("Updated record Status line 6423: ", record);
                                            // Payout Interest
                                            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForInterest);
                                                debugger
                                        }

                                    } //else 
                                    if (status == "completed_with_principal_payout_outstanding") {
                                        // ADD NEW CODE HERE 02
                                        // check if transaction with same customer ref exist
                                        let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                        debugger
                                        // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                          if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                            //@ts-ignore
                                            let investmentId = record.id
                                            // Create Unique payment reference for the customer
                                            let reference = DateTime.now() + randomstring.generate(4);
                                            let numberOfAttempts = 1;
                                            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                            // console.log("Customer Transaction Reference ,@ InvestmentsServices line 8305 ==================")
                                            // console.log(paymentReference);
                                            // let getNumberOfAttempt = paymentReference.split("/");
                                            // console.log("getNumberOfAttempt line 8308 =====", getNumberOfAttempt[1]);
                                            debugger;
                                            // @ts-ignore
                                            record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                            principalPayoutRequestReference = paymentReference;
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                            // debugger
                                            // console.log(" Current log, line 8315 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // initiate a new  transaction
                                            // Payout Principal
                                            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForPrincipal);
                                                debugger
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.principalPayoutStatus = 'completed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 6002 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 6013 :", updatedInvestment);
                                                // console.log("Updated record Status line 6015: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 6149:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 6152:", newTimeline);
                                                // update record


                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 6237:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_principal_payout_outstanding';
                                                record.principalPayoutStatus = 'failed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 6156 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 6157 :", updatedInvestment);
                                                // console.log("Updated record Status line 6158: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 3132:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 6348:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 6317:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }

                                        } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                            // update the value for number of attempts
                                            // get the current investmentRef, split , add one to the current number, update and try again
                                            let getNumberOfAttempt = principalPayoutRequestReference.split("_");
                                            console.log("getNumberOfAttempt line 8458 =====", getNumberOfAttempt[1]);
                                            let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                            let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                                            console.log("Customer Transaction Reference ,@ InvestmentsServices line 8462 ==================")
                                            console.log(newPaymentReference);
                                            principalPayoutRequestReference = newPaymentReference;
                                            record.principalPayoutRequestReference = principalPayoutRequestReference;
                                            record.numberOfAttempts = numberOfAttempts;
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                            // console.log(" Current log, line 8468 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 6421 :", updatedInvestment);

                                            // console.log("Updated record Status line 6423: ", record);
                                            // Payout Principal
                                            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                                beneficiaryName,
                                                beneficiaryAccountNumber,
                                                beneficiaryAccountName,
                                                beneficiaryEmail,
                                                beneficiaryPhoneNumber,
                                                rfiCode,
                                                descriptionForPrincipal);
                                                debugger
                                            // if successful
                                            let decPl = 3;
                                            if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                record.isInvestmentCompleted = true;
                                                record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed';
                                                record.principalPayoutStatus = 'completed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                record.isPayoutAuthorized = true;
                                                record.isPayoutSuccessful = true;
                                                record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 6002 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 6013 :", updatedInvestment);
                                                // console.log("Updated record Status line 6015: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 6149:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 6152:", newTimeline);
                                                // update record


                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 6237:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                                                let amountPaidOut = amount;
                                                // let decPl = 3;
                                                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                                // update the investment details
                                                // record.isInvestmentCompleted = true;
                                                // record.investmentCompletionDate = DateTime.now();
                                                record.status = 'completed_with_principal_payout_outstanding';
                                                record.principalPayoutStatus = 'failed';
                                                // record.interestPayoutStatus = 'completed';
                                                // record.approvalStatus = approval.approvalStatus;//'payout'
                                                // record.isPayoutAuthorized = true;
                                                // record.isPayoutSuccessful = true;
                                                // record.datePayoutWasDone = DateTime.now();
                                                // debugger
                                                // Save the updated record
                                                // await record.save();
                                                // update record
                                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                                // console.log(" Current log, line 6156 :", currentInvestment);
                                                // send for update
                                                const trx = await Database.transaction();
                                                await investmentsService.updateInvestment(currentInvestment, record);
                                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                                // console.log(" Current log, line 6157 :", updatedInvestment);
                                                // console.log("Updated record Status line 6158: ", record);
                                                await trx.commit()
                                                // update timeline
                                                timelineObject = {
                                                    id: uuid(),
                                                    action: "investment payout failed",
                                                    investmentId: investmentId,//id,
                                                    walletId: walletIdToSearch,// walletId,
                                                    userId: userIdToSearch,// userId,
                                                    // @ts-ignore
                                                    message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                    createdAt: DateTime.now(),
                                                    metadata: ``,
                                                };
                                                // console.log("Timeline object line 3132:", timelineObject);
                                                await timelineService.createTimeline(timelineObject);
                                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                                // console.log("new Timeline object line 6348:", newTimeline);
                                                // update record
                                                // Send Notification to admin and others stakeholder
                                                let messageKey = "payout_failed";
                                                let investment = record;
                                                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                                // console.log("newNotificationMessage line 6317:", newNotificationMessageWithoutPdf);
                                                // debugger
                                                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                                    console.log("Notification sent successfully");
                                                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                                    console.log("Notification NOT sent successfully");
                                                    console.log(newNotificationMessageWithoutPdf);
                                                }

                                                // commit transaction and changes to database
                                                // await trx.commit();
                                                // debugger
                                            }
                                        }

                                    }
                                    // debugger

                                    // else {
                                    // console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                    // update record
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // console.log(" Current log, line 3168 :", currentInvestment);
                                    // send for update
                                    const trx = await Database.transaction();
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    await trx.commit();
                                    // console.log(" Current log, line 3172 :", updatedInvestment);
                                    console.log(" creditUserWalletWithPrincipal, line 8762 ======:", creditUserWalletWithPrincipal);

                                    console.log(" creditUserWalletWithInterest , line 8764 :", creditUserWalletWithInterest);
                                    debugger
                                    // throw Error();
                                    //}
                                } else {
                                    // console.log("Entering no data 3177 ==================================")
                                    // await trx.rollback()
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }
                            } else {
                                // await trx.rollback()
                                return {
                                    status: 'OK',
                                    message: 'this investment is not mature for payout.',
                                    data: [],
                                }
                            }
                        }
                    } else {
                        // await trx.rollback()
                        return {
                            status: 'OK',
                            message: 'Payout of investment is currently suspended.',
                            data: [],
                        }
                    }

                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 8795", error.messages);
                    console.log("Error line 8796", error.message);
                    // console.log("Error line 8797", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 8800, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    // debugger
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 8812 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 8818:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async liquidateInvestment(investmentId: string, queryParams?: any, loginUserData?: any): Promise<Investment[] | any> {
        // const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 8251:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, payoutDateFrom, payoutDateTo } = queryParams;

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!payoutDateFrom) {
                // default to last 3 months
                queryParams.payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                payoutDateFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!payoutDateTo) {
                queryParams.payoutDateTo = DateTime.now().toISO();//.toISODate();
                payoutDateTo = DateTime.now().toISO();//.toISODate();
            }
            // console.log("queryParams line 142 =========================")
            // console.log(queryParams)
            // console.log("updatedAtFrom line 149 =========================")
            // console.log(updatedAtFrom)
            // console.log("updatedAtTo line 151 =========================")
            // console.log(updatedAtTo)
            offset = Number(offset);
            limit = Number(limit);

            // const timelineService = new TimelinesServices();
            const settingsService = new SettingsServices();
            // TESTING
            // let selectedDate;
            // let currentDate = DateTime.now().toISO()

            // if (payoutDateTo) {
            //     selectedDate = payoutDateTo;
            // } else {
            //     selectedDate = currentDate;
            // }
            console.log("investmentId   ======", investmentId)
            // debugger
            let responseData = await Database
                .from('investments')
                // .useTransaction(trx) // 👈
                .where('id', investmentId)
                .where('status', 'active')
                .andWhere('request_type', 'start_investment')
                .andWhere('approval_status', 'approved')
                // .andWhere('is_payout_successful', 'false')
                // .andWhere('is_payout_suspended', 'false')
                // .andWhere('is_rollover_activated', 'false')
                // .andWhere('is_rollover_suspended', 'false')
                // .andWhere('payout_date', '<', selectedDate)
                .offset(offset)
                .limit(limit)

            // .andWhere('is_payout_suspended', 'false')
            // .orWhere('status', "completed_with_interest_payout_outstanding")
            // .orWhere('status', "completed_with_principal_payout_outstanding")
            // .andWhereNot('status', "completed")
            // .orWhere('is_rollover_activated', 'true')
            // .forUpdate()

            console.log(" responseData line 5907 ==============")
            console.log(responseData)
            // debugger
            if (responseData.length < 1) {
                console.log(`There is no approved investment that is eligible for liquidation or wallet has been successfully credited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is eligible for liquidation or wallet has been successfully credited. Please, check and try again.`, codeSt: "404" })
            }

            // debugger
            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                // const trx = await Database.transaction();
                try {
                    console.log("Entering update 7684 ==================================")
                    // const investmentlogsService = new InvestmentLogsServices();
                    const investmentsService = new InvestmentsServices();
                    // await request.validate(UpdateApprovalValidator);
                    // const approvalsService = new ApprovalsServices()
                    // const { id, } = request.params();
                    // console.log("Approval query: ", request.qs());
                    // const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
                    //     rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = investment;
                    // const { approvalStatus, assignedTo, processedBy,} = investment;
                    // remark
                    // check if the request is not existing
                    // let approval;
                    // let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
                    // // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
                    // if (!approvalRequestIsExisting) {
                    //     //    return error message to user
                    //     // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
                    //     throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
                    // }
                    console.log(" Login User Data line 7704 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 5945 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 5947 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 5951 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 5956 ==================")
                    // console.log(loginAdminFullName)

                    const timelineService = new TimelinesServices();
                    // const { investmentId, walletId, userId } = request.qs();
                    // approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

                    // console.log(" QUERY RESULT: ", approval);
                    let walletIdToSearch = investment.wallet_id
                    let userIdToSearch = investment.user_id
                    let investmentId;
                    let record;
                    // debugger
                    // console.log("investmentId line 5969 ===================================", approval.investmentId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 7312 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        // await trx.rollback()
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);
                    let { rfiCode } = record;
                    const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                    if (!settings) {
                        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                    }
                    //  Check if investment payout is not suspended and activation is automated
                    // isAllRolloverSuspended

                    let { isAllPayoutSuspended, liquidationPenalty } = settings; //.isAllPayoutSuspended
                    if (isAllPayoutSuspended === false) {
                        if (investment) {
                            console.log("Investment approval Selected for Update line 7514:");
                            // update the data
                            // TODO: Uncomment to use loginAdminFullName
                            // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                            // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                            // payload.remark = remark !== undefined ? remark : approval.remark;
                            // console.log("Admin remark line 6000 ==================== ", approval.remark);
                            // console.log("Admin remark line 6001 ========*******************=========== ", remark);
                            // let newStatus;
                            // await approval.save();
                            // console.log("Update Approval Request line 3498:", approval);
                            let { currencyCode, startDate, duration } = record;
                            // let { currencyCode, lastName, startDate, duration } = record;
                            // console.log("Surname: ", lastName)
                            // console.log("CurrencyCode: ", currencyCode)
                            // debugger
                            // let email = email;
                            let timelineObject;
                            // console.log("Approval.requestType: ===========================================>", approval.requestType)
                            // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                            // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                            // let duration = 4
                            // console.log('Time investment was started line 8076: ', startDate)
                            // let timelineObject
                            // let timeline
                            let isDueForPayout = await dueForPayout(startDate, duration)
                            console.log('Is due for payout status line 7540:', isDueForPayout)
                            // debugger
                            if (isDueForPayout === true) {
                                //                          record.isPayoutAuthorized === true,
                                //   record.isPayoutSuspended === false,
                                // payoutReactivationDate: null,

                                // record.status === "matured" &&
                                //     record.status === "matured" &&

                                if ((record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false)
                                    // || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                    //     record.isPayoutSuspended === false)
                                ) {
                                    console.log("Approval for investment payout processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // // Data to send for transfer of fund
                                    // let { amount, lng, lat, id,
                                    //     firstName, lastName,
                                    //     walletId,
                                    //     phone,
                                    //     email,
                                    //     rfiCode, interestDueOnInvestment } = record;
                                    // let beneficiaryName = `${firstName} ${lastName}`;
                                    // let beneficiaryAccountNumber = walletId;
                                    // let beneficiaryAccountName = beneficiaryName;
                                    // let beneficiaryPhoneNumber = phone;
                                    // let beneficiaryEmail = email;
                                    // // Send to the endpoint for debit of wallet
                                    // let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // let descriptionForInterest = `Payout of the interest of ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // NEW CODE START

                                    // Data to send for transfer of fund
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // NEW CODE START
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;
                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                    debugger
                                    // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 9414 ==================")
                                        // console.log(paymentReference);
                                        // let getNumberOfAttempt = paymentReference.split("/");
                                        // console.log("getNumberOfAttempt line 9417 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        principalPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 9424 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger
                                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                                        console.log("getNumberOfAttempt line 9441 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        console.log("Customer Transaction Reference ,@ InvestmentsServices line 9445 ==================")
                                        console.log(newPaymentReference);
                                        principalPayoutRequestReference = newPaymentReference;
                                        record.principalPayoutRequestReference = principalPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 9450 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 9454 :", updatedInvestment);

                                        // console.log("Updated record Status line 9456: ", record);
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal);
                                            debugger
                                    }

                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                    // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                      if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 9477 ==================")
                                        // console.log(paymentReference);
                                        // let getNumberOfAttempt = paymentReference.split("/");
                                        // console.log("getNumberOfAttempt line 9480 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        interestPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 9487 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger

                                    } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                        // console.log("getNumberOfAttempt line 9505 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 9509 ==================")
                                        // console.log(newPaymentReference);
                                        interestPayoutRequestReference = newPaymentReference;
                                        record.interestPayoutRequestReference = interestPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 9514 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 9518 :", updatedInvestment);

                                        // console.log("Updated record Status line 9520: ", record);
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger
                                    }


                                    // NEW CODE END
                                    // Payout Principal
                                    // let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                                    //     beneficiaryName,
                                    //     beneficiaryAccountNumber,
                                    //     beneficiaryAccountName,
                                    //     beneficiaryEmail,
                                    //     beneficiaryPhoneNumber,
                                    //     rfiCode,
                                    //     descriptionForPrincipal)

                                    // Payout Interest
                                    // let creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
                                    //     beneficiaryName,
                                    //     beneficiaryAccountNumber,
                                    //     beneficiaryAccountName,
                                    //     beneficiaryEmail,
                                    //     beneficiaryPhoneNumber,
                                    //     rfiCode,
                                    //     descriptionForInterest)
                                    // debugger
                                    // if successful
                                    let decPl = 3;
                                    if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = amount + interestDueOnInvestment;
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger

                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 7872 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 7873 :", updatedInvestment);
                                        // console.log("Updated record Status line 7875: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 8192:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 8195:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 8220:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                        let amountPaidOut = amount
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_interest_payout_outstanding';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'failed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 7939 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 7942 :", updatedInvestment);
                                        // console.log("Updated record Status line 7944: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 7958:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 7959:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 7966:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = interestDueOnInvestment
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_principal_payout_outstanding';
                                        record.principalPayoutStatus = 'failed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 1428 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1431 :", updatedInvestment);
                                        // console.log("Updated record Status line 1433: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 1447:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 1450:", newTimeline);
                                        // update record
                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "payout";
                                        let investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 8378:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else {
                                        console.log("Entering failed payout of principal and interest data block ,line 8038 ==================================")
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 8045 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 8049 :", updatedInvestment);
                                        // debugger

                                        // commit transaction and changes to database
                                        await trx.commit();
                                        throw Error();
                                    }

                                    console.log("creditUserWalletWithPrincipal line 12004 ====", creditUserWalletWithPrincipal);
                                    console.log("creditUserWalletWithInterest line 12006 ====", creditUserWalletWithInterest);
                                    debugger
                                } else {
                                    // console.log("Entering no data 7805 ==================================")
                                    // commit transaction and changes to database
                                    // await trx.rollback();
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }
                            } else if (isDueForPayout === false) {
                                // calculate the amount of the interest accrued till date

                                // deduct the penalty (i.e 25% of the accrued of interest till date) from the interest

                                // payout the amount remaining after deduction of penalty

                                // notify the neccessary stakeholders
                                if ((record.requestType === "start_investment" && record.approvalStatus === "approved" && record.isPayoutAuthorized === true &&
                                    record.isPayoutSuspended === false)
                                    // || (record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isPayoutAuthorized === true &&
                                    //     record.isPayoutSuspended === false)
                                ) {
                                    console.log("Approval for investment liquidation processing: ===========================================>")

                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                    // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                    // record.approvalStatus = approval.approvalStatus;

                                    // newStatus = "submitted";
                                    // newStatus = "approved";
                                    // record.status = newStatus;
                                    // record.requestType = "payout_investment";
                                    // record.remark = approval.remark;
                                    // record.isInvestmentApproved = true;
                                    // TODO: Uncomment to use loginAdminFullName
                                    // record.processedBy = loginAdminFullName;
                                    // record.approvedBy = loginUserData.approvedBy !== undefined ? loginUserData.approvedBy : "automation";
                                    // record.assignedTo = loginUserData.assignedTo !== undefined ? loginUserData.assignedTo : "automation";
                                    record.approvalStatus = "approved"; //approval.approvalStatus;
                                    // Data to send for transfer of fund
                                    // let { amount, lng, lat, id,
                                    //     firstName, lastName,
                                    //     walletId,
                                    //     phone,
                                    //     email,
                                    //     rfiCode, interestDueOnInvestment } = record;
                                    let { amount, lng, lat, id, userId,
                                        firstName, lastName,
                                        walletId,investorFundingWalletId,
                                        phone,
                                        email,
                                        rfiCode, interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference } = record;
                                    let beneficiaryName = `${firstName} ${lastName}`;
                                    let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
                                    let beneficiaryAccountName = beneficiaryName;
                                    let beneficiaryPhoneNumber = phone;
                                    let beneficiaryEmail = email;
                                    // Send to the endpoint for debit of wallet
                                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                    let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                    // Calculate penalty to be deducted
                                    let currentDate = new Date();//.toDateString();  // new Date().toISOString(); //DateTime.now()
                                    // debugger
                                    let daysOfInvestment;
                                    daysOfInvestment = await investmentDuration(startDate, currentDate)
                                    // debugger
                                    let accruedInterest = ((interestDueOnInvestment / duration) * daysOfInvestment)
                                    let penalty = (accruedInterest * (Number(liquidationPenalty) / 100));
                                    console.log(" accruedInterest =======", accruedInterest)
                                    console.log(" daysOfInvestment =======", daysOfInvestment)
                                    console.log(" penalty before rounding up to 3 decimal place =======", penalty)
                                    console.log(" penalty rounded up to 3 decimal place =======", penalty.toFixed(3))
                                    penalty = Number(penalty.toFixed(3));
                                    interestDueOnInvestment = accruedInterest;
                                    debugger
                                    console.log(" interestDueOnInvestment before penalty deduction =======", interestDueOnInvestment)
                                    interestDueOnInvestment = interestDueOnInvestment - penalty;
                                    console.log(" interestDueOnInvestment after penalty deduction =======", interestDueOnInvestment)
                                    // debugger
                                    // NEW CODE START
                                    // let beneficiaryName = `${firstName} ${lastName}`;
                                    // let beneficiaryAccountNumber = walletId;
                                    // let beneficiaryAccountName = beneficiaryName;
                                    // let beneficiaryPhoneNumber = phone;
                                    // let beneficiaryEmail = email;
                                    // NEW CODE START
                                    let creditUserWalletWithPrincipal;
                                    let creditUserWalletWithInterest;
                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference,rfiCode);
                                    debugger
                                    // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                                      if ((!checkTransactionStatusByCustomerRef)||(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 9414 ==================")
                                        // console.log(paymentReference);
                                        // let getNumberOfAttempt = paymentReference.split("/");
                                        // console.log("getNumberOfAttempt line 9417 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        principalPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 9424 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal)
                                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = principalPayoutRequestReference.split("/");
                                        // console.log("getNumberOfAttempt line 9884 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 9888 ==================")
                                        // console.log(newPaymentReference);
                                        principalPayoutRequestReference = newPaymentReference;
                                        record.principalPayoutRequestReference = newPaymentReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 9450 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 9454 :", updatedInvestment);

                                        // console.log("Updated record Status line 9456: ", record);
                                        // Payout Principal
                                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal)
                                    }

                                    // check if transaction with same customer ref exist
                                    let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference,rfiCode);
                                    // if (checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
                                      if ((!checkTransactionStatusByCustomerRef02)||(checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") ) {
                                        //@ts-ignore
                                        let investmentId = record.id
                                        // Create Unique payment reference for the customer
                                        let reference = DateTime.now() + randomstring.generate(4);
                                        let numberOfAttempts = 1;
                                        let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 12171 ==================")
                                        // console.log(paymentReference);
                                        // let getNumberOfAttempt = paymentReference.split("/");
                                        // console.log("getNumberOfAttempt line 12174 =====", getNumberOfAttempt[1]);
                                        debugger;
                                        // @ts-ignore
                                        record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                                        interestPayoutRequestReference = paymentReference;
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                        // debugger
                                        // console.log(" Current log, line 12181 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // initiate a new  transaction
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger

                                    } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
                                        // update the value for number of attempts
                                        // get the current investmentRef, split , add one to the current number, update and try again
                                        let getNumberOfAttempt = interestPayoutRequestReference.split("/");
                                        // console.log("getNumberOfAttempt line 12199 =====", getNumberOfAttempt[1]);
                                        let numberOfAttempts = Number(getNumberOfAttempt[1]) + 1;
                                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                                        let newPaymentReference = `${uniqueInvestmentRequestReference}/${numberOfAttempts}`;
                                        // console.log("Customer Transaction Reference ,@ InvestmentsServices line 12203 ==================")
                                        // console.log(newPaymentReference);
                                        interestPayoutRequestReference = newPaymentReference;
                                        record.interestPayoutRequestReference = interestPayoutRequestReference;
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                                        // console.log(" Current log, line 12209 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 12213 :", updatedInvestment);

                                        // console.log("Updated record Status line 12215: ", record);
                                        // Payout Interest
                                        creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest);
                                            debugger
                                    }


                                    // NEW CODE END

                                    // Delete code below
                                    // // Payout Principal
                                    // let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                                    //     beneficiaryName,
                                    //     beneficiaryAccountNumber,
                                    //     beneficiaryAccountName,
                                    //     beneficiaryEmail,
                                    //     beneficiaryPhoneNumber,
                                    //     rfiCode,
                                    //     descriptionForPrincipal)

                                    // // Payout Interest after deducting penalty
                                    // let creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
                                    //     beneficiaryName,
                                    //     beneficiaryAccountNumber,
                                    //     beneficiaryAccountName,
                                    //     beneficiaryEmail,
                                    //     beneficiaryPhoneNumber,
                                    //     rfiCode,
                                    //     descriptionForInterest)
                                    // debugger
                                    // if successful
                                    let decPl = 3;
                                    if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = amount + interestDueOnInvestment;
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'liquidated';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        record.penalty = penalty;
                                        record.interestDueOnInvestment = interestDueOnInvestment;
                                        record.totalAmountToPayout = amount + interestDueOnInvestment;
                                        record.requestType = "liquidate_investment"
                                        record.isTerminationAuthorized = true

                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 12278 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 12283 :", updatedInvestment);
                                        // console.log("Updated record Status line 12284: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment liquidation payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your liquidated investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 12298:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 12301:", newTimeline);
                                        // update record

                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "liquidation";
                                        investment = record;
                                        // debugger
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 12309:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
                                        let amountPaidOut = amount
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'liquidated_with_interest_payout_outstanding';
                                        record.principalPayoutStatus = 'completed';
                                        record.interestPayoutStatus = 'failed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        record.penalty = penalty;
                                        record.interestDueOnInvestment = interestDueOnInvestment;
                                        record.totalAmountToPayout = amount + interestDueOnInvestment;
                                        record.requestType = "liquidate_investment"
                                        record.isTerminationAuthorized = true
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 6493 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 8662 :", updatedInvestment);
                                        // console.log("Updated record Status line 8664: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment liquidation payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your liquidated investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 8678:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 8681:", newTimeline);
                                        // update record

                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "liquidation";
                                        investment = record;
                                        // debugger
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 8653:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                                        let amountPaidOut = interestDueOnInvestment
                                        // let decPl = 3;
                                        amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'liquidated_with_principal_payout_outstanding';
                                        record.principalPayoutStatus = 'failed';
                                        record.interestPayoutStatus = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // debugger
                                        record.penalty = penalty;
                                        record.interestDueOnInvestment = interestDueOnInvestment;
                                        record.totalAmountToPayout = amount + interestDueOnInvestment;
                                        record.requestType = "liquidate_investment"
                                        record.isTerminationAuthorized = true
                                        // Save the updated record
                                        // await record.save();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 8744 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 8759 :", updatedInvestment);
                                        // console.log("Updated record Status line 8761: ", record);
                                        await trx.commit()
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment liquidation payout",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId,
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your liquidated investment has been paid out, please check your account. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 8775:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 8778:", newTimeline);
                                        // update record

                                        // Send Notification to admin and others stakeholder
                                        let messageKey = "liquidation";
                                        investment = record;
                                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                                        // console.log("newNotificationMessage line 8793:", newNotificationMessageWithoutPdf);
                                        // debugger
                                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessageWithoutPdf);
                                        }

                                        // commit transaction and changes to database
                                        // await trx.commit();
                                        // debugger
                                    } else {
                                        console.log("Entering failed payout of principal and interest data block ,line 10205 ==================================")
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 8809 :", currentInvestment);
                                        // send for update
                                        const trx = await Database.transaction();
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 8813 :", updatedInvestment);
                                        console.log(" creditUserWalletWithPrincipal line 9305 ================", creditUserWalletWithPrincipal );
                                        console.log(" creditUserWalletWithInterest line 9306 ================", creditUserWalletWithInterest );
                                        console.log(" creditUserWalletWithPrincipal .status line 9307 ================", creditUserWalletWithPrincipal.status );
                                        console.log(" creditUserWalletWithInterest .status line 9308 ================", creditUserWalletWithInterest.status );
                                        console.log(" creditUserWalletWithPrincipal message line 9309 ================", creditUserWalletWithPrincipal.message );
                                        console.log(" creditUserWalletWithInterest message line 9310 ================", creditUserWalletWithInterest.message );
                                        // debugger

                                        // commit transaction and changes to database
                                        await trx.commit();
                                        throw Error(`${creditUserWalletWithPrincipal.status}, ${creditUserWalletWithPrincipal.message}.`);
                                    }
                                } else {
                                    // console.log("Entering no data 8820 ==================================")

                                    // commit transaction and changes to database
                                    // await trx.rollback();
                                    return {
                                        status: 'OK',
                                        message: 'no investment matched your search',
                                        data: [],
                                    }
                                }

                            }
                        }
                    } else {

                        // commit transaction and changes to database
                        // await trx.rollback();
                        return {
                            status: 'OK',
                            message: 'Payout of investment is currently suspended.',
                            data: [],
                        }
                    }
                } catch (error) {
                    console.log("Error line 12241 ===================", error)
                    // debugger
                    console.log("Error line 12243", error.messages);
                    console.log("Error line 12244", error.message);
                    // debugger
                    // await trx.rollback()
                    console.log(`Error line 12247, status: "FAILED", message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    // debugger
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 12503 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            // await trx.commit();
            // console.log("Response data in investment service, line 1063:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            // await trx.rollback();
            throw error;
        }
    }

    public async getInvestmentByInvestmentId(id: string): Promise<Investment | any | null> {
        try {
            // const investment = await Investment.findBy('id', id);
            const investment = await Investment.query().where({ id: id })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                // .orderBy("updated_at", "desc")
                .first();
            // console.log("Investment search result from service")
            // console.log(investment);
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentByWalletIdAndInvestmentId(walletId: string, id: string): Promise<Investment | any | null> {
        try {
            // const investment = await Investment.findBy('id', id);
            const investment = await Investment.query().where({ walletId: walletId, id: id })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .first();
            // console.log("Investment search result from service")
            // console.log(investment);
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentByWalletIdAndInvestmentIdAndStatus(walletId: string, id: string, status: string): Promise<Investment | any | null> {
        try {
            const investment = await Investment.query().where({ walletId: walletId, id: id, status: status })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .first()
            // console.log("Investment search result from service")
            // console.log(investment);
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentsByWalletId(walletId: string): Promise<Investment[]> {
        try {
            const investment = await Investment.query().where({ walletId: walletId })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
            // .offset(offset)
            // .limit(limit);
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentsByUserId(userId: string): Promise<Investment[]> {
        try {
            const investment = await Investment.query().where({ userId: userId })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("updatedAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
            // timelines
            // payoutSchedules
            // repaidInvestments
            // payoutDefaulters

            // .offset(offset)
            // .limit(limit);
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentsByUserIdWithQuery(userId: string, queryParams: any): Promise<Investment[] | any> {
        try {
            console.log("Query params in investment service:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo, } = queryParams;
            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
            }
            if (!userId) throw Error(`userId is required. Please check and try again.`)
            if (userId) {
                queryParams.userId = userId
            }

            // console.log(" updatedAtFrom line 8103 ==============================================================");
            console.log(queryParams);
            // debugger;
            const queryGetter = await this.queryBuilder(queryParams)
            // debugger;
            let responseData = await Investment.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            // console.log("Response data in investment service:", responseData)
            // debugger;
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentByUserIdAndWalletId(userId: string, walletId: string): Promise<Investment | null> {
        try {
            const investment = await Investment.query().where({ userId: userId, walletId: walletId })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                // .offset(offset)
                // .limit(limit)
                .first();
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentsByIdAndWalletIdAndUserId(investmentId: string, walletId: string, userId: string): Promise<Investment | null> {
        try {
            // debugger
            const investment = await Investment.query().where({ id: investmentId, userId: userId, walletId: walletId })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                // .offset(offset)
                // .limit(limit)
                .first();
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentByUserIdAndStatus(userId: string, status: string): Promise<Investment | null> {
        try {
            const investment = await Investment.query().where({ userId: userId, status: status })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                // .offset(offset)
                // .limit(limit)
                .first();
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getInvestmentByWalletIdAndInvestmentIdAndStatusAndUserIdAndRequestType(walletId: string, investmentId: string, status: string, userId: string, requestType: string): Promise<Investment | null> {
        try {
            const investment = await Investment.query().where({
                userId: userId, status: status, walletId: walletId, investmentId: investmentId, requestType: requestType
            })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("approvals", (query) => { query.orderBy("updatedAt", "desc"); })
                .orderBy("updated_at", "desc")
                // .offset(offset)
                // .limit(limit)
                .first();
            return investment;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async updateInvestment(selectedInvestment: any, updateInvestment: InvestmentType): Promise<Investment | null> {
        try {
            let saveInvestment = await selectedInvestment.merge(updateInvestment)
            await saveInvestment.save();
            return saveInvestment
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteInvestment(selectedInvestment: any): Promise<Investment | null> {
        try {
            await selectedInvestment.delete()
            return selectedInvestment
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    private async queryBuilder(queryFields: any) {
        /**
         * This is the query builder to allow for different filter on the model.
         * One of the reasons of using this is that I have not found a way around querying json field with lucid
         * So I will be making use of params, sql and predicate to build a raw query to be used in lucid.
         * The predicate are the filters and params are the values. The sql base statements that will be built on with concatenation
         * This function returns the sql query and the params i.e fields to be filtered
         * Function predicateExists() handles adding the conjuction while building the sql query
         */
        delete queryFields.limit
        delete queryFields.offset
        interface Response {
            sqlQuery: string
            params: any[]
        }
        let params: any[] = []
        let predicate = ""
        let response: Response = {
            sqlQuery: "string",
            params: []
        }
        const predicateExists = () => {
            if (predicate == "") {
                return predicate
            }
            predicate = predicate + " and "
            return predicate
        }
        const orPredicateExists = (orPredicate) => {
            if (orPredicate == "") {
                return orPredicate
            }
            orPredicate = orPredicate + " or "
            return orPredicate
        }
        if (!queryFields || Object.keys(queryFields).length === 0) {
            response.sqlQuery = predicate
            response.params = params
            return response
        }
        if (queryFields.id) {
            predicateExists()
            predicate = predicate + "id=?"
            params.push(queryFields.id)
        }
        if (queryFields.walletId) {
            predicateExists()
            predicate = predicate + "wallet_id=?"
            params.push(queryFields.walletId)
        }
        if (queryFields.userId) {
            predicateExists()
            predicate = predicate + "user_id=?";
            params.push(queryFields.userId)
        }
        if (queryFields.firstName) {
            predicateExists()
            predicate = predicate + "first_name=?";
            params.push(queryFields.firstName)
        }
        if (queryFields.lastName) {
            predicateExists()
            predicate = predicate + "last_name=?";
            params.push(queryFields.lastName)
        }
        if (queryFields.phone) {
            predicateExists()
            predicate = predicate + "phone=?";
            params.push(queryFields.phone)
        }
        if (queryFields.email) {
            predicateExists()
            predicate = predicate + "email=?";
            params.push(queryFields.email)

        }
        if (queryFields.investmentTypeName) {
            predicateExists()
            predicate = predicate + "investment_type_name=?";
            params.push(queryFields.investmentTypeName)
        }
        if (queryFields.investmentTypeId) {
            predicateExists()
            predicate = predicate + "investment_type_id=?";
            params.push(queryFields.investmentTypeId)
        }


        if (queryFields.okraCustomerId) {
            predicateExists()
            predicate = predicate + "okra_customer_id=?"
            params.push(queryFields.okraCustomerId)
        }


        if (queryFields.rfiRecordId) {
            predicateExists()
            predicate = predicate + "rfi_record_id=?"
            params.push(queryFields.rfiRecordId)
        }
        if (queryFields.rfiCode) {
            predicateExists()
            predicate = predicate + "rfi_code=?";
            params.push(queryFields.rfiCode)
        }
        if (queryFields.amount) {
            predicateExists()
            predicate = predicate + "amount=?"
            params.push(queryFields.amount)
        }

        if (queryFields.duration) {
            predicateExists()
            predicate = predicate + "duration=?"
            params.push(queryFields.duration)
        }
        if (queryFields.tagName) {
            predicateExists()
            predicate = predicate + "tag_name=?"
            params.push(queryFields.tagName)
        }
        if (queryFields.currencyCode) {
            predicateExists()
            predicate = predicate + "currency_code=?"
            params.push(queryFields.currencyCode)
        }

        if (queryFields.lng) {
            predicateExists()
            predicate = predicate + "lng=?"
            params.push(queryFields.lng)
        }
        if (queryFields.lat) {
            predicateExists()
            predicate = predicate + "lat=?"
            params.push(queryFields.lat)
        }

        if (queryFields.interestRate) {
            predicateExists()
            predicate = predicate + "interest_rate=?"
            params.push(queryFields.interestRate)
        }
        if (queryFields.interestDueOnInvestment) {
            predicateExists()
            predicate = predicate + "interest_due_on_investment=?"
            params.push(queryFields.interestDueOnInvestment)
        }
        if (queryFields.totalAmountToPayout) {
            predicateExists()
            predicate = predicate + "total_amount_to_payout=?"
            params.push(queryFields.totalAmountToPayout)
        }
        if (queryFields.penalty) {
            predicateExists()
            predicate = predicate + "penalty=?"
            params.push(queryFields.penalty)
        }
        if (queryFields.createdAt) {
            predicateExists()
            predicate = predicate + "created_at=?"
            params.push(queryFields.createdAt)
        }
        // SELECT * FROM registered_persons
        // WHERE date_registered >= "2019-10-25" AND date_registered <= "2019-11-03";
        if (queryFields.createdAtFrom) {
            predicateExists()
            predicate = predicate + "created_at>=?"
            params.push(queryFields.createdAtFrom)
        } if (queryFields.createdAtTo) {
            predicateExists()
            predicate = predicate + "created_at<=?"
            params.push(queryFields.createdAtTo)
        }

        if (queryFields.checkedForPaymentAt) {
            predicateExists()
            predicate = predicate + "checked_for_payment_at=?"
            params.push(queryFields.checkedForPaymentAt)
        }
        if (queryFields.checkedForPaymentAtFrom) {
            predicateExists()
            predicate = predicate + "checked_for_payment_at>=?"
            params.push(queryFields.checkedForPaymentAtFrom)
        }
        if (queryFields.checkedForPaymentAtTo) {
            predicateExists()
            predicate = predicate + "checked_for_payment_at<=?"
            params.push(queryFields.checkedForPaymentAtTo)
        }

        if (queryFields.startDate) {
            predicateExists()
            predicate = predicate + "start_date=?"
            params.push(queryFields.startDate)
        }
        if (queryFields.startDateFrom) {
            predicateExists()
            predicate = predicate + "start_date>=?"
            params.push(queryFields.startDateFrom)
        }
        if (queryFields.startDateTo) {
            predicateExists()
            predicate = predicate + "start_date<=?"
            params.push(queryFields.startDateTo)
        }
        if (queryFields.payoutDate) {
            predicateExists()
            predicate = predicate + "payout_date=?"
            params.push(queryFields.payoutDate)
        }
        if (queryFields.payoutDateFrom) {
            predicateExists()
            predicate = predicate + "payout_date>=?"
            params.push(queryFields.payoutDateFrom)
        }
        if (queryFields.payoutDateTo) {
            predicateExists()
            predicate = predicate + "payout_date<=?"
            params.push(queryFields.payoutDateTo)
        }
        // isRolloverSuspended: schema.boolean.optional(),
        if (queryFields.isRolloverSuspended) {
            predicateExists()
            predicate = predicate + "is_rollover_suspended=?";
            // queryFields.isRolloverSuspended = queryFields.isRolloverSuspended == "true" ? 1 : 0;
            params.push(queryFields.isRolloverSuspended)
        }
        // rolloverReactivationDate: schema.date.optional({ format: 'yyyy-MM-dd', }),
        if (queryFields.rolloverReactivationDate) {
            predicateExists()
            predicate = predicate + "rollover_reactivation_date=?"
            params.push(queryFields.rolloverReactivationDate)
        }
        if (queryFields.rolloverReactivationDateFrom) {
            predicateExists()
            predicate = predicate + "rollover_reactivation_date>=?"
            params.push(queryFields.rolloverReactivationDateFrom)
        }
        if (queryFields.rolloverReactivationDateTo) {
            predicateExists()
            predicate = predicate + "rollover_reactivation_date<=?"
            params.push(queryFields.rolloverReactivationDateTo)
        }
        // isPayoutSuspended: schema.boolean.optional(),
        if (queryFields.isPayoutSuspended) {
            predicateExists()
            predicate = predicate + "is_payout_suspended=?";
            // queryFields.isPayoutSuspended = queryFields.isPayoutSuspended == "true" ? 1 : 0;
            params.push(queryFields.isPayoutSuspended)
        }
        // payoutReactivationDate: schema.date.optional({ format: 'yyyy-MM-dd', }),
        if (queryFields.payoutReactivationDate) {
            predicateExists()
            predicate = predicate + "payout_reactivation_date=?"
            params.push(queryFields.payoutReactivationDate)
        }
        if (queryFields.payoutReactivationDateFrom) {
            predicateExists()
            predicate = predicate + "payout_reactivation_date>=?"
            params.push(queryFields.payoutReactivationDateFrom)
        }
        if (queryFields.payoutReactivationDateTo) {
            predicateExists()
            predicate = predicate + "payout_reactivation_date<=?"
            params.push(queryFields.payoutReactivationDateTo)
        }

        if (queryFields.isTerminationAutomated) {
            predicateExists()
            predicate = predicate + "is_termination_automated=?";
            // queryFields.isTerminationAutomated = queryFields.isTerminationAutomated == "true" ? 1 : 0;
            params.push(queryFields.isTerminationAutomated)
        }
        if (queryFields.isInvestmentApproved) {
            predicateExists()
            predicate = predicate + "is_investment_approved=?";
            // queryFields.isInvestmentApproved = queryFields.isInvestmentApproved == "true" ? 1 : 0;
            params.push(queryFields.isInvestmentApproved)
        }

        if (queryFields.isPayoutSuccessful) {
            predicateExists()
            predicate = predicate + "is_payout_successful=?";
            // queryFields.isPayoutSuccessful = queryFields.isPayoutSuccessful == "true" ? 1 : 0;
            params.push(queryFields.isPayoutSuccessful)
        }
        if (queryFields.isRolloverActivated) {
            predicateExists()
            predicate = predicate + "is_rollover_activated=?";
            // queryFields.isRolloverActivated = queryFields.isRolloverActivated == "true" ? 1 : 0;
            params.push(queryFields.isRolloverActivated)
        }
        if (queryFields.requestType) {
            predicateExists()
            predicate = predicate + "request_type=?"
            params.push(queryFields.requestType)
        }
        if (queryFields.approvalStatus) {
            predicateExists()
            predicate = predicate + "approval_status=?"
            params.push(queryFields.approvalStatus)
        }
        if (queryFields.currentState) {
            predicateExists()
            predicate = predicate + "current_state=?"
            params.push(queryFields.currentState)
        }
        if (queryFields.currentLGA) {
            predicateExists()
            predicate = predicate + "current_lga=?"
            params.push(queryFields.currentLGA)
        }
        //  assignedTo, approvedBy,
        if (queryFields.processedBy) {
            predicateExists()
            predicate = predicate + "processed_by=?"
            params.push(queryFields.processedBy)
        }
        if (queryFields.assignedTo) {
            predicateExists()
            predicate = predicate + "assigned_to=?"
            params.push(queryFields.assignedTo)
        }
        if (queryFields.approvedBy) {
            predicateExists()
            predicate = predicate + "approved_by=?"
            params.push(queryFields.approvedBy)
        }
        if (queryFields.status) {

            let status = queryFields.status.split(",")
            // console.log(" status line 6096 ================================================================");
            // console.log(status);
            let orPredicate = "";
            for (let index = 0; index < status.length; index++) {
                const element = status[index];
                orPredicate = orPredicateExists(orPredicate)
                orPredicate = orPredicate + "status=?";
                // console.log(" orPredicate line 6102 ================================================================");
                // console.log(orPredicate);
                params.push(element)
            }
            predicateExists()
            predicate = predicate + "(" + orPredicate + ")"
            console.log(" predicate line 6112 ================================================================");
            console.log(predicate);
        }

        if (queryFields.label) {
            predicateExists()
            predicate = predicate + "label=?"
            params.push(queryFields.label)
        }
        if (queryFields.dateDisbursementWasDone) {
            predicateExists()
            predicate = predicate + "date_disbursement_was_done=?"
            params.push(queryFields.dateDisbursementWasDone)
        }
        if (queryFields.datePayoutWasDone) {
            predicateExists()
            predicate = predicate + "date_payout_was_done=?"
            params.push(queryFields.datePayoutWasDone)
        }
        if (queryFields.dateRecoveryWasDone) {
            predicateExists()
            predicate = predicate + "date_recovery_was_done=?"
            params.push(queryFields.dateRecoveryWasDone)
        }
        if (queryFields.investmentRequestReference) {
            predicateExists()
            predicate = predicate + "investment_request_reference=?"
            params.push(queryFields.investmentRequestReference)
        }
        if (queryFields.principalPayoutRequestReference) {
            predicateExists()
            predicate = predicate + "principal_payout_request_reference=?"
            params.push(queryFields.principalPayoutRequestReference)
        }
        if (queryFields.interestPayoutRequestReference) {
            predicateExists()
            predicate = predicate + "interest_payout_request_reference=?"
            params.push(queryFields.interestPayoutRequestReference)
        }
        if (queryFields.investmentDisbursementTransactionId) {
            predicateExists()
            predicate = predicate + "investment_disbursement_transaction_id=?"
            params.push(queryFields.investmentDisbursementTransactionId)
        }
        if (queryFields.investmentPayoutReference) {
            predicateExists()
            predicate = predicate + "investment_payout_reference=?"
            params.push(queryFields.investmentPayoutReference)
        }
        if (queryFields.investmentPayoutTransactionId) {
            predicateExists()
            predicate = predicate + "investment_payout_transaction_id=?"
            params.push(queryFields.investmentPayoutTransactionId)
        }
        if (queryFields.investmentServiceChargeTransactionReference) {
            predicateExists()
            predicate = predicate + "investment_service_charge_transaction_reference=?"
            params.push(queryFields.investmentServiceChargeTransactionReference)
        }
        if (queryFields.investmentServiceChargeTransactionId) {
            predicateExists()
            predicate = predicate + "investment_service_charge_transaction_id=?"
            params.push(queryFields.investmentServiceChargeTransactionId)
        }
        if (queryFields.verificationRequestAttempts) {
            predicateExists()
            predicate = predicate + "verification_request_attempts=?";
            params.push(queryFields.verificationRequestAttempts)
        }

        if (queryFields.numberOfAttempts) {
            predicateExists()
            predicate = predicate + "number_of_attempts=?";
            params.push(queryFields.numberOfAttempts)
        }
        if (queryFields.updatedAt) {
            predicateExists()
            predicate = predicate + "updated_at=?"
            params.push(queryFields.updatedAt)
        }
        if (queryFields.updatedAtFrom) {

            predicateExists()
            predicate = predicate + "updated_at>=?"
            params.push(queryFields.updatedAtFrom)
        }
        if (queryFields.updatedAtTo) {
            predicateExists()
            predicate = predicate + "updated_at<=?"
            params.push(queryFields.updatedAtTo)
        }


        response.sqlQuery = predicate
        response.params = params
        // console.log(response)
        return response
    }
}
