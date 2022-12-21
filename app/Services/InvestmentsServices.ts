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
import { dueForPayout, interestDueOnPayout, } from 'App/Helpers/utils';
import TimelinesServices from './TimelinesServices';
import TypesServices from './TypesServices';
import { debitUserWallet } from 'App/Helpers/debitUserWallet';
import { sendNotification } from 'App/Helpers/sendNotification';
import { creditUserWallet } from 'App/Helpers/creditUserWallet';
// import { creditUserWallet } from 'App/Helpers/creditUserWallet';
const randomstring = require("randomstring");
// const Env = require("@ioc:Adonis/Core/Env");
// const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
// const CHARGE = Env.get("SERVICE_CHARGE");
// const API_URL = Env.get("API_URL");
// const MINIMUM_BALANCE = Env.get("MINIMUM_BALANCE");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
// import AppException from 'App/Exceptions/AppException';

Database.query()

export default class InvestmentsServices {

    public async createInvestment(createInvestment: InvestmentType): Promise<Investment> {
        try {
            const investment = await Investment.create(createInvestment)
            return investment
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    // createNewInvestment
    public async createNewInvestment(createInvestment: InvestmentType, amountToInvest: number): Promise<Investment> {
        try {
            // const investment = await Investment.create(createInvestment)
            let payload = createInvestment;
            let record = payload;
            // START
            const investmentsService = new InvestmentsServices();
            const timelineService = new TimelinesServices();
            const typesService = new TypesServices();

            payload.amount = amountToInvest;
            record.amount = amountToInvest;
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
                walletId,
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
                // interestRate: 0,
                // interestDueOnInvestment: 0,
                // interestDueOnInvestment,
                // end
            } = record;
            // let { amount, investmentTypeId, rfiCode, walletId, userId, firstName, duration, currencyCode } = payload;
            let timelineObject;
            // console.log(
            //     ' The Rate return for RATE line 59: ',
            //     await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            // )
            // let rate = await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            let investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);

            let rate;
            // if (investmentTypeDetails) {
            //     let { interestRate } = investmentTypeDetails;
            //     rate = interestRate;
            // }

            let beneficiaryName = `${firstName} ${lastName}`;
            let beneficiaryAccountNumber = walletId;
            let beneficiaryAccountName = beneficiaryName;
            let beneficiaryPhoneNumber = phone;
            let beneficiaryEmail = email;
            // Send to the endpoint for debit of wallet
            let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;


            if (investmentTypeDetails) {
                let { interestRate, status, lowestAmount, highestAmount, investmentTenures } = investmentTypeDetails;
                if (status !== "active") {
                    // Payout the amount that is to be rollover
                    let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                        beneficiaryName,
                        beneficiaryAccountNumber,
                        beneficiaryAccountName,
                        beneficiaryEmail,
                        beneficiaryPhoneNumber,
                        rfiCode,
                        descriptionForPrincipal)
                    // if successful 
                    if (creditUserWalletWithPrincipal.status == 200) {
                        let amountPaidOut = amount;
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
                        let subject = "AstraPay Investment Payout";
                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid, because the investment type you selected for your rollover is presently not active.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 178:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    } else if (creditUserWalletWithPrincipal.status !== 200) {
                        let amountPaidOut = amount;
                        // update the investment details
                        //@ts-ignore
                        record.isInvestmentCompleted = true;
                        //@ts-ignore
                        record.investmentCompletionDate = DateTime.now();
                        //@ts-ignore
                        record.status = 'completed_with_principal_payout_outstanding';
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
                        // console.log("Timeline object line 2320:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 2323:", newTimeline);
                        // update record

                        // Send Details to notification service
                        let subject = "AstraPay Investment Payout and Rollover";
                        let message = `
                ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed.
                
                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 2337:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    }
                    throw new AppException({ message: `The investment type you selected is ${status} , please select another one and try again.`, codeSt: "422" })
                }
                if (amount < lowestAmount || amount > highestAmount) {
                    let message
                    if (amount < lowestAmount) {
                        message = `The least amount allowed for this type of investment is ${currencyCode} ${lowestAmount} , please input an amount that is at least ${currencyCode} ${lowestAmount} but less than or equal to ${currencyCode} ${highestAmount} and try again. Thank you.`;
                    } else if (amount > highestAmount) {
                        message = `The highest amount allowed for this type of investment is ${currencyCode} ${highestAmount} , please input an amount less than or equal to ${currencyCode} ${highestAmount} but at least ${currencyCode} ${lowestAmount} and try again. Thank you.`;
                    }
                    // Payout the amount that is to be rollover
                    let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                        beneficiaryName,
                        beneficiaryAccountNumber,
                        beneficiaryAccountName,
                        beneficiaryEmail,
                        beneficiaryPhoneNumber,
                        rfiCode,
                        descriptionForPrincipal)
                    // if successful 
                    if (creditUserWalletWithPrincipal.status == 200) {
                        let amountPaidOut = amount;
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
                        // console.log(" Current log, line 2188 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 298 :", updatedInvestment);

                        // console.log("Updated record Status line 300: ", record);

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
                        // console.log("Timeline object line 314:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 317:", newTimeline);
                        // update record

                        // Send Details to notification service
                        let subject = "AstraPay Investment Payout";
                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid because the amount to be rollover is not within the allowed range for this type of investment.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 331:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    } else if (creditUserWalletWithPrincipal.status !== 200) {
                        let amountPaidOut = amount;
                        // update the investment details
                        //@ts-ignore
                        record.isInvestmentCompleted = true;
                        //@ts-ignore
                        record.investmentCompletionDate = DateTime.now();
                        //@ts-ignore
                        record.status = 'completed_with_principal_payout_outstanding';
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
                        // console.log(" Current log, line 360 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 364 :", updatedInvestment);

                        // console.log("Updated record Status line 366: ", record);

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
                        // console.log("Timeline object line 380:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 383:", newTimeline);
                        // update record

                        // Send Details to notification service
                        let subject = "AstraPay Investment Payout and Rollover";
                        let message = `
                ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed.
                
                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 397:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    }
                    throw new AppException({ message: `${message}`, codeSt: "422" })
                }
                // if (investmentTenures.includes(duration) === false) {
                //     throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })
                // }
                let isTenureExisting = investmentTenures.find(o => o.$original.tenure == duration)
                // let isTenureExisting = investmentTenures.find(o =>{
                //   console.log(' o.$original return line 413 : ', o.$original.tenure)
                //   return o.$original.tenure.toString() == duration.toString();
                // })
                // console.log(' IsTenureExisting return line 416 : ', isTenureExisting)
                //  debugger
                if (isTenureExisting == false || isTenureExisting == undefined) {
                    // Payout the amount that is to be rollover
                    let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                        beneficiaryName,
                        beneficiaryAccountNumber,
                        beneficiaryAccountName,
                        beneficiaryEmail,
                        beneficiaryPhoneNumber,
                        rfiCode,
                        descriptionForPrincipal)
                    // if successful 
                    if (creditUserWalletWithPrincipal.status == 200) {
                        let amountPaidOut = amount;
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
                        // console.log(" Current log, line 451 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 455 :", updatedInvestment);

                        // console.log("Updated record Status line 457: ", record);

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
                        // console.log("Timeline object line 471:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 474:", newTimeline);
                        // update record

                        // Send Details to notification service
                        let subject = "AstraPay Investment Payout";
                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid because the tenure selected is not available on this type of investment.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 488:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    } else if (creditUserWalletWithPrincipal.status !== 200) {
                        let amountPaidOut = amount;
                        // update the investment details
                        //@ts-ignore
                        record.isInvestmentCompleted = true;
                        //@ts-ignore
                        record.investmentCompletionDate = DateTime.now();
                        //@ts-ignore
                        record.status = 'completed_with_principal_payout_outstanding';
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
                        // console.log(" Current log, line 517 :", currentInvestment);
                        // send for update
                        await investmentsService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 521 :", updatedInvestment);

                        // console.log("Updated record Status line 523: ", record);

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
                        // console.log("Timeline object line 537:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 540:", newTimeline);
                        // update record

                        // Send Details to notification service
                        let subject = "AstraPay Investment Payout Failed";
                        let message = `
                ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed.
                
                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        // console.log("newNotificationMessage line 554:", newNotificationMessage);
                        // debugger
                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessage.message !== "Success") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessage);
                        }
                    }
                    throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })
                }
                // debugger
                rate = interestRate;
            }

            console.log(' Rate return line 91 : ', rate)
            if (rate === undefined) {
                throw Error('no investment rate matched your search, please try again.')
            }
            // const investment = await Investment.create(payload)
            // @ts-ignore
            payload.investmentRequestReference = DateTime.now() + randomstring.generate(4);
            // @ts-ignore
            payload.isRequestSent = true;
            const investment = await investmentsService.createInvestment(payload);
            // console.log("New investment request line 105: ", investment);
            let decPl = 2;
            let interestRateByDuration = rate * (Number(investment.duration) / 360);
            console.log(`Interest rate by Investment duration for ${duration} day(s), @ investmentService line 124:`, interestRateByDuration)
            // convert to decimal places
            // interestRateByDuration = Number(getDecimalPlace(interestRateByDuration, decPl))
            interestRateByDuration = Number(interestRateByDuration.toFixed(decPl));
            console.log(`Interest rate by Investment duration for ${duration} day(s), in ${decPl} dp, @ investmentService line 127:`, interestRateByDuration);
            investment.interestRate = interestRateByDuration;
            // debugger
            // investment.interestRate = rate
            // investment.rolloverDone = payload.rolloverDone

            // When the Invest has been approved and activated
            // let amount = investment.amount
            let investmentDuration = investment.duration
            let amountDueOnPayout = await interestDueOnPayout(amountToInvest, rate, investmentDuration)
            // @ts-ignore
            investment.interestDueOnInvestment = amountDueOnPayout
            // @ts-ignore
            investment.totalAmountToPayout = investment.amount + amountDueOnPayout

            // investment.payoutDate = await payoutDueDate(investment.startDate, investment.duration)
            // @ts-ignore
            // investment.walletId = investorFundingWalletId
            // await investment.save()
            // console.log('The new investment:', investment)

            // TODO
            // Send Investment Payload To Transaction Service
            // let sendToTransactionService //= new SendToTransactionService(investment)
            // console.log(' Feedback from Transaction service: ', sendToTransactionService)
            // UPDATE Investment Status based on the response from Transaction Service
            // let duration = Number(investment.duration)
            // let updatedCreatedAt = DateTime.now().plus({ hours: 2 }).toISODate()
            // let updatedPayoutDate = DateTime.now().plus({ days: duration }).toISODate()
            // console.log('updated CreatedAt Time : ' + updatedCreatedAt)
            // console.log('Updated Payout Date: ' + updatedPayoutDate)
            // Save Investment new status to Database
            // await investment.save()
            // Send Investment Initiation Message to Queue

            // check if Approval is set to Auto, from Setting Controller
            // let userId = investment.userId
            let investmentId = investment.id
            // let requestType = 'start_investment'
            // let settings = await Setting.query().where({ rfiCode: rfiCode })
            // console.log('Approval setting line 910:', settings[0])
            const settingsService = new SettingsServices();
            const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
            if (!settings) {
                throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
            }
            // let timeline: any[] = []
            //  create a new object for the timeline
            timelineObject = {
                id: uuid(),
                investmentId: investmentId,
                walletId: walletId,
                userId: userId,
                action: 'investment initiated',
                // @ts-ignore
                message: `${firstName} just initiated an investment.`,
                createdAt: investment.createdAt,
                metadata: `duration: ${investment.duration}`,
            }
            console.log('Timeline object line 163:', timelineObject)
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log('Timeline object line 927:', newTimeline)

            //  Check if investment activation is automated
            let approvalIsAutomated = settings.isInvestmentAutomated
            // let approvalIsAutomated = false
            if (approvalIsAutomated === false) {
                // Send Approval Request to Admin
                // let approval = await approvalRequest(userId, investmentId, requestType)
                // console.log(' Approval request return line 938 : ', approval)
                // if (approval === undefined) {
                //   return response.status(400).json({
                //     status: 'FAILED',
                //     message: 'investment approval request was not successful, please try again.',
                //     data: [],
                //   })
                // }
                const approvalsService = new ApprovalsServices()
                let approvalObject;

                // TODO: Send to the Admin for approval
                // update approvalObject
                approvalObject = {
                    walletId: investment.walletId,
                    investmentId: investment.id,
                    userId: investment.userId,
                    requestType: "start_investment",
                    approvalStatus: investment.approvalStatus,
                    assignedTo: "",//investment.assignedTo,
                    processedBy: "",//investment.processedBy,
                    // remark: "",
                };
                // console.log("ApprovalRequest object line 210:", approvalObject);
                // check if the approval request is not existing
                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
                if (!approvalRequestIsExisting) {
                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                    console.log("new ApprovalRequest object line 215:", newApprovalRequest);
                }

            } else if (approvalIsAutomated === true) {
                // TODO
                // Send Investment Payload To Transaction Service
                // let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
                // console.log(' Feedback from Transaction service: ', sendToTransactionService)
                investment.approvedBy = investment.approvedBy !== undefined ? investment.approvedBy : "automation"
                investment.assignedTo = investment.assignedTo !== undefined ? investment.assignedTo : "automation"
                // investment.approvalStatus = "approved"//approval.approvalStatus;
                // Data to send for transfer of fund
                let { amount, lng, lat, investmentRequestReference,
                    firstName, lastName,
                    walletId, userId,
                    phone,
                    email,
                    rfiCode, currencyCode } = investment;
                let senderName = `${firstName} ${lastName}`;
                let senderAccountNumber = walletId;
                let senderAccountName = senderName;
                let senderPhoneNumber = phone;
                let senderEmail = email;
                // Send to the endpoint for debit of wallet
                let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                    senderName,
                    senderAccountNumber,
                    senderAccountName,
                    senderPhoneNumber,
                    senderEmail,
                    rfiCode)
                // debugger

                // before

                // update the investment details
                investment.status = 'investment_approved'
                investment.approvalStatus = 'approved'
                // investment.startDate = DateTime.now() //.toISODate()
                // investment.payoutDate = DateTime.now().plus({ days: investment.duration })
                // investment.isInvestmentCreated = true

                // Save the updated record
                // await record.save();
                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                // console.log(" Current log, line 327 :", currentInvestment);
                // send for update
                let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
                console.log(" Current log, line 330 :", updatedInvestment);

                // console.log("Updated record Status line 735: ", record);

                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment approved",
                    investmentId: investmentId,//id,
                    walletId: walletId,// walletId, 
                    userId: userId,// userId,
                    // @ts-ignore
                    message: `${firstName}, your investment request has been approved, please wait while the investment is activated. Thank you.`,
                    createdAt: DateTime.now(),
                    metadata: ``,
                };
                // console.log("Timeline object line 551:", timelineObject);
                await timelineService.createTimeline(timelineObject);

                // Send Details to notification service
                let subject = "AstraPay Investment Approval";
                let message = `
                ${firstName} this is to inform you, that your Investment request, has been approved.

                Please wait while the investment is being activated. 

                Thank you.

                AstraPay Investment.`;
                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                console.log("newNotificationMessage line 1338:", newNotificationMessage);
                if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                    console.log("Notification sent successfully");
                } else if (newNotificationMessage.message !== "Success") {
                    console.log("Notification NOT sent successfully");
                    console.log(newNotificationMessage);
                }


                // Testing
                // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
                // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
                // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
                // console.log('Testing Payout Date: ' + testingPayoutDate)

                // update record
                currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                // console.log(" Current log, line 321 :", currentInvestment);
                // send for update
                updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
                // console.log(" Current log, line 324 :", updatedInvestment);
                // if successful 
                if (debitUserWalletForInvestment.status == 200) {
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
                    // console.log(" Current log, line 341 :", currentInvestment);
                    // send for update
                    updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
                    console.log(" Current log, line 344 :", updatedInvestment);

                    // console.log("Updated record Status line 1281: ", record);
                    timelineObject = {
                        id: uuid(),
                        investmentId: investmentId,
                        userId: userId,
                        walletId: walletId,
                        action: 'investment activated',
                        // @ts-ignore
                        message: `${firstName} investment has just been activated.`,
                        createdAt: investment.startDate,
                        metadata: `duration: ${investment.duration}, payout date : ${investment.payoutDate}`,
                    }
                    // console.log('Timeline object line 1004:', timelineObject)
                    await timelineService.createTimeline(timelineObject);
                    // Send Details to notification service
                    let subject = "AstraPay Investment Activation";
                    let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${investment.duration} days, has been activated on ${investment.startDate} and it will be mature for payout on ${investment.payoutDate}.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                    // console.log("newNotificationMessage line 398:", newNotificationMessage);
                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessage.message !== "Success") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessage);
                    }
                } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                    console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 1009 ============`);
                    // debugger
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 1072 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);

                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment activation failed",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 855:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 858:", newTimeline);
                    // update record
                    // debugger
                    // Send Details to notification service
                    let subject = "AstraPay Investment Activation Failed";
                    let message = `
                ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again.

                Thank you.

                AstraPay Investment.`;
                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                    // console.log("newNotificationMessage line 870:", newNotificationMessage);
                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessage.message !== "Success") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessage);
                    }

                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 879 =========:", updatedInvestment);
                    // console.log("debitUserWalletForInvestment reponse data 1052 ==================================", debitUserWalletForInvestment)
                    // debugger
                    // throw Error(debitUserWalletForInvestment);
                    throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                    // return {
                    //         status: "FAILED",//debitUserWalletForInvestment.status,
                    //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                    //     };
                }
            }

            // END
            return investment
        } catch (error) {
            console.log(error)
            throw error
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
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
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
                        console.log('Time investment was started line 973: ', startDate)
                        // let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 976:', isDueForPayout)
                        // let amt = investment.amount
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 984:', settings)
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
                                //       status: 'FAILED',
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
                                    console.log("new ApprovalRequest object line 1040:", newApprovalRequest);
                                }

                                // investment = await Investment.query().where('id', investmentId)
                                investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                                // investment.requestType = requestType
                                // investment.status = "matured"
                                // investment.approvalStatus = 'pending'

                                // update timeline
                                // timelineObject = {
                                //     id: uuid(),
                                //     action: 'investment payout initiated',
                                //     investmentId: investment.id,//id,
                                //     walletId: investment.walletId,// walletId, 
                                //     userId: investment.userId,// userId,
                                //     // @ts-ignore
                                //     message: `${investment.firstName} investment has just been sent for payout processing.`,
                                //     createdAt: DateTime.now(),
                                //     metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                // }
                                // // console.log('Timeline object line 1429:', timelineObject)
                                // //  Push the new object to the array
                                // // timeline = investment.timeline
                                // // timeline.push(timelineObject)
                                // // console.log('Timeline object line 1433:', timeline)
                                // // stringify the timeline array
                                // await timelineService.createTimeline(timelineObject);
                                // investment.timeline = JSON.stringify(timeline)


                                // Send Details to notification service
                                //                 let subject = "AstraPay Investment Payout";
                                //                 let message = `
                                // ${firstName} your mature investment has just been sent for payout processing.

                                // Please check your device. 

                                // Thank you.

                                // AstraPay Investment.`;
                                //                 let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                //                 // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                //                 // debugger
                                //                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                //                     console.log("Notification sent successfully");
                                //                 } else if (newNotificationMessage.message !== "Success") {
                                //                     console.log("Notification NOT sent successfully");
                                //                     console.log(newNotificationMessage);
                                //                 }

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
                                        let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                                        console.log("new ApprovalRequest object line 1040:", newApprovalRequest);
                                    }

                                    // update timeline
                                    // timelineObject = {
                                    //     id: uuid(),
                                    //     action: 'investment payout initiated',
                                    //     investmentId: investment.id,//id,
                                    //     walletId: investment.walletId,// walletId, 
                                    //     userId: investment.userId,// userId,
                                    //     // @ts-ignore
                                    //     message: `${investment.firstName} investment has just been sent for payout processing.`,
                                    //     createdAt: DateTime.now(),
                                    //     metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                                    // }
                                    // // console.log('Timeline object line 667:', timelineObject)
                                    // //  Push the new object to the array
                                    // // timeline = investment.timeline
                                    // // timeline.push(timelineObject)
                                    // // console.log('Timeline object line 671:', timeline)
                                    // // stringify the timeline array
                                    // await timelineService.createTimeline(timelineObject);


                                    // Send Details to notification service
                                    //                     let subject = "AstraPay Investment Payout";
                                    //                     let message = `
                                    // ${firstName} your mature investment has just been sent for payout processing.

                                    // Please check your device. 

                                    // Thank you.

                                    // AstraPay Investment.`;
                                    //                     let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    //                     // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                    //                     // debugger
                                    //                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    //                         console.log("Notification sent successfully");
                                    //                     } else if (newNotificationMessage.message !== "Success") {
                                    //                         console.log("Notification NOT sent successfully");
                                    //                         console.log(newNotificationMessage);
                                    //                     }

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
                                //       status: 'FAILED',
                                //       message: 'payout approval request was not successful, please try again.',
                                //       data: [],
                                //     })
                                //   }
                                // }

                                let approvalObject;

                                // TODO: Send to the Admin for approval
                                // update approvalObject
                                approvalObject = {
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
                                // investment.requestType = requestType
                                // investment.status = "matured"
                                // investment.approvalStatus = 'pending'

                                // Send Details to notification service
                                //                 let subject = "AstraPay Investment Payout";
                                //                 let message = `
                                // ${firstName} your mature investment has just been sent for payout processing.

                                // Please check your device. 

                                // Thank you.

                                // AstraPay Investment.`;
                                //                 let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                //                 // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                //                 // debugger
                                //                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                //                     console.log("Notification sent successfully");
                                //                 } else if (newNotificationMessage.message !== "Success") {
                                //                     console.log("Notification NOT sent successfully");
                                //                     console.log(newNotificationMessage);
                                //                 }

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
                        return {
                            status: 'FAILED',
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
            await trx.commit();
            // console.log("Response data in investment service, line 516:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async collateMaturedInvestment(queryParams: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
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
                        console.log('investment search data :', investment.$original)
                        let { rfiCode, startDate, duration } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for payout status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        // let duration = 4
                        console.log('Time investment was started line 1469: ', startDate)
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
                            let { firstName, email } = payload;
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
                                //       status: 'FAILED',
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
                                investment.status = "matured"
                                investment.approvalStatus = 'pending'

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout initiated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId, 
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for payout processing.`,
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


                                // Send Details to notification service
                                let subject = "AstraPay Investment Payout";
                                let message = `
                ${firstName} your mature investment has just been sent for payout processing.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                // debugger
                                if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessage.message !== "Success") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessage);
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
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1655 :", updatedInvestment);
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
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 654 :", updatedInvestment);
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout initiated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId, 
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for payout processing.`,
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


                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Payout";
                                    let message = `
                ${firstName} your mature investment has just been sent for payout processing.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                    // debugger
                                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessage.message !== "Success") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessage);
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
                        }
                    } else {
                        return {
                            status: 'FAILED',
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
                    console.log("Error line 1723:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 516:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async sumOfMaturedInvestment(queryParams: any): Promise<Investment | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
                .sum('total_amount_to_payout as totalAmountDueForPayout')
                .where('status', "matured")
                .first()
            // .where('payout_date', '>=', payoutDateFrom)
            // .where('payout_date', '<=', payoutDateTo)
            // .offset(offset)
            // .limit(limit)
            // .forUpdate()

            // console.log("responseData.totalAmountDueForPayout ",responseData.totalAmountDueForPayout) // prints the sum of the values in the 'column_name' column
            // console.log("Investment Info, line 583: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no matured investment or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no matured investment or payout has been completed. Please, check and try again.`, codeSt: "404" })
            }
            return responseData;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async activateApprovedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
                .where('status', "investment_approved")
                .where('request_type', "start_investment")
                .where('approval_status', "approved")
                // .where('payout_date', '<=', payoutDateTo)
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log("Investment Info, line 583: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no approved investment that is yet to be activated or wallet has been successfully debited. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is yet to be activated or wallet has been successfully debited. Please, check and try again.`, codeSt: "404" })
            }

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                try {
                    console.log("Entering update 777 ==================================")
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
                    console.log(" Login User Data line 797 =========================");
                    console.log(loginUserData);
                    // TODO: Uncomment to use LoginUserData
                    // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
                    // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
                    // console.log(" Login User Data line 801 =========================");
                    // console.log(loginUserData);
                    // console.log(" Login User Roles line 803 =========================");
                    // console.log(loginUserData.roles);
                    // let { roles, biodata } = loginUserData;

                    // console.log("Admin roles , line 807 ==================")
                    // console.log(roles)
                    // // @ts-ignore
                    // let { fullName } = biodata;
                    // let loginAdminFullName = fullName;
                    // console.log("Login Admin FullName, line 812 ==================")
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
                    // console.log("investmentId line 824 ===================================", approval.investmentId)
                    // console.log("linkAccountId line 825 ===================================", approval.linkAccountId)
                    // console.log("tokenId line 826 ===================================", approval.tokenId)
                    // console.log("cardId line 827 ===================================", approval.cardId)
                    // console.log("accountId line 828 ===================================", approval.accountId)
                    if (id != null) {
                        investmentId = id;
                        // debugger
                        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                    }
                    // console.log(" idToSearch RESULT ===============================: ", idToSearch);
                    // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
                    // console.log(" record RESULT ===============================: ", record);
                    console.log("check approval record 837 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);

                    if (investment) {
                        console.log("Investment approval Selected for Update line 845:");
                        // update the data
                        // TODO: Uncomment to use loginAdminFullName
                        // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                        // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                        // payload.remark = remark !== undefined ? remark : approval.remark;
                        // console.log("Admin remark line 498 ==================== ", approval.remark);
                        // console.log("Admin remark line 499 ========*******************=========== ", remark);
                        // let newStatus;
                        // await approval.save();
                        // console.log("Update Approval Request line 504:", approval);
                        let { currencyCode, lastName, } = record;
                        console.log("Surname: ", lastName)
                        // console.log("CurrencyCode: ", currencyCode)
                        // debugger
                        // let email = email;
                        let timelineObject;
                        // console.log("Approval.requestType: ===========================================>", approval.requestType)
                        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                        if (record.status === "investment_approved" && record.requestType === "start_investment" && record.approvalStatus === "approved") { //&& record.status == "submitted"
                            console.log("Activation for investment request processing line 2007: ===========================================>")
                            // TODO: Uncomment to use loginAdminFullName
                            // record.processedBy = loginAdminFullName;
                            // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                            // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                            // record.approvalStatus = approval.approvalStatus; 

                            // console.log("Updated record Status line 537: ", record);
                            // Data to send for transfer of fund
                            let { amount, lng, lat, investmentRequestReference,
                                firstName, lastName, userId, walletId,
                                phone,
                                email,
                                rfiCode } = record;
                            let senderName = `${firstName} ${lastName}`;
                            let senderAccountNumber = walletId;
                            let senderAccountName = senderName;
                            let senderPhoneNumber = phone;
                            let senderEmail = email;
                            // Send to the endpoint for debit of wallet
                            // debugger
                            let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                                senderName,
                                senderAccountNumber,
                                senderAccountName,
                                senderPhoneNumber,
                                senderEmail,
                                rfiCode)
                            // debugger
                            // console.log("debitUserWalletForInvestment reponse data 608 ==================================", debitUserWalletForInvestment)
                            // if successful 
                            if (debitUserWalletForInvestment.status == 200) {
                                // update the investment details
                                record.status = 'active'
                                // record.approvalStatus = 'approved'
                                record.startDate = DateTime.now() //.toISODate()
                                record.payoutDate = DateTime.now().plus({ days: record.duration })
                                record.isInvestmentCreated = true
                                // console.log("Updated record Status line 537: ", record);

                                // update record
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // debugger
                                // console.log(" Current log, line 610 :", currentInvestment);
                                // send for update
                                await investmentsService.updateInvestment(currentInvestment, record);
                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                // console.log(" Current log, line 614 =========:", updatedInvestment);

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
                                // console.log("Timeline object line 551:", timelineObject);
                                await timelineService.createTimeline(timelineObject);
                                // let newTimeline = await timelineService.createTimeline(timelineObject);
                                // console.log("new Timeline object line 553:", newTimeline);
                                // update record
                                // debugger
                                // Send Details to notification service
                                let subject = "AstraPay Investment Activation";
                                let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} has been activated.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                // console.log("newNotificationMessage line 1060:", newNotificationMessage);
                                if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessage.message !== "Success") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessage);
                                }
                                // debugger
                            } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                                console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 1009 ============`);
                                // debugger
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // console.log(" Current log, line 1072 :", currentInvestment);
                                // send for update
                                await investmentsService.updateInvestment(currentInvestment, record);

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
                                // Send Details to notification service
                                let subject = "AstraPay Investment Activation Failed";
                                let message = `
                ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again.

                Thank you.

                AstraPay Investment.`;
                                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                // console.log("newNotificationMessage line 1103:", newNotificationMessage);
                                if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessage.message !== "Success") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessage);
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
                            // console.log(" Current log, line 1007 :", currentInvestment);
                            // send for update
                            await investmentsService.updateInvestment(currentInvestment, record);
                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 1011 =========:", updatedInvestment);

                        }
                        // Update Investment data
                        // console.log(" Updated record line 1015: ", record.$original);
                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                        // debugger
                        // send to user
                        await trx.commit();
                        return {
                            status: 'OK',
                            data: currentInvestment,
                        }
                    } else {
                        // console.log("Entering no data 1023 ==================================")
                        return {
                            status: 'FAILED',
                            message: 'no investment matched your search',
                            data: [],
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 1030", error.messages);
                    console.log("Error line 1031", error.message);
                    // console.log("Error line 1032", error.message);
                    // debugger
                    await trx.rollback()
                    console.log(`Error line 1046, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
                    throw error;
                }
            }

            for (let index = 0; index < responseData.length; index++) {
                try {
                    const investment = responseData[index];
                    await processInvestment(investment);
                    investmentArray.push(investment);
                } catch (error) {
                    console.log("Error line 1046 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 1063:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async reactivateSuspendedPayoutInvestment(queryParams: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
        try {
            // console.log("Query params in investment service line 40:", queryParams)
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
            if(payoutReactivationDate){
               responseData  = await Database
                .from('investments')
                .useTransaction(trx) // 👈
                .where('status', "payout_suspended")
                .where('is_payout_suspended', true)
                // .where('payout_date', '>=', payoutDateFrom)
                .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                .where('approval_status', "suspend_payout")
                .offset(offset)
                .limit(limit)  
                debugger
            } else {
                 responseData  = await Database
                .from('investments')
                .useTransaction(trx) // 👈
                .where('status', "payout_suspended")
                .where('is_payout_suspended', true)
                // .where('payout_date', '>=', payoutDateFrom)
                // .orWhere('payout_reactivation_date', '<=', payoutReactivationDate)
                .where('approval_status', "suspend_payout")
                .offset(offset)
                .limit(limit)
                debugger
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
                    debugger
                    if (investment && investment.$original.status == "payout_suspended") {
                        console.log('investment search data :', investment.$original)
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
                        debugger
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
                            let { firstName, email } = payload;
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
                                //       status: 'FAILED',
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

                                // update timeline
                                timelineObject = {
                                    id: uuid(),
                                    action: 'investment payout reactivated',
                                    investmentId: investment.id,//id,
                                    walletId: investment.walletId,// walletId, 
                                    userId: investment.userId,// userId,
                                    // @ts-ignore
                                    message: `${investment.firstName} investment has just been sent for payout processing.`,
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


                                // Send Details to notification service
                                let subject = "AstraPay Investment Payout Reactivation";
                                let message = `
                ${firstName} your mature investment has just been sent for payout processing.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                // console.log("newNotificationMessage line 2358:", newNotificationMessage);
                                // debugger
                                if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                    console.log("Notification sent successfully");
                                } else if (newNotificationMessage.message !== "Success") {
                                    console.log("Notification NOT sent successfully");
                                    console.log(newNotificationMessage);
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
                                // await investmentsService.updateInvestment(record, investment);
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 2379 :", updatedInvestment);
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
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 2394 :", updatedInvestment);
                                    // update timeline
                                    timelineObject = {
                                        id: uuid(),
                                        action: 'investment payout reactivated',
                                        investmentId: investment.id,//id,
                                        walletId: investment.walletId,// walletId, 
                                        userId: investment.userId,// userId,
                                        // @ts-ignore
                                        message: `${investment.firstName} investment has just been sent for payout processing.`,
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


                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Payout Reactivation";
                                    let message = `
                ${firstName} your mature investment has just been sent for payout processing.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                    // debugger
                                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessage.message !== "Success") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessage);
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
                        }
                    } else {
                        return {
                            status: 'FAILED',
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
                    console.log("Error line 2468", error.messages);
                    console.log("Error line 2469", error.message);
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
                    console.log("Error line 2482:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 516:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async payoutMaturedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
                .where('status', 'matured')
                .andWhere('request_type', 'payout_investment')
                .andWhere('approval_status', 'approved')
                .andWhere('is_payout_successful', 'false')
                .andWhere('is_rollover_activated', 'false')
                .andWhere('is_rollover_suspended', 'false')
                .andWhere('is_payout_suspended', 'false')
                .andWhere('payout_date', '<=', selectedDate)
                .offset(offset)
                .limit(limit)
            // .orWhere('status', "completed_with_interest_payout_outstanding")
            // .orWhere('status', "completed_with_principal_payout_outstanding")
            // .andWhereNot('status', "completed")
            // .orWhere('is_rollover_activated', 'true')
            // .forUpdate()

            console.log(" responseData line 2220 ==============")
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
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);

                    if (investment) {
                        console.log("Investment approval Selected for Update line 2303:");
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
                                let { amount, lng, lat, id,
                                    firstName, lastName,
                                    walletId,
                                    phone,
                                    email,
                                    rfiCode, interestDueOnInvestment } = record;
                                let beneficiaryName = `${firstName} ${lastName}`;
                                let beneficiaryAccountNumber = walletId;
                                let beneficiaryAccountName = beneficiaryName;
                                let beneficiaryPhoneNumber = phone;
                                let beneficiaryEmail = email;
                                // Send to the endpoint for debit of wallet
                                let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                let descriptionForInterest = `Payout of the interest of ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;

                                // Payout Principal
                                let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                                    beneficiaryName,
                                    beneficiaryAccountNumber,
                                    beneficiaryAccountName,
                                    beneficiaryEmail,
                                    beneficiaryPhoneNumber,
                                    rfiCode,
                                    descriptionForPrincipal)

                                // Payout Interest
                                let creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
                                    beneficiaryName,
                                    beneficiaryAccountNumber,
                                    beneficiaryAccountName,
                                    beneficiaryEmail,
                                    beneficiaryPhoneNumber,
                                    rfiCode,
                                    descriptionForInterest)
                                // debugger
                                // if successful 
                                if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithInterest.status == 200) {
                                    let amountPaidOut = amount + interestDueOnInvestment;
                                    // update the investment details
                                    record.isInvestmentCompleted = true;
                                    record.investmentCompletionDate = DateTime.now();
                                    record.status = 'completed';
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
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1313 :", updatedInvestment);

                                    // console.log("Updated record Status line 1315: ", record);

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

                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Payout";
                                    let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // console.log("newNotificationMessage line 567:", newNotificationMessage);
                                    // debugger
                                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessage.message !== "Success") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessage);
                                    }
                                    // commit transaction and changes to database
                                    await trx.commit();
                                    // debugger
                                } else if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithInterest.status !== 200) {
                                    let amountPaidOut = amount
                                    // update the investment details
                                    record.isInvestmentCompleted = true;
                                    record.investmentCompletionDate = DateTime.now();
                                    record.status = 'completed_with_interest_payout_outstanding';
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
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1372 :", updatedInvestment);

                                    // console.log("Updated record Status line 1374: ", record);

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

                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Payout";
                                    let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // console.log("newNotificationMessage line 1405:", newNotificationMessage);
                                    // debugger
                                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessage.message !== "Success") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessage);
                                    }
                                    // commit transaction and changes to database
                                    await trx.commit();
                                    // debugger
                                } else if (creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest.status == 200) {
                                    let amountPaidOut = interestDueOnInvestment
                                    // update the investment details
                                    record.isInvestmentCompleted = true;
                                    record.investmentCompletionDate = DateTime.now();
                                    record.status = 'completed_with_principal_payout_outstanding';
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
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1431 :", updatedInvestment);

                                    // console.log("Updated record Status line 1433: ", record);

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

                                    // Send Details to notification service
                                    let subject = "AstraPay Investment Payout";
                                    let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                    let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                    // console.log("newNotificationMessage line 1465:", newNotificationMessage);
                                    // debugger
                                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                        console.log("Notification sent successfully");
                                    } else if (newNotificationMessage.message !== "Success") {
                                        console.log("Notification NOT sent successfully");
                                        console.log(newNotificationMessage);
                                    }
                                    // commit transaction and changes to database
                                    await trx.commit();
                                    // debugger
                                } else {
                                    console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                    // update record
                                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                    // console.log(" Current log, line 1484 :", currentInvestment);
                                    // send for update
                                    await investmentsService.updateInvestment(currentInvestment, record);
                                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                    // console.log(" Current log, line 1488 :", updatedInvestment);
                                    // debugger
                                    throw Error();
                                }
                            } else {
                                // console.log("Entering no data 1492 ==================================")
                                return {
                                    status: 'FAILED',
                                    message: 'no investment matched your search',
                                    data: [],
                                }
                            }
                        } else {
                            return {
                                status: 'FAILED',
                                message: 'this investment is not mature for payout.',
                                data: [],
                            }
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 1520", error.messages);
                    console.log("Error line 1511", error.message);
                    // console.log("Error line 1512", error.message);
                    // debugger
                    await trx.rollback()
                    console.log(`Error line 1515, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
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
                    console.log("Error line 1526 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 1063:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async retryFailedPayoutOfMaturedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
                .where('status', "completed_with_interest_payout_outstanding")
                .orWhere('status', "completed_with_principal_payout_outstanding")
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

            console.log(" responseData line 2725 ==============")
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
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);

                    if (investment) {
                        console.log("Investment approval Selected for Update line 2303:");
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
                                let { amount, lng, lat, id,
                                    firstName, lastName,
                                    walletId,
                                    phone,
                                    email,
                                    rfiCode, interestDueOnInvestment } = record;
                                let beneficiaryName = `${firstName} ${lastName}`;
                                let beneficiaryAccountNumber = walletId;
                                let beneficiaryAccountName = beneficiaryName;
                                let beneficiaryPhoneNumber = phone;
                                let beneficiaryEmail = email;
                                // Send to the endpoint for debit of wallet
                                let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                let descriptionForInterest = `Payout of the interest of ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
                                let creditUserWalletWithPrincipal;
                                let creditUserWalletWithInterest;
                                if (status == "completed_with_interest_payout_outstanding") {
                                    // Payout Interest
                                    creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
                                        beneficiaryName,
                                        beneficiaryAccountNumber,
                                        beneficiaryAccountName,
                                        beneficiaryEmail,
                                        beneficiaryPhoneNumber,
                                        rfiCode,
                                        descriptionForInterest)
                                    // if successful 
                                    if (creditUserWalletWithInterest.status == 200) {
                                        let amountPaidOut = interestDueOnInvestment;
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
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
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1313 :", updatedInvestment);

                                        // console.log("Updated record Status line 1315: ", record);

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

                                        // Send Details to notification service
                                        let subject = "AstraPay Investment Payout";
                                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                        // console.log("newNotificationMessage line 2946:", newNotificationMessage);
                                        // debugger
                                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessage.message !== "Success") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessage);
                                        }
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithInterest.status !== 200) {
                                        let amountPaidOut = interestDueOnInvestment
                                        // update the investment details
                                        // record.isInvestmentCompleted = true;
                                        // record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_interest_payout_outstanding';
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
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1372 :", updatedInvestment);

                                        // console.log("Updated record Status line 1374: ", record);

                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
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

                                        // Send Details to notification service
                                        let subject = "AstraPay Investment Payout Failed";
                                        let message = `
                ${firstName} this is to inform you, that the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has failed.
                
                Please be patient as we try again

                Thank you.

                AstraPay Investment.`;
                                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                        // console.log("newNotificationMessage line 1405:", newNotificationMessage);
                                        // debugger
                                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessage.message !== "Success") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessage);
                                        }
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // debugger
                                    }
                                }

                                if (status == "completed_with_principal_payout_outstanding") {
                                    // Payout Principal
                                    creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                                        beneficiaryName,
                                        beneficiaryAccountNumber,
                                        beneficiaryAccountName,
                                        beneficiaryEmail,
                                        beneficiaryPhoneNumber,
                                        rfiCode,
                                        descriptionForPrincipal)
                                    // if successful 
                                    if (creditUserWalletWithPrincipal.status == 200) {
                                        let amountPaidOut = amount;
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
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
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1313 :", updatedInvestment);

                                        // console.log("Updated record Status line 1315: ", record);

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

                                        // Send Details to notification service
                                        let subject = "AstraPay Investment Payout";
                                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                        // console.log("newNotificationMessage line 2946:", newNotificationMessage);
                                        // debugger
                                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessage.message !== "Success") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessage);
                                        }
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // debugger
                                    } else if (creditUserWalletWithPrincipal.status !== 200) {
                                        let amountPaidOut = amount;
                                        // update the investment details
                                        // record.isInvestmentCompleted = true;
                                        // record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed_with_principal_payout_outstanding';
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
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 1372 :", updatedInvestment);

                                        // console.log("Updated record Status line 1374: ", record);

                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment payout",
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

                                        // Send Details to notification service
                                        let subject = "AstraPay Investment Payout Failed";
                                        let message = `
                ${firstName} this is to inform you, that the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has failed.
                
                Please be patient as we try again

                Thank you.

                AstraPay Investment.`;
                                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                        // console.log("newNotificationMessage line 3149:", newNotificationMessage);
                                        // debugger
                                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessage.message !== "Success") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessage);
                                        }
                                        // commit transaction and changes to database
                                        await trx.commit();
                                        // debugger
                                    }
                                }
                                // debugger

                                // else {
                                // console.log("Entering failed payout of principal and interest data block ,line 1487 ==================================")
                                // update record
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // console.log(" Current log, line 3168 :", currentInvestment);
                                // send for update
                                await investmentsService.updateInvestment(currentInvestment, record);
                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                // console.log(" Current log, line 3172 :", updatedInvestment);
                                // debugger
                                // throw Error();
                                //}
                            } else {
                                // console.log("Entering no data 3177 ==================================")
                                return {
                                    status: 'FAILED',
                                    message: 'no investment matched your search',
                                    data: [],
                                }
                            }
                        } else {
                            return {
                                status: 'FAILED',
                                message: 'this investment is not mature for payout.',
                                data: [],
                            }
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 3195", error.messages);
                    console.log("Error line 3196", error.message);
                    // console.log("Error line 3197", error.message);
                    // debugger
                    await trx.rollback()
                    console.log(`Error line 3200, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
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
                    console.log("Error line 3212 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 3218:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    public async rolloverMaturedInvestment(queryParams: any, loginUserData?: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
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
                .useTransaction(trx) // 👈
                .where('status', "matured")
                .where('request_type', "payout_investment")
                // .orWhere('approval_status', "pending")
                .where('approval_status', "approved")
                .where('is_rollover_activated', "true")
                .where('is_rollover_suspended', "false")
                .where('payout_date', '<=', selectedDate) // where payout date is yesterday or today.
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log(" responseData line 1796 ==============")
            // console.log(responseData)
            // debugger

            if (responseData.length < 1) {
                console.log(`There is no approved investment that is matured for rollover. Please, check and try again.`)
                throw new AppException({ message: `There is no approved investment that is matured for rollover. Please, check and try again.`, codeSt: "404" })
            }
            // debugger

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { id, } = investment;//request.all()
                try {
                    console.log("Entering update 1808 ==================================")
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
                    console.log(" Login User Data line 1170 =========================");
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
                    console.log("check approval record 1866 ==================================")
                    // debugger
                    if (record == undefined || !record) {
                        return { status: "FAILED", message: "Not Found,try again." };
                    }
                    // console.log(" QUERY RESULT for record: ", record.$original);

                    if (investment) {
                        console.log("Investment approval Selected for Update line 1874:");
                        // update the data
                        // TODO: Uncomment to use loginAdminFullName
                        // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                        // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                        // payload.remark = remark !== undefined ? remark : approval.remark;
                        // console.log("Admin remark line 1880 ==================== ", approval.remark);
                        // console.log("Admin remark line 1881 ========*******************=========== ", remark);
                        // let newStatus;
                        // await approval.save();
                        // console.log("Update Approval Request line 1884:", approval);
                        // let { currencyCode, lastName, } = record;
                        // let { currencyCode, lastName, startDate, duration } = record;
                        // console.log("Surname: ", lastName)
                        // console.log("CurrencyCode: ", currencyCode)
                        // debugger
                        // let email = email;
                        let timelineObject;
                        // console.log("Approval.requestType: ===========================================>", approval.requestType)
                        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
                        let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        let duration = 4
                        console.log('Time investment was started line 1896: ', startDate)
                        // let timelineObject
                        // let timeline
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 1900:', isDueForPayout)
                        // debugger
                        if (isDueForPayout === true) {
                            //   record.isPayoutAuthorized === true,
                            //   record.isPayoutSuspended === false,
                            // payoutReactivationDate: null,
                            if ((record.status === "matured" && record.requestType === "payout_investment" && record.approvalStatus === "approved" && record.isRolloverActivated === true &&
                                record.isRolloverSuspended === false) || (record.status === "matured" && record.requestType === "payout_investment" && record.approvalStatus === "pending" && record.isRolloverActivated === true &&
                                    record.isRolloverSuspended === false)) {
                                // START 
                                console.log("Approval for investment rollover processing: ===========================================>")
                                // newStatus = "submitted";
                                // newStatus = "rollover"; //'pending_account_number_generation'; 
                                // record.status = "completed";
                                // record.requestType = "rollover_investment";
                                // record.requestType = "payout_investment";
                                // record.remark = approval.remark;
                                // record.isInvestmentApproved = true;
                                // TODO: Uncomment to use loginAdminFullName
                                // record.processedBy = loginAdminFullName;
                                // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
                                // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
                                record.approvalStatus = "approved";
                                // Data to send for transfer of fund
                                let { id,
                                    rolloverDone,
                                    // start
                                    lastName,
                                    firstName,
                                    walletId,
                                    userId,
                                    investmentTypeId,
                                    investmentTypeName,
                                    rfiCode,
                                    currencyCode,
                                    lng,
                                    lat,
                                    rfiRecordId,
                                    phone,
                                    email,
                                    investorFundingWalletId,
                                    amount,
                                    duration,
                                    isRolloverActivated,
                                    rolloverType,
                                    rolloverTarget,
                                    investmentType,
                                    tagName,
                                    // interestRate: 0,
                                    // interestDueOnInvestment: 0,
                                    totalAmountToPayout,
                                    interestRate,
                                    interestDueOnInvestment,
                                    status,
                                    isRolloverSuspended
                                    // totalAmountToPayout,
                                    // end

                                } = record;
                                let beneficiaryName = `${firstName} ${lastName}`;
                                let beneficiaryAccountNumber = walletId;
                                let beneficiaryAccountName = beneficiaryName;
                                let beneficiaryPhoneNumber = phone;
                                let beneficiaryEmail = email;
                                // Send to the endpoint for debit of wallet
                                let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
                                let descriptionForInterest = `Payout of the interest of ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;

                                // Check if the user set Rollover
                                // "rolloverType": "101",
                                // "rolloverTarget": 3,
                                // "rolloverDone": 0,
                                // '100' = 'no rollover',
                                //   '101' = 'rollover principal only',
                                //   '102' = 'rollover principal with interest',
                                //   '103' = 'rollover interest only',
                                if ((isRolloverActivated == true && rolloverType !== "100" && status === "matured" && isRolloverSuspended === false)) { // || (isRolloverActivated == true && rolloverType !== "100" && status === "matured")
                                    // if (isRolloverActivated == true && rolloverTarget > 0 && rolloverTarget > rolloverDone && rolloverType !== "100") {
                                    // check type of rollover
                                    if (rolloverType == "101") {
                                        //   '101' = 'rollover principal only',
                                        // payout interest
                                        // TODO: Remove after test
                                        // let creditUserWalletWithInterest = {status:200}
                                        let creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForInterest)
                                        // if successful 
                                        if (creditUserWalletWithInterest.status == 200) {
                                            let amountPaidOut = interestDueOnInvestment;
                                            // update the investment details
                                            record.isInvestmentCompleted = true;
                                            record.investmentCompletionDate = DateTime.now();
                                            record.status = 'completed';
                                            // record.approvalStatus = approval.approvalStatus;//'payout'
                                            record.isPayoutAuthorized = true;
                                            record.isPayoutSuccessful = true;
                                            record.datePayoutWasDone = DateTime.now();
                                            // debugger

                                            // Save the updated record
                                            // await record.save();
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                            // console.log(" Current log, line 2008 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 2011 :", updatedInvestment);

                                            // console.log("Updated record Status line 2013: ", record);

                                            // update timeline
                                            timelineObject = {
                                                id: uuid(),
                                                action: "investment payout and rollover",
                                                investmentId: investmentId,//id,
                                                walletId: walletIdToSearch,// walletId, 
                                                userId: userIdToSearch,// userId,
                                                // @ts-ignore
                                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                                                createdAt: DateTime.now(),
                                                metadata: ``,
                                            };
                                            // console.log("Timeline object line 996:", timelineObject);
                                            await timelineService.createTimeline(timelineObject);
                                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                                            // console.log("new Timeline object line 559993:", newTimeline);
                                            // update record

                                            // Send Details to notification service
                                            let subject = "AstraPay Investment Payout and Rollover";
                                            let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid and the principal of ${currencyCode} ${amount} has been rollover.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                            console.log("newNotificationMessage line 1013:", newNotificationMessage);
                                            // debugger
                                            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                                console.log("Notification sent successfully");
                                            } else if (newNotificationMessage.message !== "Success") {
                                                console.log("Notification NOT sent successfully");
                                                console.log(newNotificationMessage);
                                            }
                                        } else if (creditUserWalletWithInterest.status !== 200) {
                                            let amountPaidOut = interestDueOnInvestment;
                                            // update the investment details
                                            record.isInvestmentCompleted = true;
                                            record.investmentCompletionDate = DateTime.now();
                                            record.status = 'completed_with_interest_payout_outstanding';
                                            // record.approvalStatus = approval.approvalStatus;//'payout'
                                            record.isPayoutAuthorized = true;
                                            record.isPayoutSuccessful = false;
                                            // record.datePayoutWasDone = DateTime.now();
                                            // debugger

                                            // Save the updated record
                                            // await record.save();
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                            // console.log(" Current log, line 2038 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 2042 :", updatedInvestment);

                                            // console.log("Updated record Status line 2044: ", record);

                                            // update timeline
                                            timelineObject = {
                                                id: uuid(),
                                                action: "investment rollover successful but payout failed",
                                                investmentId: investmentId,//id,
                                                walletId: walletIdToSearch,// walletId, 
                                                userId: userIdToSearch,// userId,
                                                // @ts-ignore
                                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                                                createdAt: DateTime.now(),
                                                metadata: ``,
                                            };
                                            // console.log("Timeline object line 2058:", timelineObject);
                                            await timelineService.createTimeline(timelineObject);
                                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                                            // console.log("new Timeline object line 2061:", newTimeline);
                                            // update record

                                            // Send Details to notification service
                                            let subject = "AstraPay Investment Rollover Successful but Payout Failed";
                                            let message = `
                ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed. 
                
                Please be patient as we try again.

                Thank you.

                AstraPay Investment.`;
                                            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                            // console.log("newNotificationMessage line 2075:", newNotificationMessage);
                                            // debugger
                                            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                                console.log("Notification sent successfully");
                                            } else if (newNotificationMessage.message !== "Success") {
                                                console.log("Notification NOT sent successfully");
                                                console.log(newNotificationMessage);
                                            }
                                        }
                                        // create new investment
                                        let newInvestmentPayload = {
                                            rolloverDone,
                                            // start
                                            lastName,
                                            firstName,
                                            walletId,
                                            userId,
                                            investmentTypeId,
                                            investmentTypeName,
                                            rfiCode,
                                            currencyCode,
                                            lng,
                                            lat,
                                            rfiRecordId,
                                            phone,
                                            email,
                                            investorFundingWalletId,
                                            amount,
                                            duration,
                                            isRolloverActivated,
                                            rolloverType,
                                            rolloverTarget,
                                            investmentType,
                                            tagName,
                                            interestRate,
                                            interestDueOnInvestment: 0,
                                            totalAmountToPayout: 0,
                                        }
                                        await investmentsService.createNewInvestment(newInvestmentPayload, amount)
                                        // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, amount)
                                        // console.log("newInvestmentDetails ", newInvestmentDetails)
                                        // debugger
                                    } else if (rolloverType == "102") {
                                        //   '102' = 'rollover principal with interest',
                                        // Update investment record
                                        // let amountPaidOut = totalAmountToPayout;
                                        // update the investment details
                                        record.isInvestmentCompleted = true;
                                        record.investmentCompletionDate = DateTime.now();
                                        record.status = 'completed';
                                        // record.approvalStatus = approval.approvalStatus;//'payout'
                                        record.isPayoutAuthorized = true;
                                        record.isPayoutSuccessful = true;
                                        record.datePayoutWasDone = DateTime.now();
                                        // update record
                                        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                        // console.log(" Current log, line 2131 :", currentInvestment);
                                        // send for update
                                        await investmentsService.updateInvestment(currentInvestment, record);
                                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                        // console.log(" Current log, line 2135 :", updatedInvestment);

                                        // create newInvestment
                                        // update timeline
                                        timelineObject = {
                                            id: uuid(),
                                            action: "investment rollover",
                                            investmentId: investmentId,//id,
                                            walletId: walletIdToSearch,// walletId, 
                                            userId: userIdToSearch,// userId,
                                            // @ts-ignore
                                            message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment has been rollover. Thank you.`,
                                            createdAt: DateTime.now(),
                                            metadata: ``,
                                        };
                                        // console.log("Timeline object line 996:", timelineObject);
                                        await timelineService.createTimeline(timelineObject);
                                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                                        // console.log("new Timeline object line 2154:", newTimeline);
                                        // update record

                                        // Send Details to notification service
                                        let subject = "AstraPay Investment Rollover";
                                        let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${totalAmountToPayout} for your matured Investment, has been rollover.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                                        let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                        // console.log("newNotificationMessage line 2168:", newNotificationMessage);
                                        // debugger
                                        if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                            console.log("Notification sent successfully");
                                        } else if (newNotificationMessage.message !== "Success") {
                                            console.log("Notification NOT sent successfully");
                                            console.log(newNotificationMessage);
                                        }

                                        // create new investment
                                        let newInvestmentPayload = {
                                            rolloverDone,
                                            // start
                                            lastName,
                                            firstName,
                                            walletId,
                                            userId,
                                            investmentTypeId,
                                            investmentTypeName,
                                            rfiCode,
                                            currencyCode,
                                            lng,
                                            lat,
                                            rfiRecordId,
                                            phone,
                                            email,
                                            investorFundingWalletId,
                                            amount,
                                            duration,
                                            isRolloverActivated,
                                            rolloverType,
                                            rolloverTarget,
                                            investmentType,
                                            tagName,
                                            interestRate,
                                            interestDueOnInvestment: 0,
                                            totalAmountToPayout: 0,
                                        }
                                        await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
                                        // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
                                        // console.log("newInvestmentDetails ", newInvestmentDetails)
                                        // debugger
                                    } else if (rolloverType == "103") {
                                        //   '103' = 'rollover interest only',
                                        // payout interest
                                        // TODO: Remove after test
                                        // let creditUserWalletWithPrincipal = {status:200}
                                        let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                                            beneficiaryName,
                                            beneficiaryAccountNumber,
                                            beneficiaryAccountName,
                                            beneficiaryEmail,
                                            beneficiaryPhoneNumber,
                                            rfiCode,
                                            descriptionForPrincipal)
                                        // if successful 
                                        if (creditUserWalletWithPrincipal.status == 200) {
                                            let amountPaidOut = amount;
                                            // update the investment details
                                            record.isInvestmentCompleted = true;
                                            record.investmentCompletionDate = DateTime.now();
                                            record.status = 'completed';
                                            // record.approvalStatus = approval.approvalStatus;//'payout'
                                            record.isPayoutAuthorized = true;
                                            record.isPayoutSuccessful = true;
                                            record.datePayoutWasDone = DateTime.now();
                                            // debugger

                                            // Save the updated record
                                            // await record.save();
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                            // console.log(" Current log, line 2188 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 2192 :", updatedInvestment);

                                            // console.log("Updated record Status line 2194: ", record);

                                            // update timeline
                                            timelineObject = {
                                                id: uuid(),
                                                action: "investment payout and rollover",
                                                investmentId: investmentId,//id,
                                                walletId: walletIdToSearch,// walletId, 
                                                userId: userIdToSearch,// userId,
                                                // @ts-ignore
                                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, and the interest of ${currencyCode} ${interestDueOnInvestment} has been rollover, please check your device. Thank you.`,
                                                createdAt: DateTime.now(),
                                                metadata: ``,
                                            };
                                            // console.log("Timeline object line 2208:", timelineObject);
                                            await timelineService.createTimeline(timelineObject);
                                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                                            // console.log("new Timeline object line 2211:", newTimeline);
                                            // update record

                                            // Send Details to notification service
                                            let subject = "AstraPay Investment Payout and Rollover";
                                            let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid and the interest of ${currencyCode} ${interestDueOnInvestment} has been rollover.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                            // console.log("newNotificationMessage line 2225:", newNotificationMessage);
                                            // debugger
                                            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                                console.log("Notification sent successfully");
                                            } else if (newNotificationMessage.message !== "Success") {
                                                console.log("Notification NOT sent successfully");
                                                console.log(newNotificationMessage);
                                            }
                                        } else if (creditUserWalletWithPrincipal.status !== 200) {
                                            let amountPaidOut = amount;
                                            // update the investment details
                                            record.isInvestmentCompleted = true;
                                            record.investmentCompletionDate = DateTime.now();
                                            record.status = 'completed_with_principal_payout_outstanding';
                                            // record.approvalStatus = approval.approvalStatus;//'payout'
                                            record.isPayoutAuthorized = true;
                                            record.isPayoutSuccessful = false;
                                            // record.datePayoutWasDone = DateTime.now();
                                            // debugger

                                            // Save the updated record
                                            // await record.save();
                                            // update record
                                            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                            // console.log(" Current log, line 2300 :", currentInvestment);
                                            // send for update
                                            await investmentsService.updateInvestment(currentInvestment, record);
                                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                            // console.log(" Current log, line 2304 :", updatedInvestment);

                                            // console.log("Updated record Status line 2304: ", record);

                                            // update timeline
                                            timelineObject = {
                                                id: uuid(),
                                                action: "investment rollover successful but payout failed",
                                                investmentId: investmentId,//id,
                                                walletId: walletIdToSearch,// walletId, 
                                                userId: userIdToSearch,// userId,
                                                // @ts-ignore
                                                message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, and the interest of ${currencyCode} ${interestDueOnInvestment} has been rollover, please check your device. Thank you.`,
                                                createdAt: DateTime.now(),
                                                metadata: ``,
                                            };
                                            // console.log("Timeline object line 2320:", timelineObject);
                                            await timelineService.createTimeline(timelineObject);
                                            // let newTimeline = await timelineService.createTimeline(timelineObject);
                                            // console.log("new Timeline object line 2323:", newTimeline);
                                            // update record

                                            // Send Details to notification service
                                            let subject = "AstraPay Investment Payout and Rollover";
                                            let message = `
                ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, and the interest of ${currencyCode} ${interestDueOnInvestment} has been rollover.
                
                Please check your device. 

                Thank you.

                AstraPay Investment.`;
                                            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                                            // console.log("newNotificationMessage line 2337:", newNotificationMessage);
                                            // debugger
                                            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                                                console.log("Notification sent successfully");
                                            } else if (newNotificationMessage.message !== "Success") {
                                                console.log("Notification NOT sent successfully");
                                                console.log(newNotificationMessage);
                                            }
                                        }
                                        // create new investment
                                        let newInvestmentPayload = {
                                            rolloverDone,
                                            // start
                                            lastName,
                                            firstName,
                                            walletId,
                                            userId,
                                            investmentTypeId,
                                            investmentTypeName,
                                            rfiCode,
                                            currencyCode,
                                            lng,
                                            lat,
                                            rfiRecordId,
                                            phone,
                                            email,
                                            investorFundingWalletId,
                                            amount,
                                            duration,
                                            isRolloverActivated,
                                            rolloverType,
                                            rolloverTarget,
                                            investmentType,
                                            tagName,
                                            interestRate,
                                            interestDueOnInvestment: 0,
                                            totalAmountToPayout: 0,
                                        }

                                        await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
                                        // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
                                        // console.log("newInvestmentDetails ", newInvestmentDetails)
                                        // debugger
                                    }
                                }
                                // update record
                                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                                // console.log(" Current log, line 2384 :", currentInvestment);
                                // send for update
                                await investmentsService.updateInvestment(currentInvestment, record);
                                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                                // console.log(" Current log, line 2388 :", updatedInvestment);
                            } else {
                                // console.log("Entering no data 2390 ==================================")
                                return {
                                    status: 'FAILED',
                                    message: 'no investment matched your search',
                                    data: [],
                                }
                            }
                        } else {
                            return {
                                status: 'FAILED',
                                message: 'this investment is not mature for rollover.',
                                data: [],
                            }
                        }
                    }
                } catch (error) {
                    console.log(error)
                    // debugger
                    console.log("Error line 2407", error.messages);
                    console.log("Error line 2408", error.message);
                    // console.log("Error line 2410", error.message);
                    // debugger
                    await trx.rollback()
                    console.log(`Error line 2413, status: "FAILED",message: ${error.messages} ,hint: ${error.message},`)
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
                    console.log("Error line 2425 =====================:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in investment service, line 1063:", investmentArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
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
            console.log("Investment search result from service")
            console.log(investment);
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
            console.log("Investment search result from service")
            console.log(investment);
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
            console.log("Investment search result from service")
            console.log(investment);
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

            // console.log(" updatedAtFrom line 2543 ==============================================================");
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
    // getInvestmentByWalletIdAndInvestmentIdAndStatusAndUserIdAndRequestType(walletId,investmentId,status,userId,requestType);
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
