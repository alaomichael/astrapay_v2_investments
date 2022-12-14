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
import { dueForPayout, interestDueOnPayout, investmentRate } from 'App/Helpers/utils';
import TimelinesServices from './TimelinesServices';
import TypesServices from './TypesServices';
import { debitUserWallet } from 'App/Helpers/debitUserWallet';
import { sendNotification } from 'App/Helpers/sendNotification';
// import SettingServices from "App/Services/SettingsServices";
// import TimelinesServices from './TimelinesServices'
// import InvestmentabilityStatusesServices from './InvestmentabilityStatusesServices'
// import TypesServices from './TypesServices'
// import PayoutSchedulesServices from './PayoutSchedulesServices'
// import { calculateTotalCharge, dueForPayout, investmentDuration } from 'App/Helpers/utils_02'
// import { debitUserWallet } from 'App/Helpers/debitUserWallet'
// import { getUserWalletsById } from 'App/Helpers/getUserWalletsById'
// import { createNewInvestmentWallet } from 'App/Helpers/createNewInvestmentWallet'
// import axios from 'axios'
// import { disburseApprovedInvestment } from 'App/Helpers/disburseApprovedInvestment'
// import { sendNotification } from 'App/Helpers/sendNotification';
// import { repayDueInvestment } from 'App/Helpers/repayDueInvestment';
// import RepaidInvestmentsServices from './RepaidInvestmentsServices';
// import PayoutDefaultersServices from './PayoutDefaultersServices';
// import { recoverInvestmentFromUserMainWallet } from 'App/Helpers/recoverInvestmentFromUserMainWallet';
const randomstring = require("randomstring");
// const Env = require("@ioc:Adonis/Core/Env");
// const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
// const CHARGE = Env.get("SERVICE_CHARGE");
// const API_URL = Env.get("API_URL");
// const MINIMUM_BALANCE = Env.get("MINIMUM_BALANCE");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");


// import AppException from 'App/Exceptions/AppException';
// import Timeline from 'App/Models/Timeline';
// import { getCustomerSavingsAccountBalance } from 'App/Helpers/getCustomerSavingsAccountBalance';
// import { manualInvestmentRecoveryFromUser } from 'App/Helpers/manualInvestmentRecoveryFromUser';
// import InvestmentLogsServices from './InvestmentLogsServices';

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
            // START
            const investmentsService = new InvestmentsServices();
            const timelineService = new TimelinesServices();
            const typesService = new TypesServices();

            payload.amount = amountToInvest;
            // let payloadAmount = payload.amount;
            // let payloadDuration = payload.duration;
            // let payloadInvestmentType = payload.investmentType;
            // let payloadinvestmentTypeId = payload.investmentTypeId;
            let { amount, investmentTypeId, rfiCode, walletId, userId, firstName, duration, currencyCode } = payload;
            // console.log(
            //     ' The Rate return for RATE line 79: ',
            //     await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            // )
            // let rate = await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
            let investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);

            let rate;
            // if (investmentTypeDetails) {
            //     let { interestRate } = investmentTypeDetails;
            //     rate = interestRate;
            // }
            if (investmentTypeDetails) {
                let { interestRate, status, lowestAmount, highestAmount, investmentTenures } = investmentTypeDetails;
                if (status !== "active") {
                    throw new AppException({ message: `The investment type you selected is ${status} , please select another one and try again.`, codeSt: "422" })
                }
                if (amount < lowestAmount || amount > highestAmount) {
                    let message
                    if (amount < lowestAmount) {
                        message = `The least amount allowed for this type of investment is ${currencyCode} ${lowestAmount} , please input an amount that is at least ${currencyCode} ${lowestAmount} but less than or equal to ${currencyCode} ${highestAmount} and try again. Thank you.`;
                    } else if (amount > highestAmount) {
                        message = `The highest amount allowed for this type of investment is ${currencyCode} ${highestAmount} , please input an amount less than or equal to ${currencyCode} ${highestAmount} but at least ${currencyCode} ${lowestAmount} and try again. Thank you.`;
                    }
                    throw new AppException({ message: `${message}`, codeSt: "422" })
                }
                if (investmentTenures.includes(duration) === false) {
                    throw new AppException({ message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`, codeSt: "404" })
                }
                console.log("investmentTenures.includes(duration) line 106 =======", investmentTenures.includes(duration))
                debugger
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
            debugger
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
            let timelineObject = {
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
                // console.log("ApprovalRequest object line 197:", approvalObject);
                // check if the approval request is not existing
                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
                if (!approvalRequestIsExisting) {
                    let newApprovalRequest = await approvalsService.createApproval(approvalObject);
                    console.log("new ApprovalRequest object line 199:", newApprovalRequest);
                }

            } else if (approvalIsAutomated === true) {
                // TODO
                // Send Investment Payload To Transaction Service
                // let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
                // console.log(' Feedback from Transaction service: ', sendToTransactionService)
                investment.approvedBy = investment.approvedBy !== undefined ? investment.approvedBy : "automation"
                investment.assignedTo = investment.assignedTo !== undefined ? investment.assignedTo : "automation"
                investment.approvalStatus = "investment_approved"//approval.approvalStatus;
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
                investment.status = 'approved'
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

                // console.log("Updated record Status line 332: ", record);

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

                    // update timeline
                    // timelineObject = {
                    //     id: uuid(),
                    //     action: "investment approved",
                    //     investmentId: investmentId,//id,
                    //     walletId: walletId,// walletId, 
                    //     userId: userId,// userId,
                    //     // @ts-ignore
                    //     message: `${firstName}, your investment request has been approved, please wait while the investment is started. Thank you.`,
                    //     createdAt: DateTime.now(),
                    //     metadata: ``,
                    // };
                    // console.log("Timeline object line 551:", timelineObject);
                    // await timelineService.createTimeline(timelineObject);

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
                    console.log("newNotificationMessage line 398:", newNotificationMessage);
                    if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessage.message !== "Success") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessage);
                    }
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

            console.log(" updatedAtFrom line 66 ==============================================================");
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

            console.log("Response data in investment service:", responseData)
            // debugger;
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async collateMaturedInvestment(queryParams: any): Promise<Investment[] | any> {
        const trx = await Database.transaction();
        try {
            // console.log("Query params in loan service line 40:", queryParams)
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
                // .where('payout_date', '<=', payoutDateTo)
                .offset(offset)
                .limit(limit)
            // .forUpdate()

            // console.log("Loan Info, line 583: ", investments);
            // console.log(responseData)
            // debugger
            if (!responseData) {
                console.log(`There is no active investment or payout has been completed. Please, check and try again.`)
                throw new AppException({ message: `There is no active investment or payout has been completed. Please, check and try again.`, codeSt: "500" })
            }

            let investmentArray: any[] = [];
            const processInvestment = async (investment) => {
                let { userId, id } = investment;//request.all()
                try {
                    const timelineService = new TimelinesServices();
                    const investmentsService = new InvestmentsServices();
                    // let currentDate = DateTime.now().toISO()
                    // @ts-ignore
                    // let id = request.input('userId')
                    // let { userId, investmentId } = request.all()
                    // let { userId, investmentId } = investment;//request.all()
                    console.log('Params for update line 1318: ' + ' userId: ' + userId + ', investmentId: ' + id)
                    // let investment = await Investment.query().where('user_id', id).where('id', params.id)
                    // let investment = await Investment.query().where('id', investmentId)
                    let investmentId = id;
                    let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
                    // console.log('Investment Info, line 1322: ', investment)
                    // debugger
                    if (investment && investment.$original.status == "active") {
                        console.log('investment search data :', investment.$original)
                        let { rfiCode } = investment.$original;
                        // @ts-ignore
                        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
                        // console.log('Is due for payout status :', isDueForPayout)
                        // TODO: Change below to real data
                        // TESTING
                        let startDate = DateTime.now().minus({ days: 5 }).toISO()
                        let duration = 4
                        console.log('Time investment was started line 163: ', startDate)
                        let timelineObject
                        let isDueForPayout = await dueForPayout(startDate, duration)
                        console.log('Is due for payout status line 166:', isDueForPayout)
                        // let amt = investment.amount
                        const settingsService = new SettingsServices();
                        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
                        if (!settings) {
                            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
                        }

                        console.log('Approval setting line 1339:', settings)
                        if (isDueForPayout) {
                            //  START
                            let payload = investment.$original
                            // send to Admin for approval
                            let userId = payload.userId
                            let investmentId = payload.id
                            let walletId = payload.walletId
                            let approvalStatus = payload.approvalStatus
                            let requestType = 'payout_investment'
                            // let  approvalStatus = 'approved'

                            let approvalIsAutomated;// = settings.isTerminationAutomated
                            // let approvalRequestIsExisting
                            if (settings.isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
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
                                const approvalsService = new ApprovalsServices()
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
                                let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalStatus);
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
                                let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                console.log(" Current log, line 1655 :", updatedInvestment);
                                // debugger
                            } else if (settings.isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
                                if (investment.status !== 'paid' || investment.status !== 'completed') {
                                    // update status of investment
                                    investment.requestType = requestType
                                    investment.approvalStatus = 'approved'
                                    investment.status = 'payout'
                                    investment.isPayoutAuthorized = true
                                    investment.isTerminationAuthorized = true
                                    // Save
                                    // await investment.save()
                                    let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                    // send for update
                                    await investmentsService.updateInvestment(record, investment);
                                    // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                    // console.log(" Current log, line 1672 :", updatedInvestment);
                                }
                                // Send notification
                                // await investment.save()
                                let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                                // send for update
                                await investmentsService.updateInvestment(record, investment);
                                // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
                                // console.log(" Current log, line 1680 :", updatedInvestment);
                            }

                            console.log('Investment data after payout request line 314:', investment)
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
                    console.log("Error line 330", error.messages);
                    console.log("Error line 331", error.message);
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
                    console.log("Error line 362:", error);
                    throw error;
                }
            }
            // commit transaction and changes to database
            await trx.commit();
            // console.log("Response data in loan service, line 516:", loanArray);
            return investmentArray;
        } catch (error) {
            console.log(error)
            await trx.rollback();
            throw error;
        }
    }

    // public async selectInvestmentsForGrant(queryParams: any): Promise<Investment[] | any> {
    //     const trx = await Database.transaction();
    //     try {
    //         // console.log("Query params in investment service line 40:", queryParams)
    //         let { limit, offset = 0, updatedAtFrom, updatedAtTo, } = queryParams;

    //         if (!updatedAtFrom) {
    //             // default to last 3 months
    //             queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //             updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //         }
    //         // debugger;
    //         if (!updatedAtTo) {
    //             queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
    //             updatedAtTo = DateTime.now().toISO();//.toISODate();
    //         }
    //         // console.log("queryParams line 142 =========================")
    //         // console.log(queryParams)
    //         // console.log("updatedAtFrom line 149 =========================")
    //         // console.log(updatedAtFrom)
    //         // console.log("updatedAtTo line 151 =========================")
    //         // console.log(updatedAtTo)
    //         offset = Number(offset);
    //         limit = Number(limit);
    //         // const queryGetter = await this.queryBuilder(queryParams)
    //         // Database.rawQuery('START TRANSACTION;');
    //         // let responseData = await Database.rawQuery('select * from investments where status = ? LIMIT ?, ? FOR UPDATE;', ["pending disbursement", offset, limit])
    //         // .then(await Database.rawQuery('select * from investments where status = ? for update', ["pending disbursement"]));
    //         //;
    //         // let responseData = await Database.rawQuery('select * from investments where status = ? for update', ["pending disbursement"] )
    //         // .timeout(2000) // in milliseconds
    //         // .offset(offset)
    //         // .limit(limit)

    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         // const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         const typesService = new TypesServices();
    //         // const payoutSchedulesService = new PayoutSchedulesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // debugger;
    //         // console.log("Approval setting line 83:", settings);
    //         if (!settings) {
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw Error(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //         }
    //         //  get the investment currency
    //         let { currencyCode, } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('status', "pending_disbursement")
    //             .where('updated_at', '>=', updatedAtFrom)
    //             .where('updated_at', '<=', updatedAtTo)
    //             .offset(offset)
    //             .limit(limit)
    //         // .forUpdate()

    //         // console.log("Investment Info, line 583: ", investments);
    //         // console.log(responseData)
    //         if (!responseData) {
    //             console.log(`There is no active investment or payout has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `There is no active investment or payout has been completed. Please, check and try again.`, codeSt: "500" })
    //         }

    //         let investmentArray: any[] = [];
    //         const processInvestment = async (investment) => {
    //             let { investment_type_id, created_at, } = investment;
    //             // console.log("Created at for the current investment line 106", created_at);
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             investment.checked_for_payment_at = DateTime.now();
    //             // console.log("Created at for the current investment line 111", investment.created_at);

    //             let timelineObject;
    //             if (investment.status !== 'active' && investment.status === 'pending_disbursement') {

    //                 //  START
    //                 try {
    //                     // let payload;
    //                     // copy the investment data to payload
    //                     // let payload = {
    //                     //     status: 'active',
    //                     //     label: "grant"
    //                     //   };
    //                     // debit user main wallet with total charge
    //                     // Total charge = fixed charge + (amount * rated charge)

    //                     // console.log(" investmentTypeName ==============================");
    //                     // console.log(investment_type_name);
    //                     // const investmentType = await typesService.getTypeByTypeName(investment_type_name);

    //                     // New Code Update
    //                     // console.log(" investmentTypeId ==============================");
    //                     // console.log(investment_type_id);
    //                     const investmentType = await typesService.getTypeByTypeId(investment_type_id)

    //                     // console.log(" investmentType ==============================");
    //                     // console.log(investmentType);
    //                     if (!investmentType) {
    //                         // new Error(`Investment Type Named: ${investment_type_name} does not exist.`)
    //                         // console.log(`Investment Type Named: ${investment_type_name} does not exist.`)
    //                         console.log(`Investment Type Id: ${investment_type_id} does not exist.`)
    //                         return;
    //                     }
    //                     // @ts-ignore
    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount, interestOnInvestmentAccount } = investmentType;
    //                     let amountApproved = investment.amount_approved;
    //                     let totalCharge = Number(await calculateTotalCharge(amountApproved, fixedCharge, ratedCharge));
    //                     // console.log("Total amount to be charged:", totalCharge);
    //                     // debit the wallet with service CHARGE
    //                     let { id, lng, lat, wallet_id, user_id, customer_savings_account, amount_approved } = investment;
    //                     try {
    //                         // console.log("Try Block walletId, line 629: ", wallet_id);
    //                         // TODO
    //                         // check service charge transaction id to avoid double charges, incase the other steps failed, after a successful deduction of charge
    //                         let investmentServiceChargeTransactionId = investment.investment_service_charge_transaction_id;
    //                         let investmentServiceChargeTransactionReference = investment.investment_service_charge_transaction_reference;
    //                         let serviceChargeHasBeenPaid = investment.is_service_charge_deduction_successful.toString() == "1" ? "true" : "false";
    //                         // console.log("serviceChargeHasBeenPaid , line 1094:", serviceChargeHasBeenPaid);
    //                         if (serviceChargeHasBeenPaid == "false" || !investmentServiceChargeTransactionId || !investmentServiceChargeTransactionReference) {
    //                             //  Generate investment request reference
    //                             investmentServiceChargeTransactionReference = DateTime.now() + randomstring.generate(4);

    //                             // console.log("The ASTRAPAY API investmentServiceChargeTransactionReference", investmentServiceChargeTransactionReference);
    //                             investment.investment_service_charge_transaction_reference = investmentServiceChargeTransactionReference;
    //                             // Debit the wallet with service CHARGE
    //                             // debugger
    //                             if (totalCharge > 0) {
    //                                 let narration = `service charge of ${currencyCode} ${totalCharge} for ${currencyCode} ${amount_approved} investment grant.`;
    //                                 let debitTransaction = await debitUserWallet(wallet_id, user_id, totalCharge, narration);
    //                                 // console.log("debitTransaction line 209:", debitTransaction);

    //                                 if (debitTransaction.status === "FAILED TO DEBIT WALLET") {
    //                                     let statusCode = Number((debitTransaction.errorCode).split("-")[0]);
    //                                     console.log("statusCode line 215:", statusCode);
    //                                     console.log(`There was an error debiting the user wallet, please try again. ${debitTransaction.message}`)
    //                                     throw new AppException({ message: `There was an error debiting the user wallet, please try again. ${debitTransaction.message}`, codeSt: `${statusCode}` })
    //                                 }
    //                                 if (debitTransaction.transactionId) {
    //                                     investmentServiceChargeTransactionId = debitTransaction.transactionId;
    //                                     investment.investment_service_charge_transaction_id = investmentServiceChargeTransactionId;
    //                                     investment.is_service_charge_deduction_successful = true;
    //                                 }
    //                                 // console.log("The ASTRAPAY API investmentServiceChargeTransactionId", investmentServiceChargeTransactionId);

    //                             } else {
    //                                 investment.investment_service_charge_transaction_id = "NO NEED TO DEBIT ZERO SERVICE CHARGE";
    //                                 investment.is_service_charge_deduction_successful = true;
    //                             }
    //                             // investment.save();
    //                         }
    //                     } catch (error) {
    //                         console.error(error.message);
    //                         throw error;
    //                     }
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 652:", genericWallet);
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 657 :");
    //                     // console.log(investmentWallet);
    //                     const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 660 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         // create a new investment wallet
    //                         let holderName = `${investment.first_name} ${investment.last_name}`
    //                         let holderId = user_id;
    //                         let walletType = 'LOAN';
    //                         // await createNewInvestmentWallet(holderName, holderId, walletType);
    //                         // let newInvestmentWallet = await createNewInvestmentWallet(holderName, holderId, walletType);
    //                         // console.log("newInvestmentWallet line 669:", newInvestmentWallet);
    //                         genericWallet = await getUserWalletsById(user_id);
    //                         // console.log("genericWallet line 670:", genericWallet);
    //                         investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                         // console.log("User investment wallet record line 672 :");
    //                         // console.log(investmentWallet);
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                             throw Error(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, : ", userInvestmentWalletId);
    //                     // console.log("Available Investment walletBalance, : ", availableInvestmentWalletBalance);
    //                     investment.investment_account_number = userInvestmentWalletId;
    //                     // await investment.save();
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     // let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("User Main walletId, : ", userMainWalletId);
    //                     // console.log("Available Main walletBalance, : ", availableMainWalletBalance);
    //                     let investmentDisbursementReference = investment.investment_disbursement_reference;
    //                     if (!investmentDisbursementReference) {   //  Generate investment request reference
    //                         investmentDisbursementReference = investment.id; //DateTime.now() + randomstring.generate(4);
    //                         // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
    //                         console.log("The ASTRAPAY API investmentDisbursementReference", investmentDisbursementReference);
    //                         investment.investment_disbursement_reference = investmentDisbursementReference;
    //                     }
    //                     // check the wallet endpoint with the investmentDisbursementReference
    //                     // if the transaction was successful, end the process

    //                     // if the transaction was not successful, continue with the process below
    //                     let amountToDebitAndCredit = investment.amount_approved;
    //                     // console.log("amountToDebitAndCredit line 689:", amountToDebitAndCredit);
    //                     // TODO
    //                     //  Update investment status to active
    //                     investment.total_charge = Number(totalCharge);
    //                     investment.status = "active";
    //                     investment.is_disbursement_successful = true;
    //                     investment.label = "grant";
    //                     investment.start_date = DateTime.now();
    //                     investment.checked_for_payment_at = DateTime.now();
    //                     investment.date_disbursement_was_done = DateTime.now();
    //                     investment.payout_date = DateTime.now().plus({ days: Number(investment.duration) });
    //                     investment.amount_outstanding = investment.total_amount_to_repay;
    //                     investment.amount_paid = 0;
    //                     investment.total_amount_paid_on_investment = 0;
    //                     investment.amount_outstanding_on_investment = Number(investment.amount_approved);
    //                     investment.total_amount_paid_on_interest = 0;
    //                     investment.amount_outstanding_on_interest = Number(investment.interest_due_on_investment)

    //                     let selectedInvestmentForGrant = await this.getInvestmentsByIdAndWalletIdAndUserId(investment.id, investment.wallet_id, investment.user_id);;
    //                     // console.log("selectedInvestmentForGrant investment line 304 ======================================")
    //                     // console.log(selectedInvestmentForGrant);

    //                     let updateInvestmentOnGrantSuccess = await this.updateInvestment(selectedInvestmentForGrant, investment);
    //                     console.log("Updated investment line 308 ======================================")
    //                     console.log(updateInvestmentOnGrantSuccess);
    //                     // update investmentLog
    //                     // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 312 :", currentInvestmentLog);
    //                     // send for update
    //                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // console.log(" Current log, line 315 :", updatedInvestmentLog);

    //                     // sender to batch payment endpoint
    //                     let description = `Disbursement of ${investment.first_name} ${investment.last_name} ${currencyCode} ${amountToDebitAndCredit} investment.`;
    //                     // console.log("Investment description for transaction,line 319 ");
    //                     // console.log(description);

    //                     // let investmentDisbursement = await disburseInvestment(investmentDisbursementReference, userInvestmentWalletId, userMainWalletId, fundingWalletId, outstandingInvestmentWalletId, amountToDebitAndCredit, description, lng, lat);
    //                     // let investmentDisbursement = await disburseApprovedInvestment(investmentDisbursementReference, userInvestmentWalletId, amountToDebitAndCredit, outstandingInvestmentWalletId, investmentFundingAccount,
    //                         customer_savings_account, description, lng, lat);
    //                     // console.log("Investment Disbursement transaction response, line 325");
    //                     // console.log(investmentDisbursement);

    //                     if (investmentDisbursement.status == "FAILED TO DISBURSE LOAN TO WALLET" && investmentDisbursement.errorMessage !== 'Duplicate batch payment id') {
    //                         let statusCode = Number((investmentDisbursement.errorCode).split("-")[0]);
    //                         console.log("statusCode line 330:", statusCode);
    //                         console.log(`The disbursement of the Investment with ID: ${investment.id} was not successful, please try again, thank you.`)
    //                         throw new AppException({ message: `The disbursement of the Investment with ID: ${investment.id} was not successful,${investmentDisbursement.errorMessage} please try again, thank you.`, codeSt: `${statusCode}` })
    //                     }
    //                     // store investment disbursement transaction id
    //                     if (investmentDisbursement.transxnId) {
    //                         investment.investment_disbursement_transaction_id = investmentDisbursement.transxnId;
    //                         investment.is_disbursement_successful = true;
    //                         investment.label = "grant";
    //                     }
    //                     // update the investment
    //                     // TODO
    //                     // change to service from API
    //                     // const headers = {
    //                     //   "internalToken": ASTRAPAY_BEARER_TOKEN
    //                     // }
    //                     // const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                     // console.log("The API response for investment update request line 347: ", response.data);
    //                     selectedInvestmentForGrant = await this.getInvestmentsByIdAndWalletIdAndUserId(investment.id, investment.wallet_id, investment.user_id);;
    //                     // console.log("selectedInvestmentForGrant investment line 349 ======================================")
    //                     // console.log(selectedInvestmentForGrant);

    //                     updateInvestmentOnGrantSuccess = await this.updateInvestment(selectedInvestmentForGrant, investment);
    //                     console.log("Updated investment line 353 ======================================")
    //                     console.log(updateInvestmentOnGrantSuccess);
    //                     // update investmentLog
    //                     // currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 357 :", currentInvestmentLog);
    //                     // send for update
    //                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // console.log(" Current log, line 360 :", updatedInvestmentLog);

    //                     // if (response && response.data.status === "OK") {
    //                     if (updateInvestmentOnGrantSuccess !== null || updateInvestmentOnGrantSuccess !== undefined) {
    //                         console.log("Investment disbursed successfully, request status is OK");
    //                         // update timeline
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment granted",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, your investment of ${currencyCode} ${investment.amount_approved} has been granted, please check your account,thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `amount to repay: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 387:", timelineObject);
    //                         await timelineService.createTimeline(timelineObject);
    //                         // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 379:", newTimeline);
    //                         // update investment
    //                         // investment.status = "active";
    //                         // investment.start_date = DateTime.now();
    //                         // investment.checked_for_payment_at = DateTime.now();
    //                         // investment.date_disbursement_was_done = DateTime.now();
    //                         // investment.payout_date = DateTime.now().plus({ days: Number(investment.duration) });
    //                         // investment.amount_outstanding = investment.total_amount_to_repay;
    //                         // investment.amount_paid = 0;
    //                         // investment.total_amount_paid_on_investment = 0;
    //                         // investment.amount_outstanding_on_investment = Number(investment.amount_approved);
    //                         // investment.total_amount_paid_on_interest = 0;
    //                         // investment.amount_outstanding_on_interest = Number(investment.interest_due_on_investment)

    //                         let userId = investment.user_id;
    //                         // let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(userId);

    //                         // console.log("investmentability Status line 396:", investmentabilityStatus);
    //                         //@ts-ignore
    //                         investment.is_bvn_verified = investmentabilityStatus!.isBvnVerified;

    //                         // investment.okra_customer_id = investmentabilityStatus!.okraRecordId;

    //                         // investmentabilityStatus!.status = investment.status;

    //                         // @ts-ignore
    //                         let { recommendation, amountInvestmentable, totalNumberOfInvestmentsCollected, totalAmountOfInvestmentsCollected, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                         let newRecommendation = recommendation - amountToDebitAndCredit;
    //                         let newAmountInvestmentable = amountInvestmentable - amountToDebitAndCredit;
    //                         let newTotalNumberOfInvestmentsCollected = totalNumberOfInvestmentsCollected + 1;
    //                         let newTotalAmountOfInvestmentsCollected = totalAmountOfInvestmentsCollected + amountToDebitAndCredit;
    //                         let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid + amountToDebitAndCredit;
    //                         // investmentabilityStatus!.recommendation = newRecommendation;
    //                         // investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                         // investmentabilityStatus!.totalNumberOfInvestmentsCollected = newTotalNumberOfInvestmentsCollected;
    //                         // investmentabilityStatus!.totalAmountOfInvestmentsCollected = newTotalAmountOfInvestmentsCollected;
    //                         // investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                         // Save
    //                         // investmentabilityStatus!.save()

    //                         // update investment
    //                         let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(investment.id, wallet_id, userId);
    //                         // console.log(" Current log, line 421 :", currentInvestment);
    //                         // send for update
    //                         await this.updateInvestment(currentInvestment, investment);
    //                         // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                         // console.log(" Current log, line 424 :", updatedInvestment);
    //                         // update investmentLog
    //                         // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, userId);
    //                         // console.log(" Current log, line 427 :", currentInvestmentLog);
    //                         // send for update
    //                         // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                         // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                         // console.log(" Current log, line 430 :", updatedInvestmentLog);
    //                         // Create Payout schedule for the investment
    //                         // check if payout schedule does not exist, before creating new one
    //                         let { payout_date, amount_approved, start_date } = investment;
    //                         start_date = start_date.toISODate();
    //                         // console.log(" Payout Date , line 435", payout_date);
    //                         payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                         // console.log(" Payout Date in ISO format, line 437", payout_date);

    //                         let hasExistingPayoutSchedule //= await payoutSchedulesService.getPayoutScheduleByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndAmount(userId, wallet_id, id, payout_date, amount_approved);
    //                         if (!hasExistingPayoutSchedule) {
    //                             let payoutSchedulePayload = {
    //                                 walletId: wallet_id,
    //                                 userId: userId,
    //                                 investmentId: investment.id,
    //                                 amount: investment.amount_approved,
    //                                 interest: investment.interest_due_on_investment,
    //                                 totalAmountDue: investment.total_amount_to_repay,
    //                                 payoutDueDate: investment.payout_date,
    //                                 paid: false,
    //                                 transactionId: investment.investment_disbursement_transaction_id,
    //                                 transactionReference: investmentDisbursementReference,
    //                                 type: "automated",
    //                                 subType: "sagamy",
    //                                 payoutModel: "full",
    //                             }
    //                             // await payoutSchedulesService.createPayoutSchedule(payoutSchedulePayload);
    //                             // let newPayoutSchedule = await payoutSchedulesService.createPayoutSchedule(payoutSchedulePayload);
    //                             // console.log("newPayoutSchedule line 457:");
    //                             // console.log(newPayoutSchedule);
    //                         }
    //                         // console.log("hasExistingPayoutSchedule line 460:");
    //                         // console.log(hasExistingPayoutSchedule);
    //                         // Send Details to notification service
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Granted";
    //                         let message = `
    //             ${investment.first_name} ${investment.last_name} this is to inform you, that your investment of ${currencyCode} ${amountToDebitAndCredit}, has been granted.
    //             Please check your account.
    //             Thank you.
    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         // console.log("newNotificationMessage line 471:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             console.log(newNotificationMessage);
    //                         }
    //                         // return response.data;
    //                         // Commented on 21-09-2022 for test of double investmentability record update bug
    //                         // return updateInvestmentOnGrantSuccess;
    //                     } else {
    //                         console.log("Investment disbursement status is NOT OK. @ Investmentservice  Line 482");
    //                         console.log(`The disbursement of the Investment with ID: ${investment.id} was not successful, please try again, thank you.`)
    //                         throw new AppException({ message: `The update of the Investment with ID: ${investment.id} was not successful,please try again, thank you.`, codeSt: "500" })
    //                     }
    //                 } catch (error) {
    //                     console.log("Error line 487", error.messages);
    //                     console.log("Error line 488", error.message);
    //                     await trx.rollback()
    //                     console.log(`status: "FAILED",message: ${error.messages} ,hint: ${error.message}`)
    //                     throw error;
    //                 }
    //             } else {
    //                 console.log("No Investment is pending disbursement, line 494");
    //                 await trx.commit();
    //                 return {
    //                     status: "OK",
    //                     message: "No Investment is pending disbursement.",
    //                 };

    //             }
    //         }

    //         for (let index = 0; index < responseData.length; index++) {
    //             try {
    //                 const ainvestment = responseData[index];
    //                 await processInvestment(ainvestment);
    //                 investmentArray.push(ainvestment);
    //             } catch (error) {
    //                 console.log("Error line 510:", error);
    //                 throw error;
    //             }
    //         }
    //         // commit transaction and changes to database
    //         await trx.commit();
    //         // console.log("Response data in investment service, line 516:", investmentArray);
    //         return investmentArray;
    //     } catch (error) {
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentForPayoutByInvestmentId(id: string, accountType: string, accountNumber: string, amount?: number, loginAdminFullName?: string): Promise<Investment | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Amount to repay, line 501 ==================")
    //         console.log(amount)
    //         console.log("Login Admin Fullname, line 503 ==================")
    //         console.log(loginAdminFullName)
    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         // const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         // const payoutSchedulesService = new PayoutSchedulesServices();
    //         // const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 578:", settings);
    //         if (!settings) {
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         let { currencyCode, } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx)
    //             // .timeout(60000, { cancel: false }) // 👈
    //             .where('status', "active")
    //             .where('id', id)
    //         // .forUpdate()

    //         const ainvestment = responseData[0];
    //         // console.log(" A Investment ================================================== ")
    //         // console.log(ainvestment)
    //         if (!ainvestment) {
    //             console.log(`The investment with Id: ${id} is not active or payout has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `The investment with Id: ${id} is not active or payout has been completed. Please, check and try again.`, codeSt: "422" })
    //         }
    //         // debugger
    //         const processInvestment = async (investment) => {
    //             // console.log(" The current investment startDate, line 839:", investment.startDate)
    //             let { created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, interest_due_on_investment, lng, lat, total_amount_to_repay, amount_outstanding } = investment;
    //             let current_total_amount_to_repay = amount !== undefined ? Number(amount) : Number(total_amount_to_repay);

    //             let amount_to_be_deducted = amount_approved;
    //             let interest_to_be_deducted = interest_due_on_investment;
    //             // Check if the user input a specific amount to repay; i.e instalmental payment.
    //             if (amount != undefined && amount > 0) {
    //                 amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amount);
    //                 interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amount);
    //                 if (interest_to_be_deducted > investment.amount_outstanding_on_interest) {
    //                     amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - investment.amount_outstanding_on_interest);
    //                     interest_to_be_deducted = investment.amount_outstanding_on_interest;
    //                 }
    //                 if (amount_to_be_deducted > investment.amount_outstanding_on_investment) {
    //                     amount_to_be_deducted = investment.amount_outstanding_on_investment
    //                 }
    //             }
    //             // debugger
    //             // console.log("start_date at for the current investment line 510", start_date);
    //             investment.checked_for_payment_at = DateTime.now();
    //             // investment.created_at = DateTime.now();
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             // console.log("created_at at for the current investment line 595", investment.created_at);
    //             investment.start_date = DateTime.fromJSDate(start_date);
    //             // console.log("start_date at for the current investment line 597", investment.start_date);
    //             investment.payout_date = DateTime.fromJSDate(payout_date);
    //             // console.log("payout_date at for the current investment line 599", investment.payout_date);

    //             duration = Number(investment.duration);

    //             let payoutDetails = await getPayoutDetails();
    //             // TODO
    //             // Remove and change to payout schedule data
    //             let startDate = investment.start_date;// DateTime.now().minus({ days: 5 }).toISO();
    //             // duration = 4;
    //             // duration = Number(duration);
    //             // console.log("Time investment was started line 609: ", startDate);

    //             let timelineObject;
    //             // let timeline;

    //             let isDueForPayout = await dueForPayout(startDate, duration);
    //             console.log("Is due for payout status line 615:", isDueForPayout);
    //             console.log("investment status line 616:", investment.status);
    //             console.log("investment amount_outstanding  line 617:", investment.amount_outstanding);
    //             console.log("investment amount_outstanding  line 618:", amount_outstanding);
    //             // console.log("investment details line 619 =============================:", investment);
    //             // if (investment.status === 'active' && investment.is_payout_successful.toString() == "0") {

    //             const investmentType = await getInvestmentType();
    //             let { outstandingInvestmentWalletId, investmentPayoutAccount, interestOnInvestmentAccount, interestOnInvestmentWalletId, investmentRecoveryWalletId, } = investmentType; //fixedCharge,ratedCharge,investmentFundingAccount,


    //             let newTimeline;
    //             if (investment.status === 'active' && investment.amount_outstanding > 0) {
    //                 //  START
    //                 console.log("Repay Now Process Starting: line 621 ===================================");
    //                 let payload = investment
    //                 let { id, total_amount_to_repay } = investment; //customer_savings_account
    //                 // update timeline
    //                 // let newTimeline = await createNewTimeline();
    //                 // get user investment wallet, or create a new investment wallet for a first time user
    //                 let userInvestmentWalletId = await getInvestmentWalletId();
    //                 let investmentPayoutReference = DateTime.now() + randomstring.generate(4);
    //                 let description = `Payout of ${currencyCode} ${current_total_amount_to_repay} out of, ${investment.first_name} ${currencyCode} ${amount_outstanding} investment, has been done successfully.
    //          Thank you.

    //          AstraPay Investment.`;

    //                 // Get the User Savings Account Balance
    //                 if (accountType == "sagamy") {
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(accountNumber); // SAGAMY accountNumber
    //                     // console.log(" Customer Account Balance =================================================")
    //                     // console.log(savingsAccountBalance);
    //                     if (savingsAccountBalance.status == 'FAILED TO FETCH CUSTOMER SAVINGS ACCOUNT BALANCE') {
    //                         // message: 'Request failed with status code 500',
    //                         // errorCode: '500-004',
    //                         // errorMessage: 'Account #ACC-0000000094 is not a deposit account'
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, the payout of ${currencyCode} ${current_total_amount_to_repay} out of your investment of ${currencyCode} ${investment.amount_outstanding} has failed. ${savingsAccountBalance.errorMessage}.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${current_total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 672:", timelineObject);
    //                         newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 674:", newTimeline);
    //                         throw new AppException({ message: `${savingsAccountBalance.errorMessage}`, codeSt: `${422}` })
    //                     }
    //                     // debugger;
    //                     let amountDeductable = Number(savingsAccountBalance) - Number(MINIMUM_BALANCE);
    //                     let amountToBeDeducted = amount !== undefined ? amount : Number(amount_approved) + Number(interest_due_on_investment);
    //                     console.log(" amountDeductable, line 619 =================================================")
    //                     console.log("amountDeductable: ", amountDeductable);
    //                     console.log(" amountToBeDeducted, line 621 =================================================")
    //                     console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     if (amountToBeDeducted > amountDeductable) {
    //                         console.log(" Customer Account Balance,line 624  =================================================")
    //                         console.log(savingsAccountBalance);
    //                         console.log(" amountDeductable, line 626 =================================================")
    //                         console.log("amountDeductable: ", amountDeductable);
    //                         console.log(" amountToBeDeducted, line 628 =================================================")
    //                         console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                         console.log(`The user with UserId: ${user_id}, has a balance of ${currencyCode} ${savingsAccountBalance} which is insufficient to process investment payout. Please fund your savings account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`)
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, the payout of ${currencyCode} ${current_total_amount_to_repay} out of your investment of ${currencyCode} ${investment.amount_outstanding} has failed. Please fund your savings account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} and try again,thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${current_total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 672:", timelineObject);
    //                         newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 674:", newTimeline);

    //                         // Send Notification to Customer
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Payout Failed";
    //                         let message = `
    //             ${investment.first_name} this is to inform you, that the payout of ${currencyCode} ${current_total_amount_to_repay} failed, because your Savings Account with Number ${accountNumber} , with current balance of ${currencyCode} ${savingsAccountBalance}, has insufficient amount to process investment payout. Please fund your Savings Account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 688:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                             // debugger
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             // debugger
    //                             console.log(newNotificationMessage);
    //                         }
    //                         throw new AppException({ message: `The user with UserId: ${user_id}, has a balance of ${currencyCode} ${savingsAccountBalance} which is insufficient to process investment payout. Please fund your savings account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`, codeSt: "500" })
    //                     }
    //                 } else if (accountType == "astrapay") {
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 647: =================================================");
    //                     // console.log(genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 649: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     // Search by account Number
    //                     const mainWallet = genericWallet.find(o => o.walletId === accountNumber);
    //                     // console.log("User wallet record line 714 =========================================:");
    //                     // console.log(mainWallet);
    //                     if (!mainWallet) {
    //                         if (!mainWallet) {
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment payout failed",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, the payout of ${currencyCode} ${current_total_amount_to_repay} out of your investment of ${currencyCode} ${investment.amount_outstanding} has failed. The Wallet with ID: ${accountNumber} does not exist, please check and try again.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${current_total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 751:", timelineObject);
    //                             newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 753:", newTimeline);
    //                             console.log(`The Wallet with ID: ${accountNumber} does not exist, please try again.`)
    //                             throw new AppException({ message: `The Wallet with ID: ${accountNumber} does not exist, please try again.`, codeSt: "422" })
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("user Main Wallet Current Balance, line 757 ==================:");
    //                     // console.log(availableMainWalletBalance);
    //                     let amountDeductable = Number(availableMainWalletBalance) - Number(MINIMUM_BALANCE);
    //                     let amountToBeDeducted = amount !== undefined ? amount : Number(amount_approved) + Number(interest_due_on_investment);
    //                     // console.log(" amountDeductable, line 761 =================================================")
    //                     // console.log("amountDeductable: ", amountDeductable);
    //                     // console.log(" amountToBeDeducted, line 763 =================================================")
    //                     // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     if (amountToBeDeducted > amountDeductable) {
    //                         console.log(" Customer Account Balance,line 766  =================================================")
    //                         console.log(availableMainWalletBalance);
    //                         console.log(" amountDeductable, line 768 =================================================")
    //                         console.log("amountDeductable: ", amountDeductable);
    //                         console.log(" amountToBeDeducted, line 770 =================================================")
    //                         console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                         console.log(`The user with UserId: ${user_id}, wallet has a balance of ${currencyCode} ${availableMainWalletBalance} which is insufficient to process investment payout. Please fund your wallet with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`)
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, the payout of ${currencyCode} ${current_total_amount_to_repay} out of your investment of ${currencyCode} ${investment.amount_outstanding} has failed. Please fund your Wallet with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} and try again,thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${current_total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 785:", timelineObject);
    //                         newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 787:", newTimeline);

    //                         // Send Notification to Customer
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Payout Failed";
    //                         let message = `
    //             ${investment.first_name} this is to inform you, that the payout of ${currencyCode} ${amount_outstanding} failed, because your Wallet with Number ${accountNumber} , with current balance of ${currencyCode} ${availableMainWalletBalance}, has insufficient amount to process investment payout. Please fund your Wallet with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 801:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                             // debugger
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             // debugger
    //                             console.log(newNotificationMessage);
    //                         }
    //                         throw new AppException({ message: `The user with UserId: ${user_id}, has a balance of ${currencyCode} ${availableMainWalletBalance} which is insufficient to process investment payout. Please fund your wallet with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`, codeSt: "500" })
    //                     }
    //                 }

    //                 // debugger;
    //                 //  Send details to the endpoint for investment payout transactions
    //                 let investmentPayout = await investmentPayoutProcess(investmentPayoutReference, userInvestmentWalletId, outstandingInvestmentWalletId, investmentPayoutAccount, interestOnInvestmentAccount, accountNumber, description, id, amount_to_be_deducted, interest_to_be_deducted);

    //                 // update the investment
    //                 await updateInvestmentViaAPI(payload);
    //                 // console.log("Investment payout and update was successful, request status is OK. Line 820");
    //                 // update investmentability status
    //                 await updateInvestmentabilityStatus();
    //                 // update investment information
    //                 updateInvestmentStatus(investmentPayout, investmentPayoutReference);
    //                 // Save
    //                 let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                 // console.log(" Current log, line 827 :", currentInvestment);
    //                 // send for update
    //                 await this.updateInvestment(currentInvestment, investment);
    //                 // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                 // console.log(" Current log, line 830 :", updatedInvestment);
    //                 // update investmentLog
    //                 // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                 // console.log(" Current log, line 833 :", currentInvestmentLog);
    //                 // send for update
    //                 // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                 // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                 // console.log(" Current log, line 836 :", updatedInvestmentLog);

    //                 // TODO
    //                 // Update Payout schedule record for this investment
    //                 if (investment.amount_paid >= investment.total_amount_to_repay && investment.amount_outstanding == 0) {
    //                     payoutDetails.paid = true;
    //                 }
    //                 let payoutUpdatePayload = payoutDetails;
    //                 let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                 // console.log(" Updated payout schedule,line 845 ", updatedPayoutDetails);
    //                 // Create a new record in Repaid investment table
    //                 let { payout_date } = investment;
    //                 // console.log(" Payout Date , line 848", payout_date);
    //                 payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                 // console.log(" Payout Date in ISO format, line 850", payout_date);
    //                 await updatePaymentRecord(id, payout_date, investmentPayout, total_amount_to_repay, updatedPayoutDetails);
    //                 // Commit update to database
    //                 await trx.commit();
    //                 // update timeline
    //                 newTimeline = await newTimelineObject(newTimeline);
    //                 // Send Details to notification service
    //                 await sendNotificationMessage();
    //                 return investment;
    //             } else if (investment.status !== 'active' && investment.is_payout_successful.toString() == "1") {
    //                 console.log(" Investment is not active nor due for payout, or payment has been completed.")
    //                 await trx.commit();
    //                 return investment;
    //             } else {
    //                 await trx.commit();
    //                 return investment;
    //             }

    //             async function sendNotificationMessage() {
    //                 let { email, first_name } = investment;
    //                 let subject = "AstraPay Investment Payout";
    //                 let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${current_total_amount_to_repay} out of your investment of ${currencyCode} ${investment.total_amount_to_repay} plus interest, has been repaid.

    //             Amount outstanding is ${currencyCode} ${investment.amount_outstanding}. 

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                 console.log("newNotificationMessage line 881:", newNotificationMessage);
    //                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                     console.log("Notification sent successfully");
    //                     // debugger
    //                 } else if (newNotificationMessage.message !== "Success") {
    //                     console.log("Notification NOT sent successfully");
    //                     // debugger
    //                     console.log(newNotificationMessage);
    //                 }
    //             }
    //             async function investmentPayoutProcess(investmentPayoutReference: any, userInvestmentWalletId: any, outstandingInvestmentWalletId: string, investmentPayoutAccount: string, interestOnInvestmentAccount: string, accountNumber: any, description: string, id: any, amount_to_be_deducted: number, interest_to_be_deducted: number) {
    //                 // This is done after we have checked the user account Balance
    //                 // Subtracted MINIMUM BALANCE,then we Debit the Investmented amount from the remaining amount
    //                 // DEBIT SAGAMY ACCOUNT
    //                 let investmentPayout;
    //                 if (accountType == "sagamy") {
    //                     // investmentPayout = await repayDueInvestment(investmentPayoutReference, userInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, outstandingInvestmentWalletId, investmentPayoutAccount,
    //                         // interestOnInvestmentAccount, accountNumber, description, lng, lat);
    //                     // console.log("Investment Payout transaction response");
    //                     // console.log(investmentPayout);
    //                     if (investmentPayout.status == "FAILED TO REPAY LOAN" && investmentPayout.errorMessage !== 'Duplicate batch payment id') {
    //                         if (investmentPayout.errorCode == "500-004") {
    //                             // Send Notification & update timeline for failed investment payout from Savings Account
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment payout from savings failed",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, payout of ${currencyCode} ${amount} from your savings account has failed. Please fund your savings account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. ${investmentPayout.errorMessage} . Thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                             };
    //                             // console.log("Timeline object line 915:", timelineObject);
    //                             newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 917:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment payout from SAGAMY Account was unsuccessful, line 920 ================================== ");
    //                             console.log(investmentPayout.errorMessage)

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Payout Failed";
    //                             let message = `
    //            ${investment.first_name}, the payout of ${currencyCode} ${amount} from your Savings Account has failed. ${investmentPayout.errorMessage}.
    //            Please fund your Savings Account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 935:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }
    //                             console.log(`Line 942: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                             throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                         } else if (investmentPayout.errorCode !== "500-004") {
    //                             // Send Notification & update timeline for failed investment payout from Savings Account
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment payout from savings failed",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, payout of ${currencyCode} ${amount} from your savings account has failed. Please fund your savings account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. ${investmentPayout.errorMessage} . Thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                             };
    //                             // console.log("Timeline object line 959:", timelineObject);
    //                             newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 961:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment payout from SAGAMY Account was unsuccessful, line 964 ================================== ");
    //                             console.log(investmentPayout.errorMessage)

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Payout Failed";
    //                             let message = `
    //            ${investment.first_name}, the payout of ${currencyCode} ${amount} from your Savings Account has failed. ${investmentPayout.errorMessage}.
    //            Please fund your Savings Account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 980:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }
    //                             console.log(`Line 987: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                             throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                         }
    //                     } else if (investmentPayout.status == "FAILED TO REPAY LOAN" && investmentPayout.errorMessage == 'Duplicate batch payment id') {
    //                         console.log(`Line 860: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                         throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                     }
    //                 } else if (accountType == "astrapay") {
    //                     // DEBIT ASTRAPAY WALLET
    //                     // investmentPayout = await recoverInvestmentFromUserMainWallet(investmentPayoutReference, userInvestmentWalletId, accountNumber, outstandingInvestmentWalletId, investmentRecoveryWalletId,
    //                         // interestOnInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, description, lng, lat);
    //                     // outstandingInvestmentWalletId
    //                     // console.log("Investment Payout from Main Wallet transaction response");
    //                     // console.log(investmentPayout);
    //                     if (investmentPayout.status === "FAILED TO DEBIT WALLET" && investmentPayout.errorMessage !== 'Duplicate batch payment id') {
    //                         let statusCode = Number((investmentPayout.errorCode).split("-")[0]);
    //                         console.log("statusCode line 1003:", statusCode);
    //                         let statusCodeExtension = Number((investmentPayout.errorCode).split("-")[1]);
    //                         console.log("statusCodeExtension line 1005:", statusCodeExtension);
    //                         console.log(" Investment payout exceptional error message, line 1006 ==================================")
    //                         console.log(investmentPayout.errorMessage);
    //                         // Send Notification & update timeline for failed investment payout from Main Wallet
    //                         // update timeline
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout from wallet failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, payout of ${currencyCode} ${amount} from your wallet has failed. Please fund your wallet with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. ${investmentPayout.errorMessage} . Thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                         };
    //                         // console.log("Timeline object line 1021:", timelineObject);
    //                         newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 1023:", newTimeline);

    //                         // create and send a new timeline
    //                         console.log("Investment payout from ASTRAPAY Wallet was unsuccessful, line 1026 ================================== ");

    //                         // Send Details to notification service
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Payout Failed";
    //                         let message = `
    //            ${investment.first_name}, the payout of ${currencyCode} ${amount} from your Wallet has failed.  ${investmentPayout.errorMessage}. 
    //            Please fund your Wallet with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 1041:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             console.log(newNotificationMessage);
    //                         }
    //                         throw new AppException({ message: `The payout of the Investment with ID: ${id} from user's wallet was not successful. There was an error debiting the user wallet, please try again. ${investmentPayout.message}. Thank you.`, codeSt: `${statusCode}` })
    //                     } else if (investmentPayout.status == "FAILED TO DEBIT WALLET" && investmentPayout.errorMessage == 'Duplicate batch payment id') {
    //                         console.log(`Line 860: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                         throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                     }
    //                 }

    //                 // store investment disbursement transaction id
    //                 if (investmentPayout.data.transxnId) {
    //                     investment.investment_payout_transaction_id = investmentPayout.data.transxnId;
    //                     investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);//current_total_amount_to_repay; //Number(amount_approved + interest_due_on_investment);
    //                     investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);//investment.amount_paid;
    //                     investment.total_amount_paid_on_investment = Number(investment.total_amount_paid_on_investment + amount_to_be_deducted);
    //                     investment.amount_outstanding_on_investment = Number(investment.amount_outstanding_on_investment - amount_to_be_deducted);
    //                     investment.total_amount_paid_on_interest = Number(investment.total_amount_paid_on_interest + interest_to_be_deducted);
    //                     investment.amount_outstanding_on_interest = Number(investment.amount_outstanding_on_interest - interest_to_be_deducted);
    //                     investment.label = "payout";
    //                 }
    //                 return investmentPayout;
    //             }

    //             async function updatePaymentRecord(id: any, payout_date: any, investmentPayout: any, total_amount_to_repay: number, updatedPayoutDetails: any) {
    //                 let hasExistingRepaidInvestment;// = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payout_date, amount_approved);
    //                 console.log(id);
    //                 console.log(total_amount_to_repay);
    //                 console.log(payout_date
    //                 );
    //                 let amountDue = investment.total_amount_to_repay;
    //                 let amountPaid = Number(amount_to_be_deducted + interest_to_be_deducted);//current_total_amount_to_repay; //total_amount_to_repay;
    //                 let amountOutstanding = investment.amount_outstanding;//investment.total_amount_to_repay - amountPaid;
    //                 let payoutStatus = true; // because of multiple payout on a investment
    //                 let payoutMethod = "part";
    //                 if (current_total_amount_to_repay == investment.total_amount_to_repay) {
    //                     // payoutStatus = true;
    //                     payoutMethod = "full"
    //                 }
    //                 if (!hasExistingRepaidInvestment) {
    //                     let repaidInvestmentPayload = {
    //                         walletId: wallet_id,
    //                         userId: user_id,
    //                         investmentId: investment.id,
    //                         amount: investment.amount_approved,
    //                         interest: investment.interest_due_on_investment,
    //                         payoutDueDate: investment.payout_date,
    //                         paid: payoutStatus,//true,
    //                         transactionId: investmentPayout.data.transxnId,
    //                         transactionReference: investment.investment_payout_reference,
    //                         payoutScheduleId: updatedPayoutDetails!.id,
    //                         amountDue: amountDue,
    //                         amountPaid: amountPaid,
    //                         amountOutstanding: amountOutstanding,
    //                         label: "payout",
    //                         type: "manual",
    //                         subType: accountType, //"sagamy",  or "astrapay"
    //                         payoutModel: payoutMethod,//"full",
    //                     };
    //                     // await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                     // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                     // console.log("newRepaidInvestment line 762:");
    //                     // console.log(newRepaidInvestment);
    //                 }
    //             }

    //             function updateInvestmentStatus(investmentPayout: any, investmentPayoutReference: any) {
    //                 // investment.is_payout_successful = true;
    //                 // investment.request_type = "repay_investment";
    //                 // investment.date_payout_was_done = DateTime.now();
    //                 // TODO
    //                 // save transaction Id
    //                 if (investmentPayout.data.transxnId) {
    //                     investment.investment_payout_transaction_id = investmentPayout.data.transxnId;
    //                     if (investment.amount_paid >= investment.total_amount_to_repay && investment.amount_outstanding <= 0) {
    //                         investment.is_payout_successful = true;
    //                     }
    //                     investment.request_type = "repay_investment";
    //                     investment.date_payout_was_done = DateTime.now();
    //                     investment.processed_by = loginAdminFullName;
    //                 }
    //                 //  save investmentPayoutReference
    //                 investment.investment_payout_reference = investmentPayoutReference;
    //                 // on success, update investment status to completed
    //                 if (investment.amount_outstanding <= 0 && investment.amount_paid >= investment.total_amount_to_repay) {
    //                     investment.status = "completed";
    //                 }

    //             }

    //             async function updateInvestmentabilityStatus() {
    //                 // let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                 // console.log("investmentability Status line 679:", investmentabilityStatus);
    //                 // debugger
    //                 // @ts-ignore
    //                 let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                 let newRecommendation = recommendation + amount_to_be_deducted;
    //                 let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted;
    //                 let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                 if (investment.amount_paid >= investment.total_amount_to_repay) {
    //                     newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                 }
    //                 let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted;
    //                 let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted;
    //                 // investmentabilityStatus!.recommendation = newRecommendation;
    //                 // investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                 // investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                 // investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                 // investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                 // investmentabilityStatus!.lastInvestmentPerformanceRating = "100";
    //                 // investmentabilityStatus!.lastInvestmentDuration = duration;
    //                 let currentDate = new Date().toISOString()
    //                 let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                 console.log("currentInvestmentDuration line 744 ======================");
    //                 console.log(currentInvestmentDuration);
    //                 // investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;

    //                 // investmentabilityStatus!.lat = investment.lat;
    //                 // investmentabilityStatus!.lng = investment.lng;
    //                 // investmentabilityStatus!.isFirstInvestment = false;;
    //                 // Save
    //                 // investmentabilityStatus!.save();
    //             }

    //             async function getPayoutDetails() {
    //                 let payoutDetails //= await payoutSchedulesService.getPayoutScheduleByUserIdAndInvestmentIdAndWalletId(user_id, investment.id, wallet_id);
    //                 console.log(" Payout details +++===========================+++++");
    //                 console.log(payoutDetails);
    //                 if (!payoutDetails) {
    //                     throw new AppException({ message: "This investment does not have a payout schedule, please check your parameters and try again. Thank you.", codeSt: "500" });
    //                 }
    //                 return payoutDetails;
    //             }

    //             async function newTimelineObject(newTimeline: Timeline) {
    //                 timelineObject = {
    //                     id: uuid(),
    //                     action: "investment payout",
    //                     investmentId: investment.id,
    //                     walletId: investment.wallet_id,
    //                     userId: investment.user_id,
    //                     // @ts-ignore
    //                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your investment of ${currencyCode} ${investment.total_amount_to_repay} has been repaid, your outstanding investment amount is ${currencyCode} ${investment.amount_outstanding}. Please check your account,thank you.`,
    //                     createdAt: DateTime.now(),
    //                     metadata: `total amount deducted plus interest: ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)}`,
    //                 };
    //                 // console.log("Timeline object line 1189:", timelineObject);
    //                 newTimeline = await timelineService.createTimeline(timelineObject);
    //                 // console.log("new Timeline object line 1191:", newTimeline);
    //                 return newTimeline;
    //             }

    //             async function updateInvestmentViaAPI(payload: any) {
    //                 // TODO
    //                 // change to service from API
    //                 const headers = {
    //                     "internalToken": ASTRAPAY_BEARER_TOKEN
    //                 }
    //                 const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                 // amount: payloadAmount,
    //                 // FAILED TO REPAY LOAN
    //                 // console.log("The API response for investment update request line 1204: ", response);
    //                 // debugger
    //                 if (response && response.data.status === "FAILED") {
    //                     console.log("Investment payout update was unsuccessful, request status is FAILED");
    //                     // update timeline
    //                     timelineObject = {
    //                         id: uuid(),
    //                         action: "investment payout update failed",
    //                         investmentId: investment.id,
    //                         walletId: investment.wallet_id,
    //                         userId: investment.user_id,
    //                         // @ts-ignore
    //                         message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your investment of ${currencyCode} ${investment.total_amount_to_repay} has been repaid successfully,but we are unable to update the details now. please check your account,thank you.`,
    //                         createdAt: DateTime.now(),
    //                         metadata: `total amount deducted plus interest: ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)}`,
    //                     };
    //                     // console.log("Timeline object line 1220:", timelineObject);
    //                     await timelineService.createTimeline(timelineObject);
    //                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                     // console.log("new Timeline object line 1222:", newTimeline);
    //                     await trx.commit();
    //                     console.log(" Payout done, but update was unsuccessful. Line 1224 ==============================");
    //                     throw new AppException({ message: `Payout done, but update was unsuccessful`, codeSt: `500` });
    //                 }
    //             }


    //             async function getInvestmentWalletId() {
    //                 let genericWallet = await getUserWalletsById(user_id);
    //                 // debugger;
    //                 console.log("genericWallet line 1233: ===============================");
    //                 console.log(genericWallet);
    //                 if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                     // console.log(`Line 1236: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                     // throw new Error(`Failed to fetch wallet for user with ID: ${user_id} ,please try again.`)
    //                     throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                 }
    //                 let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                 // console.log("User record line 1241 :");
    //                 // console.log(investmentWallet);
    //                 // const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                 // console.log("User record line 1244 :");
    //                 // console.log(mainWallet);
    //                 if (!investmentWallet) {
    //                     if (!investmentWallet) {
    //                         console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`);
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" });
    //                     }
    //                 }
    //                 // @ts-ignore
    //                 let userInvestmentWalletId = investmentWallet!.walletId;
    //                 // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                 // console.log("User Investment walletId, line 1255: ", userInvestmentWalletId);
    //                 // console.log("user Investment Wallet Current Balance, line 1256:", availableInvestmentWalletBalance);
    //                 return userInvestmentWalletId;
    //             }

    //             async function getInvestmentType() {
    //                 // let typeName = investment.investment_type_name;
    //                 // const investmentType = await typesService.getTypeByTypeName(typeName);
    //                 // console.log(" investmentType ==============================");
    //                 // console.log(investmentType);
    //                 // if (!investmentType) {
    //                 //   // console.log(`Investment Type Named: ${typeName} does not exist.`);
    //                 //   throw new AppException({ message: `Investment Type Named: ${typeName} does not exist`, codeSt: "500" });
    //                 // }
    //                 let typeId = investment.investment_type_id;
    //                 const investmentType = await typesService.getTypeByTypeId(typeId);
    //                 console.log(" investmentType ==============================");
    //                 console.log(investmentType);
    //                 if (!investmentType) {
    //                     // console.log(`Investment Type Id: ${typeId} does not exist.`);
    //                     throw new AppException({ message: `Investment Type Id: ${typeId} does not exist`, codeSt: "500" });
    //                 }
    //                 return investmentType;
    //             }

    //             // async function createNewTimeline() {
    //             //   timelineObject = {
    //             //     id: uuid(),
    //             //     action: "investment payout",
    //             //     investmentId: investment.id,
    //             //     walletId: investment.wallet_id,
    //             //     userId: investment.user_id,
    //             //     // @ts-ignore
    //             //     message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_approved} and interest of ${currencyCode} ${investment.interest_due_on_investment} is being process for payout.`,
    //             //     createdAt: DateTime.now(),
    //             //     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //             //   };
    //             //   // console.log("Timeline object line 1292:", timelineObject);
    //             //   let newTimeline = await timelineService.createTimeline(timelineObject);
    //             //   // console.log("new Timeline object line 1294:", newTimeline);
    //             //   return newTimeline;
    //             // }
    //         }

    //         await processInvestment(ainvestment)
    //         // commit changes to database
    //         await trx.commit()
    //         return ainvestment;
    //     } catch (error) {
    //         console.log(" Line 1304: errrrrrrrrrooooooooooooooooooooooooooooooo 222222222222222222222222222222222222222222222222222")
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentsForPayout(queryParams: any): Promise<Investment[] | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Query params in investment service line 1314:", queryParams)
    //         let { limit, offset = 0, updatedAtFrom, updatedAtTo, } = queryParams;
    //         if (!updatedAtFrom) {
    //             // default to last 3 months
    //             queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //             updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //         }
    //         // debugger;
    //         if (!updatedAtTo) {
    //             queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
    //             updatedAtTo = DateTime.now().toISO();//.toISODate();
    //         }
    //         offset = Number(offset);
    //         limit = Number(limit);
    //         // const queryGetter = await this.queryBuilder(queryParams)

    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         // const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         // const payoutSchedulesService = new PayoutSchedulesServices();
    //         // const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 578:", settings);
    //         if (!settings) {
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         let { currencyCode, } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('status', "active")
    //             .where('updated_at', '>=', updatedAtFrom)
    //             .where('updated_at', '<=', updatedAtTo)
    //             .offset(offset)
    //             .limit(limit)
    //         // .forUpdate()

    //         // console.log(responseData)
    //         if (!responseData) {
    //             console.log(`There is no active investment or payout has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `There is no active investment or payout has been completed. Please, check and try again.`, codeSt: "500" })
    //         }
    //         let investmentArray: any[] = [];
    //         // responseData.forEach(
    //         const processInvestment =
    //             async (investment) => {
    //                 // console.log(" The current investment startDate, line 839:", investment.startDate)
    //                 let { created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, interest_due_on_investment, lng, lat } = investment;
    //                 // console.log("start_date at for the current investment line 510", start_date);
    //                 investment.checked_for_payment_at = DateTime.now();
    //                 // investment.created_at = DateTime.now();
    //                 investment.created_at = DateTime.fromJSDate(created_at);
    //                 // console.log("created_at at for the current investment line 513", investment.created_at);
    //                 investment.start_date = DateTime.fromJSDate(start_date);
    //                 // console.log("start_date at for the current investment line 568", investment.start_date);
    //                 investment.payout_date = DateTime.fromJSDate(payout_date);
    //                 // console.log("payout_date at for the current investment line 570", investment.payout_date);
    //                 // TODO
    //                 // Change startdate and duration to real variable and data
    //                 let startDate = investment.start_date;
    //                 duration = Number(investment.duration);

    //                 let payoutDetails = await getPayoutDetails();
    //                 // TODO
    //                 // Remove and change to payout schedule data
    //                 // let startDate = DateTime.now().minus({ days: 5 }).toISO();
    //                 // duration = 4;
    //                 // duration = Number(duration);
    //                 // console.log("Time investment was started line 847: ", startDate);

    //                 let timelineObject;
    //                 // let timeline;
    //                 let isDueForPayout = await dueForPayout(startDate, duration);
    //                 // console.log("Is due for payout status line 914:", isDueForPayout);

    //                 if (isDueForPayout && investment.status === 'active' && investment.is_payout_successful.toString() == "0") {
    //                     //  START
    //                     let payload = investment
    //                     let { customer_savings_account, id, total_amount_to_repay } = investment;
    //                     // console.log("Investment record due for payout data line 920:", payload);
    //                     // update timeline
    //                     let newTimeline //= await createNewTimeline();
    //                     // TODO
    //                     // Send all the above flow to batch payment endpoint

    //                     // New Code Update
    //                     // const investmentType = await getTypeByName();
    //                     const investmentType = await getTypeById();
    //                     // @ts-ignore
    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount, interestOnInvestmentAccount } = investmentType;

    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let userInvestmentWalletId = await getInvestmentWalletId();
    //                     let investmentPayoutReference = DateTime.now() + randomstring.generate(4);
    //                     let description = `Payout of ${investment.first_name} ${currencyCode} ${amount_approved} due investment, has been done successfully.`;

    //                     // Get the User Savings Account Balance
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(customer_savings_account);
    //                     // console.log(" Customer Account Balance =================================================")
    //                     // console.log(savingsAccountBalance);
    //                     // debugger;
    //                     let amountDeductable = Number(savingsAccountBalance) - Number(MINIMUM_BALANCE);
    //                     let amountToBeDeducted = Number(amount_approved) + Number(interest_due_on_investment);
    //                     // console.log("amountDeductable: ", amountDeductable);
    //                     // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     if (amountToBeDeducted > amountDeductable) {
    //                         console.log(" Customer Account Balance,line 1087  =================================================")
    //                         console.log(savingsAccountBalance);
    //                         console.log(" amountDeductable, line 1092 =================================================")
    //                         console.log("amountDeductable: ", amountDeductable);
    //                         console.log(" amountToBeDeducted, line 1094 =================================================")
    //                         console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                         console.log(`The user with UserId: ${user_id}, has a balance of ${currencyCode} ${savingsAccountBalance} which is insufficient to process investment payout. Please fund your savings account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`)
    //                         // Send Notification to Customer
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Payout Failed";
    //                         let message = `
    //             ${investment.first_name} this is to inform you, that your investment of ${currencyCode} ${investment.amount_approved}, is due for payout, but your Savings Account with Number ${investment.customer_savings_account}, with current balance of ${currencyCode} ${savingsAccountBalance}, has insufficient amount to process investment payout. Please fund your Savings Account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 1109:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                             // debugger
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             // debugger
    //                             console.log(newNotificationMessage);
    //                         }
    //                         throw new AppException({ message: `The user with UserId: ${user_id}, has a balance of ${currencyCode} ${savingsAccountBalance} which is insufficient to process investment payout. Please fund your savings account with at least ${currencyCode} ${Number(amountToBeDeducted) + Number(MINIMUM_BALANCE)} as we try again.`, codeSt: "500" })
    //                     }

    //                     //  Send details to the endpoint for investment payout transactions
    //                     let investmentPayout = await investmentPayoutProcess(investmentPayoutReference, userInvestmentWalletId, outstandingInvestmentWalletId, investmentPayoutAccount, interestOnInvestmentAccount, customer_savings_account, description, id);

    //                     // update the investment
    //                     await updateInvestmentViaAPI(payload);
    //                     // console.log("Investment payout and update was successful, request status is OK. Line 953");

    //                     // update investmentability status
    //                     await updateInvestmentabilityStatus();
    //                     // update investment information
    //                     updateInvestmentStatus(investmentPayout, investmentPayoutReference);
    //                     // Save
    //                     let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 683 :", currentInvestment);
    //                     // send for update
    //                     await this.updateInvestment(currentInvestment, investment);
    //                     // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                     // console.log(" Current log, line 687 :", updatedInvestment);
    //                     // update investmentLog
    //                     // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 377 :", currentInvestmentLog);
    //                     // send for update
    //                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // console.log(" Current log, line 380 :", updatedInvestmentLog);

    //                     // TODO
    //                     // Update Payout schedule record for this investment
    //                     payoutDetails.paid = true;
    //                     let payoutUpdatePayload = payoutDetails;
    //                     // let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                     // console.log(" Updated payout schedule,line 694 ", updatedPayoutDetails);
    //                     // Create a new record in Repaid investment table
    //                     let { payout_date } = investment;
    //                     // console.log(" Payout Date , line 697", payout_date);
    //                     payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                     // console.log(" Payout Date in ISO format, line 699", payout_date);
    //                     await updatePaymentRecord(id, payout_date, investmentPayout, total_amount_to_repay, updatedPayoutDetails);
    //                     // Commit update to database
    //                     await trx.commit();
    //                     // update timeline
    //                     newTimeline = await newTimelineObject(newTimeline);
    //                     // Send Details to notification service
    //                     await sendNotificationMessage();
    //                     return investment;
    //                 } else if (isDueForPayout == false && investment.status !== 'active' && investment.is_payout_successful.toString() == "1") {
    //                     console.log(" Investment is not active nor due for payout, or payment has been completed.")
    //                     await trx.commit();
    //                     return investment;
    //                 } else {
    //                     await trx.commit();
    //                     return investment;
    //                 }

    //                 async function sendNotificationMessage() {
    //                     let { email, first_name } = investment;
    //                     let subject = "AstraPay Investment Payout";
    //                     let message = `
    //             ${investment.first_name} this is to inform you, that your investment of ${currencyCode} ${investment.amount_approved}, has been repaid.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                     console.log("newNotificationMessage line 1005:", newNotificationMessage);
    //                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                         console.log("Notification sent successfully");
    //                     } else if (newNotificationMessage.message !== "Success") {
    //                         console.log("Notification NOT sent successfully");
    //                         console.log(newNotificationMessage);
    //                     }
    //                 }

    //                 async function updatePaymentRecord(id: any, payout_date: any, investmentPayout: any, total_amount_to_repay: number, updatedPayoutDetails: any) {
    //                     // let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payout_date, amount_approved);
    //                     // console.log("hasExistingRepaidInvestment line 1016:");
    //                     // console.log(hasExistingRepaidInvestment);
    //                     let amountDue = total_amount_to_repay;
    //                     let amountPaid = total_amount_to_repay;
    //                     let amountOutstanding = total_amount_to_repay - amountPaid;
    //                     if (!hasExistingRepaidInvestment) {
    //                         let repaidInvestmentPayload = {
    //                             walletId: wallet_id,
    //                             userId: user_id,
    //                             investmentId: investment.id,
    //                             amount: investment.amount_approved,
    //                             interest: investment.interest_due_on_investment,
    //                             payoutDueDate: investment.payout_date,
    //                             paid: true,
    //                             transactionId: investmentPayout.data.transxnId,
    //                             transactionReference: investment.investment_payout_reference,
    //                             payoutScheduleId: updatedPayoutDetails!.id,
    //                             amountDue: amountDue,
    //                             amountPaid: amountPaid,
    //                             amountOutstanding: amountOutstanding,
    //                             label: "payout",
    //                             type: "automated",
    //                             subType: "sagamy",
    //                             payoutModel: "full",
    //                         };
    //                         // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                         // console.log("newRepaidInvestment line 1039:");
    //                         // console.log(newRepaidInvestment);
    //                     }
    //                 }

    //                 function updateInvestmentStatus(investmentPayout: any, investmentPayoutReference: any) {
    //                     investment.is_payout_successful = true;
    //                     investment.request_type = "repay_investment";
    //                     investment.date_payout_was_done = DateTime.now();
    //                     // TODO
    //                     // save transaction Id
    //                     if (investmentPayout.data.transxnId) {
    //                         investment.investment_payout_transaction_id = investmentPayout.data.transxnId;
    //                     }
    //                     //  save investmentPayoutReference
    //                     investment.investment_payout_reference = investmentPayoutReference;
    //                     // on success, update investment status to completed
    //                     investment.status = "completed";
    //                 }

    //                 async function updateInvestmentabilityStatus() {
    //                     // let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                     // console.log("investmentability Status line 1061:", investmentabilityStatus);
    //                     // @ts-ignore
    //                     let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                     let newRecommendation = recommendation + amount_approved;
    //                     let newAmountInvestmentable = amountInvestmentable + amount_approved;
    //                     // let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                     let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                     if (investment.total_amount_to_repay == investment.amount_paid) {
    //                         newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                     }
    //                     let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_approved;
    //                     let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_approved;
    //                     // investmentabilityStatus!.recommendation = newRecommendation;
    //                     // investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                     // investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                     // investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                     // investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                     // investmentabilityStatus!.lastInvestmentPerformanceRating = "100";
    //                     // investmentabilityStatus!.lastInvestmentDuration = duration;
    //                     // investmentabilityStatus!.lat = investment.lat;
    //                     // investmentabilityStatus!.lng = investment.lng;
    //                     // investmentabilityStatus!.isFirstInvestment = false;
    //                     // // Save
    //                     // investmentabilityStatus!.save();
    //                 }

    //                 async function newTimelineObject(newTimeline: any) {
    //                     timelineObject = {
    //                         id: uuid(),
    //                         action: "investment payout",
    //                         investmentId: investment.id,
    //                         walletId: investment.wallet_id,
    //                         userId: investment.user_id,
    //                         // @ts-ignore
    //                         message: `${investment.first_name}, your investment of ${currencyCode} ${investment.amount_approved} has been repaid, please check your account,thank you.`,
    //                         createdAt: DateTime.now(),
    //                         metadata: `total amount deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                     };
    //                     // console.log("Timeline object line 1905:", timelineObject);
    //                     newTimeline = await timelineService.createTimeline(timelineObject);
    //                     // console.log("new Timeline object line 1094:", newTimeline);
    //                     return newTimeline;
    //                 }

    //                 async function investmentPayoutProcess(investmentPayoutReference: any, userInvestmentWalletId: any, outstandingInvestmentWalletId: string, investmentPayoutAccount: string, interestOnInvestmentAccount: string, customer_savings_account: any, description: string, id: any) {
    //                     // This is done after we have checked the user account Balance
    //                     // Subtracted #200,then we Debit the Investmented amount from the remaining amount
    //                     // let investmentPayout = await repayDueInvestment(investmentPayoutReference, userInvestmentWalletId, amount_approved, interest_due_on_investment, outstandingInvestmentWalletId, investmentPayoutAccount,
    //                         interestOnInvestmentAccount, customer_savings_account, description, lng, lat);
    //                     // console.log("Investment Payout transaction response");
    //                     // console.log(investmentPayout);
    //                     if (investmentPayout.status == "FAILED TO REPAY LOAN" && investmentPayout.errorMessage !== 'Duplicate batch payment id') {
    //                         if (investmentPayout.errorCode == "500-004") {
    //                             console.log(`Line 1920: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                             throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                         } else if (investmentPayout.errorCode !== "500-004") {
    //                             console.log(`Line 640: The payout of the Investment with ID: ${id} was not successful, please try again, thank you.`);
    //                             throw new AppException({ message: `${investmentPayout.errorMessage}`, codeSt: `${investmentPayout.errorCode}` });
    //                         }
    //                     }
    //                     // store investment disbursement transaction id
    //                     if (investmentPayout.data.transxnId) {
    //                         investment.investment_payout_transaction_id = investmentPayout.data.transxnId;
    //                         investment.amount_paid = Number(amount_approved + interest_due_on_investment);
    //                         investment.amount_outstanding = investment.total_amount_to_repay - investment.amount_paid;
    //                         investment.total_amount_paid_on_investment = Number(amount_approved);
    //                         investment.amount_outstanding_on_investment = Number(investment.amount_outstanding_on_investment - investment.total_amount_paid_on_investment);
    //                         investment.total_amount_paid_on_interest = Number(interest_due_on_investment);
    //                         investment.amount_outstanding_on_interest = Number(investment.amount_outstanding_on_interest - investment.total_amount_paid_on_interest);
    //                         investment.label = "payout";
    //                     }
    //                     return investmentPayout;
    //                 }

    //                 async function updateInvestmentViaAPI(payload: any) {
    //                     // TODO
    //                     // change to service from API
    //                     const headers = {
    //                         "internalToken": ASTRAPAY_BEARER_TOKEN
    //                     }
    //                     const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                     // amount: payloadAmount,
    //                     // FAILED TO REPAY LOAN
    //                     console.log("The API response for investment update request line 1127: ", response);
    //                     if (response && response.data.status === "FAILED") {
    //                         console.log("Investment payout update was unsuccessful, request status is FAILED");
    //                         // update timeline
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout update failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name}, your investment of ${currencyCode} ${investment.amount_approved} has been repaid successfully,but we are unable to update the details now. Please check your account,thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 1142:", timelineObject);
    //                         await timelineService.createTimeline(timelineObject);
    //                         // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 1144:", newTimeline);
    //                         await trx.commit();
    //                         console.log(" Payout done, but update was unsuccessful. Line 1146 ==============================");
    //                         throw new AppException({ message: `Payout done, but update was unsuccessful`, codeSt: `500` });
    //                     }
    //                 }

    //                 async function getPayoutDetails() {
    //                     // let payoutDetails = await payoutSchedulesService.getPayoutScheduleByUserIdAndInvestmentIdAndWalletId(user_id, investment.id, wallet_id);
    //                     // console.log(" Payout details +++===========================+++++");
    //                     // console.log(payoutDetails);
    //                     if (!payoutDetails) {
    //                         throw new AppException({ message: `This investment does not have a payout schedule, please check your parameters and try again. Thank you.`, codeSt: "500" });
    //                     }
    //                     return payoutDetails;
    //                 }

    //                 async function getInvestmentWalletId() {
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 1163:", genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 1974: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         // throw new Error(`Failed to fetch wallet for user with ID: ${user_id} ,please try again.`)
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 1979 :");
    //                     // console.log(investmentWallet);
    //                     // const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 1982 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`);
    //                             throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" });
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 1184: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 1185:", availableInvestmentWalletBalance);
    //                     return userInvestmentWalletId;
    //                 }

    //                 // async function getTypeByName() {
    //                 //   let typeName = investment.investment_type_name;
    //                 //   const investmentType = await typesService.getTypeByTypeName(typeName);
    //                 //   // console.log(" investmentType ==============================");
    //                 //   // console.log(investmentType);
    //                 //   if (!investmentType) {
    //                 //     console.log(`Investment Type Named: ${typeName} does not exist.`);
    //                 //     throw new AppException({ message: `Investment Type Named: ${typeName} does not exist.`, codeSt: "500" });
    //                 //   }
    //                 //   return investmentType;
    //                 // }

    //                 async function getTypeById() {
    //                     let typeId = investment.investment_type_id;
    //                     const investmentType = await typesService.getTypeByTypeId(typeId);
    //                     // console.log(" investmentType ==============================");
    //                     // console.log(investmentType);
    //                     if (!investmentType) {
    //                         console.log(`Investment Type Id: ${typeId} does not exist.`);
    //                         throw new AppException({ message: `Investment Type Id: ${typeId} does not exist.`, codeSt: "500" });
    //                     }
    //                     return investmentType;
    //                 }

    //                 // async function createNewTimeline() {
    //                 //   timelineObject = {
    //                 //     id: uuid(),
    //                 //     action: "investment payout is due",
    //                 //     investmentId: investment.id,
    //                 //     walletId: investment.wallet_id,
    //                 //     userId: investment.user_id,
    //                 //     // @ts-ignore
    //                 //     message: `${investment.first_name} your investment of ${currencyCode} ${investment.total_amount_to_repay} is due for payout.`,
    //                 //     createdAt: DateTime.now(),
    //                 //     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                 //   };
    //                 //   // console.log("Timeline object line 2882:", timelineObject);
    //                 //   let newTimeline = await timelineService.createTimeline(timelineObject);
    //                 //   // console.log("new Timeline object line 1215:", newTimeline);
    //                 //   return newTimeline;
    //                 // }
    //             }
    //         // );
    //         // await processInvestment(ainvestment)
    //         for (let index = 0; index < responseData.length; index++) {
    //             try {
    //                 const ainvestment = responseData[index];
    //                 await processInvestment(ainvestment);
    //                 investmentArray.push(ainvestment);
    //             } catch (error) {
    //                 console.log("Error line 1227:", error);
    //                 throw error;
    //             }
    //         }
    //         // commit changes to database
    //         await trx.commit();

    //         // console.log("Response data for payout in investment service, line 744:", investmentArray)
    //         return investmentArray;
    //     } catch (error) {
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentsForRecovery(queryParams: any): Promise<Investment[] | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Query params in investment service line 1647:", queryParams)
    //         let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams;
    //         if (!updatedAtFrom) {
    //             // default to last 3 months
    //             queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //             updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //         }
    //         // debugger;
    //         if (!updatedAtTo) {
    //             queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
    //             updatedAtTo = DateTime.now().toISO();//.toISODate();
    //         }
    //         offset = Number(offset);
    //         limit = Number(limit);
    //         // const queryGetter = await this.queryBuilder(queryParams)
    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         // const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         // const payoutSchedulesService = new PayoutSchedulesServices();
    //         // const payoutDefaultersService = new PayoutDefaultersServices();
    //         // const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 578:", settings);
    //         if (!settings) {
    //             // throw Error(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         // let { currencyCode, gracePeriod } = settings;
    //         let { currencyCode } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('status', "default")
    //             .where('updated_at', '>=', updatedAtFrom)
    //             .where('updated_at', '<=', updatedAtTo)
    //             .offset(offset)
    //             .limit(limit)
    //         // .forUpdate()

    //         // console.log(responseData)
    //         if (!responseData) {
    //             console.log(`There is no defaulting investment or recovery has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `There is no defaulting investment or recovery has been completed. Please, check and try again.`, codeSt: "500" })
    //         }
    //         let investmentArray: any[] = [];
    //         const processInvestment = async (investment) => {
    //             // console.log(" The current investment startDate, line 839:", investment.startDate)

    //             let { id, created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, lng, lat, amount_outstanding_on_interest, amount_outstanding_on_investment } = investment; //interest_due_on_investment,
    //             investment.checked_for_payment_at = DateTime.now();
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             // console.log("created_at at for the current investment line 513", investment.created_at);
    //             investment.start_date = DateTime.fromJSDate(start_date);
    //             // console.log("start_date at for the current investment line 568", investment.start_date);
    //             investment.payout_date = DateTime.fromJSDate(payout_date);
    //             // console.log("payout_date at for the current investment line 570", investment.payout_date);
    //             // TODO
    //             // Change startdate and duration to real variable and data
    //             // let startDate = investment.startDate;
    //             // duration = Number(investment.duration);
    //             // Add search  by payout due date
    //             let payoutDueDate = investment.payout_date.toISODate();
    //             // console.log(" Amount Approved type is :", typeof amount_approved);
    //             // debugger
    //             let payoutDetails = await payoutSchedulesService.getPayoutScheduleByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndAmount(user_id, wallet_id, id, payoutDueDate, amount_approved);
    //             // console.log(" Payout details +++===========================+++++")
    //             // console.log(payoutDetails);

    //             // debugger
    //             if (!payoutDetails) {
    //                 throw new AppException({ message: `This investment does not have a payout schedule, please check your parameters and try again. Thank you.`, codeSt: "500" })
    //             }
    //             // console.log(payoutDetails!.paid.toString());
    //             // debugger
    //             // check if load has not been repaid
    //             if (payoutDetails.paid.toString() == "0" || payoutDetails.paid == false) {
    //                 let grace_period = Number(gracePeriod);
    //                 let startDate = investment.start_date;
    //                 // console.log("Time investment was started line 870: ", startDate);

    //                 duration = Number(duration) + grace_period; // plus gracePeriod
    //                 // console.log("grace_period of investment line 871: ",typeof grace_period);
    //                 // console.log("Duration of investment line 872: ", typeof duration);

    //                 let startDateInMs = DateTime.now().minus({ days: grace_period }).toMillis()
    //                 // console.log("Time investment was started in ms line 873: ", startDateInMs);

    //                 let durationInMs = DateTime.now().minus({ days: duration }).toMillis()
    //                 // console.log("Time investment duration in ms line 875: ", durationInMs);
    //                 // let overDueDate = DateTime.now()

    //                 if (durationInMs > startDateInMs) {
    //                     // console.log("Investment is overdue line 878: ============================================================= ");
    //                 }
    //                 let timelineObject;
    //                 // let timeline;
    //                 let isOverDueForPayout = await dueForPayout(startDate, duration);
    //                 console.log("Is over due for payout status line 1546: =========================================");
    //                 console.log(isOverDueForPayout);
    //                 // debugger;
    //                 if (isOverDueForPayout == true && investment.status === 'default' && investment.is_payout_successful.toString() == "0") {
    //                     //  START
    //                     console.log(`Starting Investment Recovery process for investment with ID : ${investment.id}, line 1550 ===========================================`);
    //                     let payload = investment
    //                     let { customer_savings_account, id, total_amount_to_repay, amount_outstanding } = investment;
    //                     // let penalty = (1 / 100) * Number(total_amount_to_repay);
    //                     let penalty = (1 / 100) * Number(amount_outstanding);
    //                     // console.log("Penalty line 896:", penalty);
    //                     // console.log("Investment record over due for payout data line 897:", payload);
    //                     // debugger;
    //                     // payload.investmentId = investmentId;
    //                     // console.log(" investment[0].status line 2871:", investment.status);
    //                     let investmentRecovery;
    //                     let amount_to_be_deducted;
    //                     let interest_to_be_deducted;
    //                     // let newTimeline;
    //                     let hasExistingPayoutDefault;
    //                     // let typeName = investment.investment_type_name;
    //                     let typeId = investment.investment_type_id;
    //                     let subType;
    //                     // New code update
    //                     // const investmentType = await typesService.getTypeByTypeName(typeName);
    //                     const investmentType = await typesService.getTypeByTypeId(typeId);
    //                     console.log(" investmentType ==============================");
    //                     console.log(investmentType);
    //                     if (!investmentType) {
    //                         // console.log(`Investment Type Named: ${typeName} does not exist.`)
    //                         // throw new AppException({ message: `Investment Type Named: ${typeName} does not exist.`, codeSt: "500" })
    //                         console.log(`Investment Type Id: ${typeId} does not exist.`);
    //                         throw new AppException({ message: `Investment Type Id: ${typeId} does not exist.`, codeSt: "500" });
    //                     }
    //                     // @ts-ignore
    //                     // TODO
    //                     // Uncomment the code below after testing investment recovery from wallet endpoint
    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount,
    //                         interestOnInvestmentAccount, interestOnInvestmentWalletId, investmentRecoveryWalletId, } = investmentType;
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 944:", genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 1686: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         // throw new Error(`Failed to fetch wallet for user with ID: ${user_id} ,please try again.`)
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 1691 :");
    //                     // console.log(investmentWallet);
    //                     const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 1694 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                             throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" })
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 1706: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 1707:", availableMainWalletBalance)
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 1710: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 1711:", availableInvestmentWalletBalance)
    //                     let investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                     let description = `Recovery of ${investment.first_name} ${currencyCode} ${amount_approved} over due investment, has been done successfully.`;
    //                     // Get the User Savings Account Balance
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(customer_savings_account);
    //                     // console.log(" Customer Account Balance =================================================")
    //                     // console.log(savingsAccountBalance);
    //                     // debugger;
    //                     let amountDeductable = Number(savingsAccountBalance) - Number(MINIMUM_BALANCE);
    //                     // let amountToBeDeducted = Number(amount_approved) + Number(interest_due_on_investment);
    //                     // console.log("amountDeductable: ", amountDeductable);
    //                     // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     if (amountDeductable > 0 || availableMainWalletBalance > 0) {
    //                         amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                         interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                         if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                             amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - amount_outstanding_on_interest);
    //                             interest_to_be_deducted = amount_outstanding_on_interest;
    //                         }
    //                         if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                             amount_to_be_deducted = amount_outstanding_on_investment
    //                         }
    //                         // console.log("Amount to be deducted for recovery, line 2547:", amount_to_be_deducted);
    //                         // console.log("Interest to be deducted for recovery, line 2548:", interest_to_be_deducted);

    //                         // investmentRecovery = await repayDueInvestment(investmentRecoveryReference, userInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, outstandingInvestmentWalletId, investmentPayoutAccount,
    //                             // interestOnInvestmentAccount, customer_savings_account, description, lng, lat);
    //                         // console.log("Investment Recovery transaction response");
    //                         // console.log(investmentRecovery);
    //                         if (investmentRecovery.status === 200) {
    //                             // update investment record
    //                             console.log(" About to update investment recorc on successful recovery from SAGAMY , line 1909")
    //                             // store investment recovery transaction id
    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);

    //                             investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                             investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                             investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                             investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                             payload = investment;
    //                             // update the investment
    //                             // TODO
    //                             // change to service from API
    //                             const headers = {
    //                                 "internalToken": ASTRAPAY_BEARER_TOKEN
    //                             }
    //                             const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                             // amount: payloadAmount,
    //                             // FAILED TO REPAY LOAN
    //                             // console.log("The API response for investment update request line 1035: ", response);
    //                             // debugger
    //                             if (response && response.data.status === "FAILED") {
    //                                 console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                 // update timeline
    //                                 await trx.commit();
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery update failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered successfully but database update was unsuccessful. It will be resolved as soon as possible.Please check your account, thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 2035:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 2037:", newTimeline);
    //                                 console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)

    //                             }
    //                             // create and send a new timeline
    //                             console.log("Investment recovery successful, request status is OK, line 2042 =========================================");
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered, please check your account,thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount of investment plus interest deducted so far: ${currencyCode} ${investment.amount_paid}`,
    //                             };
    //                             // console.log("Timeline object line 1698:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 1700:", newTimeline);
    //                             // update investmentability status
    //                             let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                             // console.log("investmentability Status line 1098:", investmentabilityStatus);
    //                             // @ts-ignore
    //                             let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                             let newRecommendation = recommendation + amount_approved;
    //                             let newAmountInvestmentable = amountInvestmentable + amount_approved;
    //                             // let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                             let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                             }
    //                             let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_approved;
    //                             let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_approved;
    //                             investmentabilityStatus!.recommendation = newRecommendation;
    //                             investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                             investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                             investmentabilityStatus!.lastInvestmentPerformanceRating = "40";
    //                             // investmentabilityStatus!.lastInvestmentDuration = duration;
    //                             let currentDate = new Date().toISOString()
    //                             let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                             console.log("currentInvestmentDuration line 1641 ======================");
    //                             console.log(currentInvestmentDuration);
    //                             investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();

    //                             investmentabilityStatus!.isFirstInvestment = false;
    //                             investmentabilityStatus!.isDefaulter = true;
    //                             investmentabilityStatus!.lat = investment.lat;
    //                             investmentabilityStatus!.lng = investment.lng;
    //                             // Save
    //                             investmentabilityStatus!.save()
    //                             // update investment information

    //                             investment.request_type = "repay_defaulted_investment";
    //                             investment.date_recovery_was_done = DateTime.now();
    //                             // TODO
    //                             // save transaction Id
    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             //  save investmentRecoveryReference
    //                             investment.investment_recovery_reference = investmentRecoveryReference;
    //                             // on success, update investment status to completed if all the amount investment are recovered
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 investment.status = "completed";
    //                                 investment.is_payout_successful = true;
    //                                 investment.is_recovery_successful = true;
    //                             }
    //                             investment.label = "recovery";
    //                             // Save
    //                             let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                             // console.log(" Current log, line 2079 :", currentInvestment);
    //                             //    await currentInvestment!.save();
    //                             // send for update
    //                             await this.updateInvestment(currentInvestment, investment);
    //                             // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                             // console.log(" Current log, line 2083 :", updatedInvestment);
    //                             // update investmentLog
    //                             // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                             // console.log(" Current log, line 2087 :", currentInvestmentLog);
    //                             // send for update
    //                             // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // console.log(" Current log, line 2090 :", updatedInvestmentLog);
    //                             // TODO
    //                             // Update Payout schedule record for this investment
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 payoutDetails.paid = true;
    //                             }
    //                             payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                             payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                             let payoutUpdatePayload = payoutDetails;
    //                             let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                             // console.log(" Updated payout schedule,line 1151 ", updatedPayoutDetails);
    //                             // Create a new record in Repaid investment table
    //                             // let { payout_date } = investment;
    //                             // console.log(" Payout Date , line 1154", payout_date);
    //                             // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                             // console.log(" Payout Date in ISO format, line 1156", payoutDueDate);
    //                             let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                             let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                             // console.log("hasExistingRepaidInvestment line 1158:");
    //                             // console.log(hasExistingRepaidInvestment);

    //                             let amountDue = total_amount_to_repay;
    //                             let amountPaid = investment.amount_paid;
    //                             let amountOutstanding = total_amount_to_repay - amountPaid;
    //                             let paymentStatus = false;
    //                             let payoutModel = "part";
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 paymentStatus = true;
    //                             }
    //                             let amountRecoveredNow = Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             if (investment.total_amount_to_repay == amountRecoveredNow) {
    //                                 payoutModel = "full";
    //                             }
    //                             if (!hasExistingRepaidInvestment) {
    //                                 let repaidInvestmentPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     payoutDueDate: investment.payout_date,
    //                                     paid: paymentStatus,
    //                                     transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                     transactionReference: investment.investment_recovery_reference,
    //                                     payoutScheduleId: updatedPayoutDetails!.id,
    //                                     amountDue: amountDue,
    //                                     amountPaid: amountPaid,
    //                                     amountOutstanding: amountOutstanding,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: "sagamy",
    //                                     payoutModel: payoutModel,
    //                                 }
    //                                 await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // console.log("newRepaidInvestment line 1173:");
    //                                 // console.log(newRepaidInvestment);
    //                             }

    //                             if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                 let payoutDefaulterPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     payoutScheduleId: payoutDetails.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     totalAmountDue: investment.total_amount_to_repay,
    //                                     payoutDueDate: investment.payout_date,
    //                                     datePayoutWasEffected: DateTime.now(),
    //                                     paid: paymentStatus,
    //                                     transactionId: investmentRecovery.data.transxnId,
    //                                     transactionReference: investment.investment_recovery_reference,
    //                                     amountPaid: investment.amount_paid,
    //                                     amountOutstanding: investment.amount_outstanding,
    //                                     penalty,
    //                                     gracePeriod: gracePeriod.toString(),
    //                                     recoveredBy: "Super Admin",
    //                                     accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: "sagamy",
    //                                     payoutModel: payoutModel,
    //                                 }
    //                                 await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                 // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                 // console.log("newPayoutDefaulter line 1848:");
    //                                 // console.log(newPayoutDefaulter);

    //                                 // Commit update to Database
    //                                 await trx.commit()
    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_outstanding} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount deducted so far: ${currencyCode} ${investment.amount_paid}`,
    //                                 };
    //                                 // console.log("Timeline object line 10186793:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 1869:", newTimeline);

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery";
    //                                 let message = `
    //             ${investment.first_name},this is to inform you, that ${currencyCode} ${Number(amount_to_be_deducted) + Number(interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_outstanding} has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 1883:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }

    //                             }
    //                         } else {
    //                             investmentRecovery = { status: 422 };
    //                             // console.log(" Current Investment status Line 2515:", investmentRecovery.status )
    //                             // Send Notification and update timeline, for failed from SAGAMY Savings Account
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery from savings account failed",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your savings account has failed. Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                             };
    //                             // console.log("Timeline object line 1909:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 1911:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment recovery from SAGAMY was unsuccessful, line 1914 ================================== ");

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Recovery Failed";
    //                             let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your savings account has failed. 

    //            Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 1929:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }

    //                         }
    //                         // Change status code to number
    //                         // @ts-ignore
    //                         let investmentRecoveryFromMainWallet;
    //                         if (investmentRecovery.status != undefined && investmentRecovery.status != 200 || investment.amount_outstanding_on_investment > 0 || investment.amount_outstanding_on_interest > 0) {
    //                             // try payout from users main wallet
    //                             // Debit the  User wallet with the interest on investment
    //                             try {
    //                                 // Uncomment after Test
    //                                 investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                                 // debugger;
    //                                 // TODO
    //                                 // Get User Wallet Balance : availableMainWalletBalance
    //                                 amountDeductable = Number(availableMainWalletBalance) - Number(MINIMUM_BALANCE);
    //                                 // amountToBeDeducted = Number(amount_approved) + Number(interest_due_on_investment);
    //                                 // console.log("amountDeductable: ", amountDeductable);
    //                                 // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                                 if (amountDeductable <= 0) {
    //                                     // Send Notification and update timeline, for failed from ASTRAPAY
    //                                     // update timeline
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery from wallet failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your wallet has failed. Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                     };
    //                                     // console.log("Timeline object line 2331:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 2334:", newTimeline);

    //                                     // create and send a new timeline
    //                                     console.log("Investment recovery from ASTRAPAY was unsuccessful, line 2337 ================================== ");

    //                                     // Send Details to notification service
    //                                     let { email, first_name } = investment;
    //                                     let subject = "AstraPay Investment Recovery Failed";
    //                                     let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                     console.log("newNotificationMessage line 1988:", newNotificationMessage);
    //                                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                         console.log("Notification sent successfully");
    //                                     } else if (newNotificationMessage.message !== "Success") {
    //                                         console.log("Notification NOT sent successfully");
    //                                         console.log(newNotificationMessage);
    //                                     }
    //                                     await trx.commit();
    //                                     throw new AppException({ message: `There was an error debiting the user wallet, the available balance of  ${currencyCode} ${availableMainWalletBalance} is insufficient for the recovery of the outstanding amount of ${currencyCode} ${investment.amount_outstanding} , please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)} and try again.`, codeSt: `${417}` })
    //                                 } else if (amountDeductable > 0) {
    //                                     amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                                     interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                                     if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                                         amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - amount_outstanding_on_interest);
    //                                         interest_to_be_deducted = amount_outstanding_on_interest;
    //                                     }
    //                                     if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                                         amount_to_be_deducted = amount_outstanding_on_investment
    //                                     }
    //                                 }
    //                                 // console.log("Amount to be deducted for recovery, line 2588:", amount_to_be_deducted);
    //                                 // console.log("Interest to be deducted for recovery, line 2589:", interest_to_be_deducted);
    //                                 investmentRecovery = await recoverInvestmentFromUserMainWallet(investmentRecoveryReference, userInvestmentWalletId, userMainWalletId, outstandingInvestmentWalletId, investmentRecoveryWalletId,
    //                                     interestOnInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, description, lng, lat);
    //                                 outstandingInvestmentWalletId
    //                                 // console.log("Investment Recovery from Main Wallet transaction response");
    //                                 // console.log(investmentRecovery);
    //                                 if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') {
    //                                     investmentRecoveryFromMainWallet = "FAILED";
    //                                     let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                     console.log("statusCode line 1859:", statusCode);
    //                                     let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                     console.log("statusCodeExtension line 1861:", statusCodeExtension);
    //                                     console.log("Investment recovery exceptional error message, line 2020 ==========================");
    //                                     console.log(investmentRecovery.message);
    //                                     // Send Notification & update timeline for failed investment recovery from Main Wallet
    //                                     // update timeline
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery from wallet failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your wallet has failed. Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                     };
    //                                     // console.log("Timeline object line 2400:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 2403:", newTimeline);

    //                                     // create and send a new timeline
    //                                     console.log("Investment recovery from ASTRAPAY Wallet was unsuccessful, line 1997 ================================== ");

    //                                     // Send Details to notification service
    //                                     let { email, first_name } = investment;
    //                                     let subject = "AstraPay Investment Recovery Failed";
    //                                     let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                     console.log("newNotificationMessage line 2053:", newNotificationMessage);
    //                                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                         console.log("Notification sent successfully");
    //                                     } else if (newNotificationMessage.message !== "Success") {
    //                                         console.log("Notification NOT sent successfully");
    //                                         console.log(newNotificationMessage);
    //                                     }

    //                                     throw new AppException({ message: `There was an error debiting the user wallet, please try again. ${investmentRecovery.message}`, codeSt: `${statusCode}` })
    //                                 } else if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage == 'Duplicate batch payment id') {
    //                                     investmentRecoveryFromMainWallet = "OK";
    //                                     let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                     console.log("statusCode line 2067:", statusCode);
    //                                     let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                     console.log("statusCodeExtension line 2069:", statusCodeExtension);
    //                                     let recoveredBy = "Super Admin";// loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                                     subType = "astrapay";
    //                                     let payoutMethod = "part";
    //                                     if (investment.amount_outstanding == investment.amount_paid) {
    //                                         payoutMethod = "full"
    //                                     }
    //                                     if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                         let payoutDefaulterPayload = {
    //                                             walletId: wallet_id,
    //                                             userId: user_id,
    //                                             investmentId: investment.id,
    //                                             payoutScheduleId: payoutDetails.id,
    //                                             amount: investment.amount_approved,
    //                                             interest: investment.interest_due_on_investment,
    //                                             totalAmountDue: investment.total_amount_to_repay,
    //                                             payoutDueDate: investment.payout_date,
    //                                             datePayoutWasEffected: DateTime.now(),
    //                                             paid: false,
    //                                             transactionId: investmentRecovery.data.transxnId,
    //                                             transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                             amountPaid: investment.amount_paid,
    //                                             amountOutstanding: investment.amount_outstanding,
    //                                             penalty,
    //                                             gracePeriod: gracePeriod.toString(),
    //                                             recoveredBy: recoveredBy, //"super admin",
    //                                             accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                             label: "recovery",
    //                                             type: "automated",
    //                                             subType: subType,
    //                                             payoutModel: payoutMethod, //"part",
    //                                         }
    //                                         await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                         // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                         // console.log("newPayoutDefaulter line 2096:");
    //                                         // console.log(newPayoutDefaulter);
    //                                     }

    //                                     trx.commit();
    //                                     throw new AppException({ message: `There was an error debiting the user's wallet, please try again. ${investmentRecovery.message}`, codeSt: `${statusCode}` })
    //                                 }
    //                                 investmentRecoveryFromMainWallet = "OK";
    //                             } catch (error) {
    //                                 console.error(error.message);
    //                                 throw error;
    //                             }

    //                             // }
    //                             // else if (investmentRecovery.status != undefined && investmentRecovery.status != 200 && investmentRecoveryFromMainWallet == "FAILED") {
    //                             // try payout with the use of Okra Garnishment feature
    //                             //   console.log("Trying to recover investment from Main Wallet Status: line 1369", investmentRecoveryFromMainWallet);
    //                             //   console.log(" Sending Investment to Okra for garnishment line 1360 ===========");
    //                             // }

    //                             // console.log(" Payout Date in ISO format, line 2043", payout_date);

    //                             investment.investment_recovery_reference = investmentRecoveryReference;
    //                             // let hasExistingPayoutDefault //= await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                             // console.log("hasExistingPayoutDefault line 2047:");
    //                             // console.log(hasExistingPayoutDefault);
    //                             if ((investmentRecovery.status == "FAILED TO REPAY LOAN" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') && (investmentRecovery.status == "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage !== 'Duplicate batch payment id')) {
    //                                 console.log(`The recovery of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                 // Send Notification & update timeline for failed investment recovery from Main Wallet
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your savings account and wallet has failed. Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                 };
    //                                 // console.log("Timeline object line 2064:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 2066:", newTimeline);

    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery from SAGAMY and ASTRAPAY was unsuccessful, line 2069 ================================== ");

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery Failed";
    //                                 let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your savings account and wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 2084:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }

    //                                 throw new AppException({ message: `The recovery of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                             } else {
    //                                 // when recovery was successful, store investment recovery transaction id
    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                                 investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);

    //                                 investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                                 investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                                 investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                                 investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                                 payload = investment;
    //                                 // update the investment
    //                                 // TODO
    //                                 // change to service from API
    //                                 const headers = {
    //                                     "internalToken": ASTRAPAY_BEARER_TOKEN
    //                                 }
    //                                 const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                                 // amount: payloadAmount,
    //                                 // FAILED TO REPAY LOAN
    //                                 // console.log("The API response for investment update request line 1035: ", response);
    //                                 // debugger
    //                                 if (response && response.data.status === "FAILED") {
    //                                     console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                     // update timeline
    //                                     await trx.commit();
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery update failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered successfully but database update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount deducted so far: ${currencyCode} ${investment.amount_paid}`,
    //                                     };
    //                                     // console.log("Timeline object line 1070:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 1072:", newTimeline);
    //                                     console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)

    //                                 }
    //                                 // create and send a new timeline
    //                                 // console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount deducted so far: ${currencyCode} ${investment.amount_paid}`,
    //                                 };
    //                                 // console.log("Timeline object line 2349:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 2351:", newTimeline);
    //                                 // update investmentability status
    //                                 let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                                 // console.log("investmentability Status line 2354:", investmentabilityStatus);
    //                                 // @ts-ignore
    //                                 let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                                 let newRecommendation = recommendation + amount_approved;
    //                                 let newAmountInvestmentable = amountInvestmentable + amount_approved;
    //                                 // let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                                 let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                                 }
    //                                 let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_approved;
    //                                 let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_approved;
    //                                 investmentabilityStatus!.recommendation = newRecommendation;
    //                                 investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                                 investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                                 investmentabilityStatus!.lastInvestmentPerformanceRating = "40";
    //                                 // investmentabilityStatus!.lastInvestmentDuration = duration;
    //                                 let currentDate = new Date().toISOString()
    //                                 let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                                 // console.log("currentInvestmentDuration line 2629 ======================");
    //                                 // console.log(currentInvestmentDuration);
    //                                 investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;

    //                                 investmentabilityStatus!.isFirstInvestment = false;
    //                                 investmentabilityStatus!.isDefaulter = true;
    //                                 investmentabilityStatus!.lat = investment.lat;
    //                                 investmentabilityStatus!.lng = investment.lng;
    //                                 // Save
    //                                 investmentabilityStatus!.save()
    //                                 // update investment information
    //                                 investment.is_recovery_successful = true;
    //                                 investment.request_type = "repay_defaulted_investment";
    //                                 investment.date_recovery_was_done = DateTime.now();
    //                                 // TODO
    //                                 // save transaction Id
    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 //  save investmentRecoveryReference
    //                                 investment.investment_recovery_reference = investmentRecoveryReference;
    //                                 // on success, update investment status to completed if all the amount investment are recovered
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     investment.status = "completed";
    //                                     investment.is_payout_successful = true;
    //                                     investment.is_recovery_successful = true;
    //                                 }
    //                                 investment.label = "recovery";
    //                                 // Save
    //                                 let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 2079 :", currentInvestment);
    //                                 //    await currentInvestment!.save();
    //                                 // send for update
    //                                 await this.updateInvestment(currentInvestment, investment);
    //                                 // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                                 // console.log(" Current log, line 2083 :", updatedInvestment);
    //                                 // update investmentLog
    //                                 // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 2087 :", currentInvestmentLog);
    //                                 // send for update
    //                                 // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // console.log(" Current log, line 2090 :", updatedInvestmentLog);
    //                                 // TODO
    //                                 // Update Payout schedule record for this investment
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     payoutDetails.paid = true;
    //                                 }
    //                                 payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                                 payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                                 let payoutUpdatePayload = payoutDetails;
    //                                 let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                                 // console.log(" Updated payout schedule,line 1151 ", updatedPayoutDetails);
    //                                 // Create a new record in Repaid investment table
    //                                 // let { payout_date } = investment;
    //                                 // console.log(" Payout Date , line 1154", payout_date);
    //                                 // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                                 // console.log(" Payout Date in ISO format, line 1156", payoutDueDate);
    //                                 let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                                 let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                                 // console.log("hasExistingRepaidInvestment line 1158:");
    //                                 // console.log(hasExistingRepaidInvestment);

    //                                 let amountDue = total_amount_to_repay;
    //                                 let amountPaid = investment.amount_paid;
    //                                 let amountOutstanding = total_amount_to_repay - amountPaid;
    //                                 let paymentStatus = false;
    //                                 let payoutModel = "part";
    //                                 let amountRecoveredNow = Number(amount_to_be_deducted + interest_to_be_deducted);
    //                                 if (investment.total_amount_to_repay == amountRecoveredNow) {
    //                                     payoutModel = "full";
    //                                 }
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     paymentStatus = true;
    //                                 }
    //                                 if (!hasExistingRepaidInvestment) {
    //                                     let repaidInvestmentPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         payoutDueDate: investment.payout_date,
    //                                         paid: paymentStatus,
    //                                         transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                         transactionReference: investment.investment_recovery_reference,
    //                                         payoutScheduleId: updatedPayoutDetails!.id,
    //                                         amountDue: amountDue,
    //                                         amountPaid: amountPaid,
    //                                         amountOutstanding: amountOutstanding,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: "wallet",
    //                                         payoutModel: payoutModel,
    //                                     }
    //                                     await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // console.log("newRepaidInvestment line 1173:");
    //                                     // console.log(newRepaidInvestment);
    //                                 }
    //                                 if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                     let payoutDefaulterPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         payoutScheduleId: payoutDetails.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         totalAmountDue: investment.total_amount_to_repay,
    //                                         payoutDueDate: investment.payout_date,
    //                                         datePayoutWasEffected: DateTime.now(),
    //                                         paid: paymentStatus,
    //                                         transactionId: investmentRecovery.data.transxnId,
    //                                         transactionReference: investment.investment_recovery_reference,
    //                                         amountPaid: investment.amount_paid,
    //                                         amountOutstanding: investment.amount_outstanding,
    //                                         penalty,
    //                                         gracePeriod: gracePeriod.toString(),
    //                                         recoveredBy: "super admin",
    //                                         accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: "wallet",
    //                                         payoutModel: payoutModel,
    //                                     }
    //                                     await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // console.log("newPayoutDefaulter line 2476:");
    //                                     // console.log(newPayoutDefaulter);
    //                                 }

    //                                 // Commit update to Database
    //                                 await trx.commit()

    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount deducted so far: ${currencyCode} ${investment.amount_paid}`,
    //                                 };
    //                                 // console.log("Timeline object line 2775:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 2778:", newTimeline);

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery";
    //                                 let message = `
    //             ${investment.first_name} this is to inform you, that your over due investment of ${currencyCode} ${investment.amount_approved}, has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 2498:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }

    //                             }
    //                         }
    //                     } else if (payoutDetails.paid.toString() == "1" || payoutDetails.paid == true) {
    //                         console.log(`This investment with id: ${investment.id} has been paid. Response data for recovery in investment service, line 1659`)
    //                     }
    //                 }
    //             }
    //         }

    //         for (let index = 0; index < responseData.length; index++) {
    //             try {
    //                 const ainvestment = responseData[index];
    //                 await processInvestment(ainvestment);
    //                 investmentArray.push(ainvestment);
    //             } catch (error) {
    //                 console.log("Error line 2888:", error);
    //                 throw error;
    //             }
    //         }
    //         // commit changes to database
    //         await trx.commit();
    //         // console.log("Response data for payout in investment service, line 2914:", investmentArray)
    //         return investmentArray;
    //     } catch (error) {
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentForRecoveryByInvestmentId(id: string, loginAdminFullName?: string): Promise<Investment | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Login Admin Fullname, line 2140 ==================")
    //         console.log(loginAdminFullName)
    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         const payoutSchedulesService = new PayoutSchedulesServices();
    //         const payoutDefaultersService = new PayoutDefaultersServices();
    //         const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 578:", settings);
    //         if (!settings) {
    //             // throw Error(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         let { currencyCode, gracePeriod } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('id', id)
    //             .where('status', "default")
    //         // .forUpdate()

    //         // console.log("Line 2885 @ select Investment for recovery by investment Id: ", responseData)
    //         const ainvestment = responseData[0];
    //         // console.log(" A Investment ================================================== ")
    //         // console.log(ainvestment)
    //         if (!ainvestment) {
    //             console.log(`There is no defaulting investment or recovery has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `The investment with Id: ${id} is not defaulting or recovery has been completed. Please, check and try again.`, codeSt: "422" })
    //         }
    //         const processInvestment = async (investment) => {
    //             // console.log(" The current investment startDate, line 2126:", investment.startDate)

    //             let { id, created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, lng, lat, } = investment; //amount_outstanding_on_interest, amount_outstanding_on_investment,interest_due_on_investment,
    //             investment.checked_for_payment_at = DateTime.now();
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             // console.log("created_at at for the current investment line 513", investment.created_at);
    //             investment.start_date = DateTime.fromJSDate(start_date);
    //             // console.log("start_date at for the current investment line 568", investment.start_date);
    //             investment.payout_date = DateTime.fromJSDate(payout_date);
    //             // console.log("payout_date at for the current investment line 570", investment.payout_date);
    //             // TODO
    //             // Change startdate and duration to real variable and data
    //             let startDate = investment.start_date;
    //             // duration = Number(investment.duration);
    //             // Add search  by payout due date
    //             let payoutDueDate = investment.payout_date.toISODate();
    //             // console.log(" Amount Approved type is :", typeof amount_approved);
    //             // debugger
    //             let payoutDetails = await payoutSchedulesService.getPayoutScheduleByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndAmount(user_id, wallet_id, id, payoutDueDate, amount_approved);
    //             // console.log(" Payout details +++===========================+++++")
    //             // console.log(payoutDetails);

    //             // debugger
    //             if (!payoutDetails) {
    //                 throw new AppException({ message: `This investment does not have a payout schedule, please check your parameters and try again. Thank you.`, codeSt: "500" })
    //             }
    //             // console.log(payoutDetails!.paid.toString());
    //             // debugger
    //             // check if load has not been repaid
    //             if (payoutDetails.paid.toString() == "0" || payoutDetails.paid == false) {
    //                 let grace_period = Number(gracePeriod);
    //                 // TODO
    //                 // Return to real start date after test
    //                 // let startDate = DateTime.now().minus({ days: 5 }).toISO(); //start_date // DateTime.now().minus({ days: 5 }).toISO();
    //                 // console.log("Time investment was started line 870: ", startDate);
    //                 duration = Number(duration) + grace_period; // plus gracePeriod
    //                 // console.log("grace_period of investment line 871: ",typeof grace_period);
    //                 // console.log("Duration of investment line 872: ", typeof duration);
    //                 let startDateInMs = DateTime.now().minus({ days: grace_period }).toMillis()
    //                 // console.log("Time investment was started in ms line 873: ", startDateInMs);
    //                 let durationInMs = DateTime.now().minus({ days: duration }).toMillis()
    //                 // console.log("Time investment duration in ms line 875: ", durationInMs);
    //                 // let overDueDate = DateTime.now()

    //                 if (durationInMs > startDateInMs) {
    //                     console.log("Investment is overdue line 2950: ============================================================= ");
    //                 }
    //                 let timelineObject;
    //                 // let timeline;
    //                 let isOverDueForPayout = await dueForPayout(startDate, duration);
    //                 console.log("Is over due for payout status line 2377: =============================================");
    //                 console.log(isOverDueForPayout)
    //                 // debugger;
    //                 if (isOverDueForPayout == true && investment.status === 'default' && investment.is_payout_successful.toString() == "0") {
    //                     //  START
    //                     console.log(`Starting Investment Recovery process for investment with ID : ${investment.id}, line 2380 ===========================================`);
    //                     let payload = investment
    //                     let { customer_savings_account, id, amount_outstanding, amount_outstanding_on_investment, amount_outstanding_on_interest } = investment; //total_amount_to_repay,
    //                     // let penalty = (1 / 100) * Number(total_amount_to_repay);
    //                     let penalty = (1 / 100) * Number(amount_outstanding);
    //                     // console.log("Penalty line 2312:", penalty);
    //                     // console.log("Investment record over due for payout data line 2963:", payload);
    //                     // debugger;
    //                     // payload.investmentId = investmentId;
    //                     // console.log(" investment[0].status line 2871:", investment.status);
    //                     let investmentRecovery;
    //                     let amount_to_be_deducted;
    //                     let interest_to_be_deducted;
    //                     // let newTimeline;
    //                     // let typeName = investment.investment_type_name;
    //                     let typeId = investment.investment_type_id;
    //                     // New code update
    //                     // const investmentType = await typesService.getTypeByTypeName(typeName);
    //                     const investmentType = await typesService.getTypeByTypeId(typeId);
    //                     // console.log(" investmentType ==============================");
    //                     // console.log(investmentType);
    //                     if (!investmentType) {
    //                         // console.log(`Investment Type Named: ${typeName} does not exist.`)
    //                         // throw new AppException({ message: `Investment Type Named: ${typeName} does not exist.`, codeSt: "500" })
    //                         console.log(`Investment Type Id: ${typeId} does not exist.`)
    //                         throw new AppException({ message: `Investment Type Id: ${typeId} does not exist.`, codeSt: "500" })
    //                     }
    //                     // @ts-ignore

    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount,
    //                         interestOnInvestmentAccount, interestOnInvestmentWalletId, investmentRecoveryWalletId, } = investmentType;
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 944:", genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 2507: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 2341 :");
    //                     // console.log(investmentWallet);
    //                     const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 2344 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                             throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" })
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 2355: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 2356:", availableMainWalletBalance)
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 2359: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 2360:", availableInvestmentWalletBalance)
    //                     let investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                     let description = `The recovery of ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} from ${investment.first_name} ${currencyCode} ${amount_approved} over due investment, has been done successfully.`;
    //                     // Get the User Savings Account Balance
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(customer_savings_account);
    //                     // console.log(" Customer Account Balance =================================================")
    //                     // console.log(savingsAccountBalance);
    //                     // debugger;
    //                     let amountDeductable = Number(savingsAccountBalance) - Number(MINIMUM_BALANCE);
    //                     // let amountToBeDeducted = Number(amount_outstanding_on_investment) + Number(amount_outstanding_on_interest); // Number(amount_approved) + Number(interest_due_on_investment);
    //                     let subType;
    //                     // console.log("amountDeductable: ", amountDeductable);
    //                     // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     let hasExistingPayoutDefault = await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                     // console.log("hasExistingPayoutDefault line 2374:");
    //                     // console.log(hasExistingPayoutDefault);
    //                     let payoutMethod = "full";
    //                     if (amountDeductable > 0 || availableMainWalletBalance > 0) {
    //                         amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                         interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                         if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                             amount_to_be_deducted = amount_to_be_deducted + Number(interest_to_be_deducted - amount_outstanding_on_interest);
    //                             interest_to_be_deducted = amount_outstanding_on_interest;
    //                         }
    //                         if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                             amount_to_be_deducted = amount_outstanding_on_investment
    //                         }

    //                         // console.log("Amount to be deducted for recovery, line 2547:", amount_to_be_deducted);
    //                         // console.log("Interest to be deducted for recovery, line 2548:", interest_to_be_deducted);
    //                         subType = "sagamy";
    //                         investmentRecovery = await repayDueInvestment(investmentRecoveryReference, userInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, outstandingInvestmentWalletId, investmentPayoutAccount,
    //                             interestOnInvestmentAccount, customer_savings_account, description, lng, lat);
    //                         console.log("Investment Recovery transaction response");
    //                         console.log(investmentRecovery);

    //                         // NEW CODE START
    //                         if (investmentRecovery.status == 200) {
    //                             // if the transaction on SAGAMY was successful
    //                             let amountDue = investment.total_amount_to_repay;
    //                             let amountPaid = Number(amount_to_be_deducted + interest_to_be_deducted);//investment.amount_paid + 
    //                             let amountOutstanding;// = investment.total_amount_to_repay - amountPaid;
    //                             let recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                             let payoutMethod = "full";
    //                             if (amountPaid !== amountDue) {
    //                                 payoutMethod = "part"
    //                             }
    //                             if (hasExistingPayoutDefault !== null) {
    //                                 payoutMethod = "part"
    //                             }
    //                             let payoutDefaulterPayload;
    //                             // let newPayoutDefaulter;
    //                             // NEW CODE END

    //                             // NEW CODE FOR UPDATE START
    //                             // If Recovery was successful
    //                             // store investment recovery transaction id

    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             investment.investment_recovery_reference = investmentRecoveryReference;
    //                             investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);

    //                             investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                             investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                             investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                             investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                             payload = investment;
    //                             // update the investment
    //                             // TODO
    //                             // change to service from API
    //                             const headers = {
    //                                 "internalToken": ASTRAPAY_BEARER_TOKEN
    //                             }
    //                             const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                             // amount: payloadAmount,
    //                             // FAILED TO REPAY LOAN
    //                             console.log("The API response for investment update request line 2485: ", response);
    //                             // debugger
    //                             if (response && response.data.status === "FAILED") {
    //                                 console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                 // update timeline
    //                                 await trx.commit();
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery update failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered successfully but update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 2701:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 2703:", newTimeline);
    //                                 console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                 //  throw new AppException({ message: `The update of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                             }
    //                             // create and send a new timeline
    //                             console.log("Investment recovery successful, request status is OK");
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 2721:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 25272324:", newTimeline);
    //                             // update investmentability status
    //                             let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                             // console.log("investmentability Status line 2726:", investmentabilityStatus);
    //                             // @ts-ignore
    //                             let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                             let newRecommendation = recommendation + amount_to_be_deducted;
    //                             let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted;
    //                             let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                             }
    //                             let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted;
    //                             let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted;
    //                             investmentabilityStatus!.recommendation = newRecommendation;
    //                             investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                             investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                             investmentabilityStatus!.lastInvestmentPerformanceRating = "40";

    //                             let currentDate = new Date().toISOString()
    //                             let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                             console.log("currentInvestmentDuration line 2547 ======================");
    //                             console.log(currentInvestmentDuration);
    //                             investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;

    //                             investmentabilityStatus!.isFirstInvestment = false;
    //                             investmentabilityStatus!.isDefaulter = true;
    //                             investmentabilityStatus!.lat = investment.lat;
    //                             investmentabilityStatus!.lng = investment.lng;
    //                             // Save
    //                             investmentabilityStatus!.save()
    //                             // update investment information
    //                             investment.request_type = "repay_defaulted_investment";
    //                             investment.date_recovery_was_done = DateTime.now();

    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             //  save investmentRecoveryReference
    //                             investment.investment_recovery_reference = investmentRecoveryReference;
    //                             // on success, update investment status to completed if all the amount investment are recovered
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 investment.status = "completed";
    //                                 investment.is_payout_successful = true;
    //                                 investment.is_recovery_successful = true;
    //                             }
    //                             investment.label = "recovery";
    //                             // Save
    //                             let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                             // console.log(" Current log, line 2774 :", currentInvestment);
    //                             // send for update
    //                             await this.updateInvestment(currentInvestment, investment);
    //                             // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                             // console.log(" Current log, line 2777 :", updatedInvestment);
    //                             // update investmentLog
    //                             // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                             // console.log(" Current log, line 2780 :", currentInvestmentLog);
    //                             // send for update
    //                             // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // console.log(" Current log, line 2783 :", updatedInvestmentLog);
    //                             // Update Payout schedule record for this investment
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 payoutDetails.paid = true;
    //                             }
    //                             payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                             payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                             let payoutUpdatePayload = payoutDetails;
    //                             let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                             // console.log(" Updated payout schedule,line 2792 ", updatedPayoutDetails);
    //                             // Create a new record in Repaid investment table
    //                             // let { payout_date } = investment;
    //                             // console.log(" Payout Date , line 2795", payout_date);
    //                             // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                             // console.log(" Payout Date in ISO format, line 2797", payoutDueDate);
    //                             let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                             let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                             // console.log("hasExistingRepaidInvestment line 2800:");
    //                             // console.log(hasExistingRepaidInvestment);
    //                             // debugger
    //                             amountDue = investment.total_amount_to_repay;
    //                             amountPaid = Number(amount_to_be_deducted + interest_to_be_deducted);//investment.amount_paid;
    //                             amountOutstanding = investment.amount_outstanding; //- amountPaid;
    //                             recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                             let paymentStatus = false;
    //                             payoutMethod = "full";
    //                             if (amountPaid !== amountDue || hasExistingPayoutDefault !== null) {
    //                                 payoutMethod = "part"
    //                             }
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 paymentStatus = true;
    //                             }
    //                             if (!hasExistingRepaidInvestment) {
    //                                 let repaidInvestmentPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     payoutDueDate: investment.payout_date,
    //                                     paid: paymentStatus,
    //                                     transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                     transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                     payoutScheduleId: updatedPayoutDetails!.id,
    //                                     amountDue: amountDue,
    //                                     amountPaid: amountPaid,
    //                                     amountOutstanding: amountOutstanding,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: subType,
    //                                     payoutModel: payoutMethod, //"full",
    //                                 }
    //                                 await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // console.log("newRepaidInvestment line 2836:");
    //                                 // console.log(newRepaidInvestment);
    //                             } else if (hasExistingRepaidInvestment) {
    //                                 let repaidInvestmentPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     payoutDueDate: investment.payout_date,
    //                                     paid: paymentStatus,
    //                                     transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                     transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                     payoutScheduleId: updatedPayoutDetails!.id,
    //                                     amountDue: amountDue,
    //                                     amountPaid: investment.amount_paid, //hasExistingRepaidInvestment.amountPaid +
    //                                     amountOutstanding: amountOutstanding,// investment.amount_outstanding ,//amountOutstanding,// hasExistingRepaidInvestment.amountOutstanding - amountPaid,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: subType,
    //                                     payoutModel: payoutMethod,// "part",//  //"full",
    //                                 }
    //                                 // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                 // let updateRepaidInvestment = await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                 // console.log("updateRepaidInvestment line 2860:");
    //                                 // console.log(updateRepaidInvestment);
    //                             }
    //                             // Commit update to Database
    //                             await trx.commit()

    //                             // FOR MULTIPLE RECOVERY PAYMENT RECORD
    //                             payoutDefaulterPayload = {
    //                                 walletId: wallet_id,
    //                                 userId: user_id,
    //                                 investmentId: investment.id,
    //                                 payoutScheduleId: payoutDetails.id,
    //                                 amount: investment.amount_approved,
    //                                 interest: investment.interest_due_on_investment,
    //                                 totalAmountDue: investment.total_amount_to_repay,
    //                                 payoutDueDate: investment.payout_date,
    //                                 datePayoutWasEffected: DateTime.now(),
    //                                 paid: paymentStatus,
    //                                 transactionId: investmentRecovery.data.transxnId,
    //                                 transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                 amountPaid: amountPaid,//investment.amount_paid,
    //                                 amountOutstanding: investment.amount_outstanding,
    //                                 penalty,
    //                                 gracePeriod: gracePeriod.toString(),
    //                                 recoveredBy: recoveredBy, //"super admin", // loginAdminFullName
    //                                 accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                 label: "recovery",
    //                                 type: "automated",
    //                                 subType: subType, // "sagamy",
    //                                 payoutModel: payoutMethod, // "part",
    //                             }
    //                             await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                             // newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                             // console.log("newPayoutDefaulter line 2892:");
    //                             // console.log(newPayoutDefaulter);

    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment payout is over due",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name} your investment of ${currencyCode} ${investment.total_amount_to_repay} is over due for payout/recovery.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 2907:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 2909:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment recovery successful, request status is OK");
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name},  ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 2925:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 2927:", newTimeline);

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Recovery";
    //                             let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved}, has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 2941:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }
    //                         }

    //                         // NEW CODE FOR UPDATE END
    //                     } else {
    //                         // Failed to Recover Investment from SAGAMY 
    //                         investmentRecovery = { status: 422 };
    //                         // console.log(" Current Investment status Line 2954:", investmentRecovery.status)
    //                         // Send Notification and update timeline, for failed from SAGAMY Savings Account
    //                         // update timeline
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment recovery from savings account failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your savings account has failed. Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                         };
    //                         // console.log("Timeline object line 2968:", timelineObject);
    //                         await timelineService.createTimeline(timelineObject);
    //                         // newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 2970:", newTimeline);

    //                         // create and send a new timeline
    //                         console.log("Investment recovery from SAGAMY was unsuccessful, line 2935 ================================== ");

    //                         // Send Details to notification service
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Recovery Failed";
    //                         let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your savings account has failed. 

    //            Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 2989:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             console.log(newNotificationMessage);
    //                         }
    //                     }
    //                     // Change status code to number
    //                     // @ts-ignore
    //                     let investmentRecoveryFromMainWallet;
    //                     if (investmentRecovery.status != undefined && investmentRecovery.status != 200 || investment.amount_outstanding_on_investment > 0 || investment.amount_outstanding_on_interest > 0) {
    //                         // TRY Recovery from users main wallet
    //                         // Debit the  User wallet with the interest on investment
    //                         try {
    //                             investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                             // debugger;
    //                             // Get User Wallet Balance : availableMainWalletBalance
    //                             amountDeductable = Number(availableMainWalletBalance) - Number(MINIMUM_BALANCE);
    //                             // amountToBeDeducted = Number(investment.amount_outstanding_on_investment) + Number(investment.amount_outstanding_on_interest) //Number(amount_approved) + Number(interest_due_on_investment);
    //                             // console.log("amountDeductable: ", amountDeductable);
    //                             // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                             if (amountDeductable <= 0) {
    //                                 // if the balance is less than or equal to 0
    //                                 console.log("The wallet balance is too low , line 3012 ==================")
    //                                 console.log(amountDeductable)
    //                                 await trx.commit();
    //                                 // TODO
    //                                 // Send notification to customer
    //                                 // Send Notification and update timeline, for failed from ASTRAPAY
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery from wallet failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your wallet has failed. Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                 };
    //                                 // console.log("Timeline object line 3030:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 3032:", newTimeline);

    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery from ASTRAPAY was unsuccessful, line 1914 ================================== ");

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery Failed";
    //                                 let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 3050:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }
    //                                 await trx.commit();
    //                                 throw new AppException({ message: `There was an error debiting the user wallet, the available balance of  ${currencyCode} ${availableMainWalletBalance} is insufficient for the recovery of the outstanding amount of ${currencyCode} ${investment.amount_outstanding} , please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)} and try again.`, codeSt: `${417}` })
    //                             } else if (amountDeductable > 0) {
    //                                 amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                                 interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                                 if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                                     amount_to_be_deducted = amount_to_be_deducted + Number(interest_to_be_deducted - amount_outstanding_on_interest);
    //                                     interest_to_be_deducted = amount_outstanding_on_interest;
    //                                 }
    //                                 if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                                     amount_to_be_deducted = amount_outstanding_on_investment
    //                                 }
    //                             }
    //                             // console.log("Amount to be deducted for recovery, line 3070:", amount_to_be_deducted);
    //                             // console.log("Interest to be deducted for recovery, line 3071:", interest_to_be_deducted);
    //                             subType = "astrapay";
    //                             investmentRecovery = await recoverInvestmentFromUserMainWallet(investmentRecoveryReference, userInvestmentWalletId, userMainWalletId, outstandingInvestmentWalletId, investmentRecoveryWalletId,
    //                                 interestOnInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, description, lng, lat);
    //                             outstandingInvestmentWalletId
    //                             // console.log("Investment Recovery from Main Wallet transaction response");
    //                             // console.log(investmentRecovery);
    //                             if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') {
    //                                 investmentRecoveryFromMainWallet = "FAILED";
    //                                 let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                 console.log("statusCode line 3044:", statusCode);
    //                                 let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                 console.log("statusCodeExtension line 3046:", statusCodeExtension);
    //                                 console.log(" Investment recovery exceptional error message, line 3084 ==================================")
    //                                 console.log(investmentRecovery.message);
    //                                 // Send Notification & update timeline for failed investment recovery from Main Wallet
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery from wallet failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your wallet has failed. Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                 };
    //                                 // console.log("Timeline object line 3099:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 3101:", newTimeline);

    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery from ASTRAPAY Wallet was unsuccessful, line 3104 ================================== ");

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery Failed";
    //                                 let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 3119:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }
    //                                 throw new AppException({ message: `The recovery of the Laon with ID: ${id} from user's wallet was not successful. There was an error debiting the user wallet, please try again. ${investmentRecovery.message}. Thank you.`, codeSt: `${statusCode}` })
    //                             } else if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage == 'Duplicate batch payment id') {
    //                                 investmentRecoveryFromMainWallet = "OK";
    //                                 let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                 console.log("statusCode line 3130:", statusCode);
    //                                 let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                 console.log("statusCodeExtension line 3132:", statusCodeExtension);
    //                                 let recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                                 if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                     let payoutDefaulterPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         payoutScheduleId: payoutDetails.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         totalAmountDue: investment.total_amount_to_repay,
    //                                         payoutDueDate: investment.payout_date,
    //                                         datePayoutWasEffected: DateTime.now(),
    //                                         paid: false,
    //                                         transactionId: investmentRecovery.data.transxnId,
    //                                         transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                         amountPaid: investment.amount_paid,
    //                                         amountOutstanding: investment.amount_outstanding,
    //                                         penalty,
    //                                         gracePeriod: gracePeriod.toString(),
    //                                         recoveredBy: recoveredBy, //"super admin",
    //                                         accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: subType,
    //                                         payoutModel: payoutMethod, //"part",
    //                                     }
    //                                     await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // console.log("newPayoutDefaulter line 3161:");
    //                                     // console.log(newPayoutDefaulter);
    //                                 }
    //                                 trx.commit();
    //                                 throw new AppException({ message: `There was an error debiting the user's wallet, please try again. ${investmentRecovery.message}`, codeSt: `${statusCode}` })
    //                             } else if (investmentRecovery.status == 200 && investmentRecovery.errorMessage == null || investmentRecovery.status == 200 && investmentRecovery.errorMessage == undefined) {
    //                                 investmentRecoveryFromMainWallet = "OK";
    //                                 // if the transaction on SAGAMY was successful
    //                                 let amountDue = investment.total_amount_to_repay;
    //                                 let amountPaid = Number(amount_to_be_deducted + interest_to_be_deducted);//investment.amount_paid + 
    //                                 let amountOutstanding;
    //                                 let recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                                 let payoutMethod = "full";
    //                                 if (amountPaid !== amountDue || hasExistingPayoutDefault !== null) {
    //                                     payoutMethod = "part"
    //                                 }

    //                                 let payoutDefaulterPayload;
    //                                 // let newPayoutDefaulter;
    //                                 // If Recovery was successful
    //                                 // store investment recovery transaction id
    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 investment.investment_recovery_reference = investmentRecoveryReference;
    //                                 investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                                 investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);

    //                                 investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                                 investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                                 investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                                 investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                                 payload = investment;
    //                                 // update the investment
    //                                 // TODO
    //                                 // change to service from API
    //                                 const headers = {
    //                                     "internalToken": ASTRAPAY_BEARER_TOKEN
    //                                 }
    //                                 const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                                 // amount: payloadAmount,
    //                                 // FAILED TO REPAY LOAN
    //                                 console.log("The API response for investment update request line 3203: ", response);
    //                                 // debugger
    //                                 if (response && response.data.status === "FAILED") {
    //                                     console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                     // update timeline
    //                                     await trx.commit();
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery update failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.amount_approved} has been recovered successfully but update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                     };
    //                                     // console.log("Timeline object line 3220:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 3222:", newTimeline);
    //                                     console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                     //  throw new AppException({ message: `The update of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                                 }
    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 3240:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 3242:", newTimeline);
    //                                 // update investmentability status
    //                                 let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                                 // console.log("investmentability Status line 3245:", investmentabilityStatus);
    //                                 // @ts-ignore
    //                                 let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                                 let newRecommendation = recommendation + amount_to_be_deducted;
    //                                 let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted;
    //                                 let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                                 }
    //                                 let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted;
    //                                 let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted;
    //                                 investmentabilityStatus!.recommendation = newRecommendation;
    //                                 investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                                 investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                                 investmentabilityStatus!.lastInvestmentPerformanceRating = "40";

    //                                 let currentDate = new Date().toISOString()
    //                                 let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                                 console.log("currentInvestmentDuration line 3265 ======================");
    //                                 console.log(currentInvestmentDuration);
    //                                 investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;

    //                                 investmentabilityStatus!.isFirstInvestment = false;
    //                                 investmentabilityStatus!.isDefaulter = true;
    //                                 investmentabilityStatus!.lat = investment.lat;
    //                                 investmentabilityStatus!.lng = investment.lng;
    //                                 // Save
    //                                 investmentabilityStatus!.save()

    //                                 investment.request_type = "repay_defaulted_investment";
    //                                 investment.date_recovery_was_done = DateTime.now();

    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 //  save investmentRecoveryReference
    //                                 investment.investment_recovery_reference = investmentRecoveryReference;
    //                                 // on success, update investment status to completed if all the amount investment are recovered
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     investment.status = "completed";
    //                                     investment.is_payout_successful = true;
    //                                     investment.is_recovery_successful = true;
    //                                 }
    //                                 investment.label = "recovery";
    //                                 // Save
    //                                 let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 3293 :", currentInvestment);
    //                                 // send for update
    //                                 await this.updateInvestment(currentInvestment, investment);
    //                                 // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                                 // console.log(" Current log, line 3296 :", updatedInvestment);
    //                                 // update investmentLog
    //                                 // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 3299 :", currentInvestmentLog);
    //                                 // send for update
    //                                 // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // console.log(" Current log, line 3302 :", updatedInvestmentLog);
    //                                 // Update Payout schedule record for this investment
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     payoutDetails.paid = true;
    //                                 }
    //                                 payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                                 payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                                 let payoutUpdatePayload = payoutDetails;
    //                                 let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                                 // console.log(" Updated payout schedule,line 3311 ", updatedPayoutDetails);
    //                                 // Create a new record in Repaid investment table
    //                                 // let { payout_date } = investment;
    //                                 // console.log(" Payout Date , line 3314", payout_date);
    //                                 // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                                 // console.log(" Payout Date in ISO format, line 3316", payoutDueDate);
    //                                 let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                                 let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                                 // console.log("hasExistingRepaidInvestment line 3016:");
    //                                 // console.log(hasExistingRepaidInvestment);
    //                                 // debugger
    //                                 amountDue = investment.total_amount_to_repay;
    //                                 amountPaid = Number(amount_to_be_deducted + interest_to_be_deducted);//investment.amount_paid;
    //                                 amountOutstanding = investment.amount_outstanding;
    //                                 recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                                 let paymentStatus = false;
    //                                 payoutMethod = "full";
    //                                 if (amountPaid !== amountDue || hasExistingPayoutDefault !== null) {
    //                                     payoutMethod = "part"
    //                                 }
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     paymentStatus = true;
    //                                 }
    //                                 if (!hasExistingRepaidInvestment) {
    //                                     let repaidInvestmentPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         payoutDueDate: investment.payout_date,
    //                                         paid: paymentStatus,
    //                                         transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                         transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                         payoutScheduleId: updatedPayoutDetails!.id,
    //                                         amountDue: amountDue,
    //                                         amountPaid: amountPaid,
    //                                         amountOutstanding: amountOutstanding,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: subType,
    //                                         payoutModel: payoutMethod, //"full",
    //                                     }
    //                                     await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // console.log("newRepaidInvestment line 3355:");
    //                                     // console.log(newRepaidInvestment);
    //                                 } else if (hasExistingRepaidInvestment) {
    //                                     let repaidInvestmentPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         payoutDueDate: investment.payout_date,
    //                                         paid: paymentStatus,
    //                                         transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                         transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                         payoutScheduleId: updatedPayoutDetails!.id,
    //                                         amountDue: amountDue,
    //                                         amountPaid: investment.amount_paid, //hasExistingRepaidInvestment.amountPaid +
    //                                         amountOutstanding: amountOutstanding,// investment.amount_outstanding ,//amountOutstanding,// hasExistingRepaidInvestment.amountOutstanding - amountPaid,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: subType,
    //                                         payoutModel: payoutMethod,// "part",//  //"full",
    //                                     }
    //                                     // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                     // let updateRepaidInvestment = await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                     // console.log("updateRepaidInvestment line 3379:");
    //                                     // console.log(updateRepaidInvestment);
    //                                 }
    //                                 // Commit update to Database
    //                                 await trx.commit()

    //                                 // FOR MULTIPLE RECOVERY PAYMENT RECORD
    //                                 // if (hasExistingPayoutDefault !== null) {
    //                                 //   payoutMethod = "part"
    //                                 // }
    //                                 payoutDefaulterPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     payoutScheduleId: payoutDetails.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     totalAmountDue: investment.total_amount_to_repay,
    //                                     payoutDueDate: investment.payout_date,
    //                                     datePayoutWasEffected: DateTime.now(),
    //                                     paid: true,
    //                                     transactionId: investmentRecovery.data.transxnId,
    //                                     transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                     amountPaid: amountPaid,//investment.amount_paid,
    //                                     amountOutstanding: investment.amount_outstanding,
    //                                     penalty,
    //                                     gracePeriod: gracePeriod.toString(),
    //                                     recoveredBy: recoveredBy, //"super admin", // loginAdminFullName
    //                                     accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: subType, // "sagamy",
    //                                     payoutModel: payoutMethod, // "part",
    //                                 }
    //                                 await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                 // newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                 // console.log("newPayoutDefaulter line 3414:");
    //                                 // console.log(newPayoutDefaulter);

    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment payout is over due",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name} your investment of ${currencyCode} ${investment.total_amount_to_repay} is over due for payout/recovery.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 3429:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 3431:", newTimeline);

    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 3447:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 3449:", newTimeline);

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery";
    //                                 let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay}, has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 3463:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }

    //                             }

    //                         } catch (error) {
    //                             console.error(error.message);
    //                             throw error;
    //                         }
    //                         // debugger
    //                     }
    //                 }
    //             } else if (payoutDetails.paid.toString() == "1" || payoutDetails.paid == true) {
    //                 console.log(`This investment with id: ${investment.id} has been paid. Response data for recovery in investment service, line 3266`)
    //             }
    //         }

    //         await processInvestment(ainvestment)
    //         // commit changes to database
    //         await trx.commit();
    //         return ainvestment;
    //     } catch (error) {
    //         console.log(" Line 3490: errrrrrrrrrooooooooooooooooooooooooooooooo ")
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentForManualRecoveryByInvestmentId(id: string, amount: string, manualRecoverySubType: string, dateRecoveryWasMade: Date, recoveredByWho: string, accountRecoveryWasPaidTo: string, loginAdminFullName?: string): Promise<Investment | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Login Admin Fullname, line 2903 ==================")
    //         console.log(loginAdminFullName)
    //         console.log("amount, line 2905 ==================")
    //         console.log(amount)
    //         console.log("manualRecoverySubType, line 2907 ==================")
    //         console.log(manualRecoverySubType)
    //         console.log("dateRecoveryWasMade, line 2909 ==================")
    //         console.log(dateRecoveryWasMade)
    //         console.log("dateRecoveryWasMade in DateTime format, line 2911 ==================")
    //         // @ts-ignore
    //         dateRecoveryWasMade = DateTime.fromISO(dateRecoveryWasMade);
    //         console.log(dateRecoveryWasMade)
    //         console.log("recoveredByWho, line 2915 ==================")
    //         console.log(recoveredByWho)
    //         console.log("accountRecoveryWasPaidTo, line 2917 ==================")
    //         console.log(accountRecoveryWasPaidTo)

    //         // console.log("Login Admin Fullname, line 2920 ==================")
    //         // console.log(loginAdminFullName)
    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         const payoutSchedulesService = new PayoutSchedulesServices();
    //         const payoutDefaultersService = new PayoutDefaultersServices();
    //         const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 2932:", settings);
    //         if (!settings) {
    //             // throw Error(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         let { currencyCode, gracePeriod } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('id', id)
    //             .where('status', "default")
    //         // .forUpdate()

    //         // console.log("Line 2947 @ select Investment for recovery by investment Id: ", responseData)
    //         const ainvestment = responseData[0];
    //         // console.log(" A Investment ================================================== ")
    //         // console.log(ainvestment)
    //         if (!ainvestment) {
    //             console.log(`There is no defaulting investment or recovery has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `The investment with Id: ${id} is not defaulting or recovery has been completed. Please, check and try again.`, codeSt: "422" })
    //         }
    //         const processInvestment = async (investment) => {
    //             // console.log(" The current investment startDate, line 2956:", investment.startDate)
    //             let amountRecovered = amount;
    //             let { id, created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, lng, lat, } = investment; //interest_due_on_investment,
    //             investment.checked_for_payment_at = DateTime.now();
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             // console.log("created_at at for the current investment line 2961", investment.created_at);
    //             investment.start_date = DateTime.fromJSDate(start_date);
    //             // console.log("start_date at for the current investment line 2963", investment.start_date);
    //             investment.payout_date = DateTime.fromJSDate(payout_date);
    //             // console.log("payout_date at for the current investment line 2965", investment.payout_date);
    //             // Add search  by payout due date
    //             let payoutDueDate = investment.payout_date.toISODate();
    //             // console.log(" Amount Approved type is :", typeof amount_approved);
    //             let payoutDetails = await payoutSchedulesService.getPayoutScheduleByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndAmount(user_id, wallet_id, id, payoutDueDate, amount_approved);
    //             // console.log(" Payout details +++===========================+++++")
    //             // console.log(payoutDetails);
    //             if (!payoutDetails) {
    //                 throw new AppException({ message: `This investment does not have a payout schedule, please check your parameters and try again. Thank you.`, codeSt: "500" })
    //             }
    //             // console.log(payoutDetails!.paid.toString());
    //             // debugger
    //             // check if load has not been repaid
    //             if (payoutDetails.paid.toString() == "0" || payoutDetails.paid == false) {
    //                 let grace_period = Number(gracePeriod);

    //                 let startDate = investment.start_date; //DateTime.now().minus({ days: 5 }).toISO(); //start_date // DateTime.now().minus({ days: 5 }).toISO();
    //                 // console.log("Time investment was started line 2987: ", startDate);
    //                 duration = Number(duration) + grace_period; // plus gracePeriod
    //                 // console.log("grace_period of investment line 2989: ",typeof grace_period);
    //                 // console.log("Duration of investment line 2990: ", typeof duration);
    //                 let startDateInMs = DateTime.now().minus({ days: grace_period }).toMillis()
    //                 // console.log("Time investment was started in ms line 2992: ", startDateInMs);
    //                 let durationInMs = DateTime.now().minus({ days: duration }).toMillis()
    //                 // console.log("Time investment duration in ms line 2994: ", durationInMs);
    //                 // let overDueDate = DateTime.now()

    //                 if (durationInMs > startDateInMs) {
    //                     console.log("Investment is overdue line 2998: ============================================================= ");
    //                 }
    //                 let timelineObject;
    //                 // let timeline;
    //                 let isOverDueForPayout = await dueForPayout(startDate, duration);
    //                 console.log("Is due for recovery status line 3295 ===========================");
    //                 console.log(isOverDueForPayout)
    //                 if (isOverDueForPayout == true && investment.status === 'default' && investment.is_payout_successful.toString() == "0") {
    //                     //  START
    //                     console.log(`Starting Investment Recovery process for investment with ID : ${investment.id}, line 1550 ===========================================`);
    //                     // @ts-ignore
    //                     let payload = investment
    //                     let { customer_savings_account, id, amount_outstanding, amount_outstanding_on_interest, amount_outstanding_on_investment } = investment; //total_amount_to_repay
    //                     let penalty = (1 / 100) * Number(amount_outstanding); // or (1 / 100) * Number(total_amount_to_repay);
    //                     // console.log("Penalty line 3010:", penalty);
    //                     // console.log("Investment record over due for payout data line 3011:", payload);
    //                     // payload.investmentId = investmentId;
    //                     // console.log(" investment[0].status line 3013:", investment.status);
    //                     let investmentRecovery;
    //                     let amount_to_be_deducted;
    //                     let interest_to_be_deducted;
    //                     // let newTimeline;
    //                     // let typeName = investment.investment_type_name;
    //                     let typeId = investment.investment_type_id;
    //                     // New code update
    //                     // const investmentType = await typesService.getTypeByTypeName(typeName);
    //                     const investmentType = await typesService.getTypeByTypeId(typeId);
    //                     // console.log(" investmentType ==============================");
    //                     // console.log(investmentType);
    //                     if (!investmentType) {
    //                         // console.log(`Investment Type Named: ${typeName} does not exist.`)
    //                         // throw new AppException({ message: `Investment Type Named: ${typeName} does not exist.`, codeSt: "500" })
    //                         console.log(`Investment Type Id: ${typeId} does not exist.`);
    //                         throw new AppException({ message: `Investment Type Id: ${typeId} does not exist.`, codeSt: "500" });
    //                     }
    //                     // @ts-ignore
    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount, interestOnInvestmentAccount, } = investmentType;
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 3031:", genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 3033: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 3037 :");
    //                     // console.log(investmentWallet);
    //                     const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 3040 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                             throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" })
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     // let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 3051: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 3052:", availableMainWalletBalance)
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 3055: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 3056:", availableInvestmentWalletBalance)
    //                     let investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                     let description = `Recovery of ${investment.first_name} ${currencyCode} ${amount_approved} over due investment, has been done successfully.`;
    //                     // Get the User Savings Account Balance
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(customer_savings_account);
    //                     // console.log(" Customer Account Balance =================================================")
    //                     console.log(savingsAccountBalance);
    //                     let subType;
    //                     let hasExistingPayoutDefault = await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                     // console.log("hasExistingPayoutDefault line 3065:");
    //                     // console.log(hasExistingPayoutDefault);
    //                     let payoutMethod = "full";
    //                     let recoveredBy = recoveredByWho !== undefined ? recoveredByWho : loginAdminFullName;
    //                     if (Number(amountRecovered) > 0) {
    //                         try {
    //                             investment.amount_paid = investment.amount_paid + Number(amountRecovered); //  Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             investment.amount_outstanding = investment.amount_outstanding - Number(amountRecovered); //Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountRecovered);
    //                             interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountRecovered);
    //                             if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                                 amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - amount_outstanding_on_interest);
    //                                 interest_to_be_deducted = amount_outstanding_on_interest;
    //                             }
    //                             if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                                 amount_to_be_deducted = amount_outstanding_on_investment
    //                             }

    //                             subType = manualRecoverySubType;
    //                             // investmentRecoveryReference, investmentWallet, outstandingInvestmentWallet, amountApproved,  description, lng, lat
    //                             // investmentRecovery = await manualInvestmentRecoveryFromUser(investmentRecoveryReference, userInvestmentWalletId, outstandingInvestmentWalletId, amount_to_be_deducted, description, lng, lat);
    //                             outstandingInvestmentWalletId
    //                             // console.log("Investment Recovery from Main Wallet transaction response");
    //                             // console.log(investmentRecovery);
    //                             if (investmentRecovery.status === "FAILED TO POST MANUAL RECOVERY DATA" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') {
    //                                 // investmentRecoveryFromMainWallet = "FAILED";
    //                                 let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                 console.log("statusCode line 3082:", statusCode);
    //                                 let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                 console.log("statusCodeExtension line 3084:", statusCodeExtension);
    //                                 console.log(`The manual recovery update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                 throw new AppException({ message: `There was an error updating the Investment with ID: ${id} records, please try again. ${investmentRecovery.message}`, codeSt: `${statusCode}` })
    //                             } else if (investmentRecovery.status === "FAILED TO POST MANUAL RECOVERY DATA" && investmentRecovery.errorMessage == 'Duplicate batch payment id') {
    //                                 // investmentRecoveryFromMainWallet = "OK";
    //                                 let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                 console.log("statusCode line 3090:", statusCode);
    //                                 let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                 console.log("statusCodeExtension line 3092:", statusCodeExtension);
    //                                 console.log(` Manual Investment Recovery Line 3093: There was an error updating the user wallet and records, please try again. ${investmentRecovery.message}, ${investmentRecovery.errorMessage}`)
    //                                 throw new AppException({ message: `There was an error updating the user wallet and records, please try again. ${investmentRecovery.message}`, codeSt: `${statusCode}` })
    //                             }
    //                         } catch (error) {
    //                             console.error(error.message);
    //                             throw error;
    //                         }
    //                     }
    //                     investment.investment_recovery_reference = investmentRecoveryReference;
    //                     if (investmentRecovery.data.transxnId) {
    //                         investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                     }

    //                     investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                     investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                     investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                     investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                     payload = investment;
    //                     // update the investment
    //                     // change to service from API
    //                     // const headers = {
    //                     //   "internalToken": ASTRAPAY_BEARER_TOKEN
    //                     // }
    //                     // const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                     // // amount: payloadAmount,
    //                     // // FAILED TO REPAY LOAN
    //                     // console.log("The API response for investment update request line 3134: ", response);
    //                     // debugger

    //                     // Save
    //                     let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                     // console.log(" Current log, line 3139 :", currentInvestment);
    //                     //    await currentInvestment!.save();
    //                     // send for update
    //                     let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                     // console.log(" Current log, line 3143 :", updatedInvestment);
    //                     // update investmentLog
    //                     // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 3146 :", currentInvestmentLog);
    //                     // send for update
    //                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // console.log(" Current log, line 3149 :", updatedInvestmentLog);

    //                     // if (response && response.data.status === "FAILED") {
    //                     if (!updatedInvestment) {
    //                         console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                         // update timeline
    //                         await trx.commit();
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment recovery update failed",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name},${currencyCode} ${amountRecovered} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered successfully but update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 3167:", timelineObject);
    //                         await timelineService.createTimeline(timelineObject);
    //                         // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 3169:", newTimeline);
    //                         console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                         //  throw new AppException({ message: `The update of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                     }
    //                     // create and send a new timeline
    //                     console.log("Investment recovery successful, request status is OK");
    //                     // update investmentability status
    //                     let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                     // console.log("investmentability Status line 3177:", investmentabilityStatus);
    //                     // @ts-ignore
    //                     let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                     let newRecommendation = recommendation + amount_to_be_deducted; // amount_approved;
    //                     let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted; // amount_approved;

    //                     let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted; // amount_approved;
    //                     let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted; // amount_approved;
    //                     investmentabilityStatus!.recommendation = newRecommendation;
    //                     investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                     if (investment.amount_paid == investment.total_amount_to_repay || investment.amount_outstanding <= 0) {
    //                         let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                         investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                     }
    //                     investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                     investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                     investmentabilityStatus!.lastInvestmentPerformanceRating = "40";

    //                     // investmentabilityStatus!.lastInvestmentDuration = duration;
    //                     let currentDate = new Date().toISOString()
    //                     let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                     console.log("currentInvestmentDuration line 3223 ======================");
    //                     console.log(currentInvestmentDuration);
    //                     investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();

    //                     investmentabilityStatus!.isFirstInvestment = false;
    //                     investmentabilityStatus!.isDefaulter = true;
    //                     investmentabilityStatus!.lat = investment.lat;
    //                     investmentabilityStatus!.lng = investment.lng;
    //                     // Save
    //                     investmentabilityStatus!.save()
    //                     // update investment information
    //                     investment.is_recovery_successful = true;
    //                     investment.request_type = "repay_defaulted_investment";
    //                     investment.date_recovery_was_done = DateTime.now();

    //                     // save transaction Id
    //                     if (investmentRecovery.data.transxnId) {
    //                         investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                     }
    //                     //  save investmentRecoveryReference
    //                     investment.investment_recovery_reference = investmentRecoveryReference;
    //                     // on success, update investment status to completed if all the amount investment are recovered
    //                     if (investment.amount_paid == investment.total_amount_to_repay || investment.amount_outstanding <= 0) {
    //                         investment.status = "completed";
    //                         investment.is_payout_successful = true;
    //                         investment.is_recovery_successful = true;
    //                     }
    //                     investment.label = "recovery";
    //                     investment.date_recovery_was_done = dateRecoveryWasMade;
    //                     // Save
    //                     currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                     // console.log(" Current log, line 3254 :", currentInvestment);

    //                     // send for update
    //                     updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                     // console.log(" Current log, line 3258 :", updatedInvestment);
    //                     // update investmentLog
    //                     // currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                     // console.log(" Current log, line 3261 :", currentInvestmentLog);
    //                     // send for update
    //                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                     // console.log(" Current log, line 3264 :", updatedInvestmentLog);

    //                     // TODO
    //                     // Update Payout schedule record for this investment
    //                     if (investment.amount_paid == investment.total_amount_to_repay || investment.amount_outstanding <= 0) {
    //                         payoutDetails.paid = true;
    //                     }
    //                     let amountDue = investment.total_amount_to_repay;
    //                     let amountPaid = investment.amount_paid;
    //                     let amountOutstanding = investment.total_amount_to_repay - amountPaid;
    //                     // let recoveredBy = loginAdminFullName !== undefined ? loginAdminFullName : "Super Admin";
    //                     let paymentStatus = false;
    //                     if (amountPaid !== amountDue || hasExistingPayoutDefault !== null) {
    //                         payoutMethod = "part"
    //                     }
    //                     payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                     payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                     payoutDetails.type = "manual";
    //                     payoutDetails.subType = manualRecoverySubType;
    //                     payoutDetails.payoutModel = payoutMethod;
    //                     let payoutUpdatePayload = payoutDetails;
    //                     let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                     // console.log(" Updated payout schedule,line 3277 ", updatedPayoutDetails);
    //                     // Create a new record in Repaid investment table
    //                     // let { payout_date } = investment;
    //                     // console.log(" Payout Date , line 3280", payout_date);
    //                     // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                     // console.log(" Payout Date in ISO format, line 3282", payoutDueDate);
    //                     // let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                     let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndInvestmentIdAndWalletId(user_id, id, wallet_id,) //.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                     // console.log("hasExistingRepaidInvestment line 3285:");
    //                     // console.log(hasExistingRepaidInvestment);
    //                     if (investment.amount_paid == investment.total_amount_to_repay || investment.amount_outstanding <= 0) {
    //                         paymentStatus = true;
    //                     }
    //                     if (!hasExistingRepaidInvestment) {
    //                         let repaidInvestmentPayload = {
    //                             walletId: wallet_id,
    //                             userId: user_id,
    //                             investmentId: investment.id,
    //                             amount: investment.amount_approved,
    //                             interest: investment.interest_due_on_investment,
    //                             payoutDueDate: investment.payout_date,
    //                             paid: paymentStatus,
    //                             transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                             transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                             payoutScheduleId: updatedPayoutDetails!.id,
    //                             amountDue: amountDue,
    //                             amountPaid: amountPaid,
    //                             amountOutstanding: amountOutstanding,
    //                             label: "recovery",
    //                             type: "manual",
    //                             subType: subType,
    //                             payoutModel: payoutMethod, //"full",
    //                         }
    //                         await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                         // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                         // console.log("newRepaidInvestment line 3322:");
    //                         // console.log(newRepaidInvestment);
    //                     } else if (hasExistingRepaidInvestment) {
    //                         let repaidInvestmentPayload = {
    //                             walletId: wallet_id,
    //                             userId: user_id,
    //                             investmentId: investment.id,
    //                             amount: investment.amount_approved,
    //                             interest: investment.interest_due_on_investment,
    //                             payoutDueDate: investment.payout_date,
    //                             paid: paymentStatus,
    //                             transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                             transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                             payoutScheduleId: updatedPayoutDetails!.id,
    //                             amountDue: amountDue,
    //                             amountPaid: amountPaid, //hasExistingRepaidInvestment.amountPaid +
    //                             amountOutstanding: amountOutstanding,// hasExistingRepaidInvestment.amountOutstanding - amountPaid,
    //                             label: "recovery",
    //                             type: "manual",
    //                             subType: subType,
    //                             payoutModel: payoutMethod,// "part",//  //"full",
    //                         }
    //                         // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                         await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                         // let updateRepaidInvestment = await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                         // console.log("updateRepaidInvestment line 3346:");
    //                         // console.log(updateRepaidInvestment);
    //                     }
    //                     // Commit update to Database
    //                     await trx.commit()

    //                     // FOR MULTIPLE RECOVERY PAYMENT RECORD
    //                     if (hasExistingPayoutDefault !== null) {
    //                         payoutMethod = "part"
    //                     }
    //                     let payoutDefaulterPayload = {
    //                         walletId: wallet_id,
    //                         userId: user_id,
    //                         investmentId: investment.id,
    //                         payoutScheduleId: payoutDetails.id,
    //                         amount: investment.amount_approved,
    //                         interest: investment.interest_due_on_investment,
    //                         totalAmountDue: investment.total_amount_to_repay,
    //                         payoutDueDate: investment.payout_date,
    //                         paid: true,
    //                         transactionId: investmentRecovery.data.transxnId,
    //                         transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                         amountPaid: investment.amount_paid,
    //                         amountOutstanding: investment.amount_outstanding,
    //                         penalty,
    //                         gracePeriod: gracePeriod.toString(),
    //                         recoveredBy: recoveredBy!, //"super admin", // loginAdminFullName // recoveredByWho
    //                         accountMoneyWasDepositedInto: accountRecoveryWasPaidTo,//investmentPayoutAccount,
    //                         label: "recovery",
    //                         type: "manual",
    //                         subType: subType, // "cash",
    //                         payoutModel: payoutMethod, // "part",
    //                         datePayoutWasEffected: dateRecoveryWasMade,
    //                     }
    //                     await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                     // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                     // console.log("newPayoutDefaulter line 3381:");
    //                     // console.log(newPayoutDefaulter);
    //                     // create and send a new timeline
    //                     console.log("Investment recovery successful, request status is OK");
    //                     // update timeline
    //                     timelineObject = {
    //                         id: uuid(),
    //                         action: "investment recovery",
    //                         investmentId: investment.id,
    //                         walletId: investment.wallet_id,
    //                         userId: investment.user_id,
    //                         // @ts-ignore
    //                         message: `${investment.first_name}, ${currencyCode} ${amountRecovered} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered. Your outstanding balance is ${currencyCode} ${investment.amount_outstanding}, please check your account,thank you.`,
    //                         createdAt: DateTime.now(),
    //                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                     };
    //                     // console.log("Timeline object line 3397:", timelineObject);
    //                     await timelineService.createTimeline(timelineObject);
    //                     // let newRecoveryTimeline = await timelineService.createTimeline(timelineObject);
    //                     // console.log("new Timeline object line 3399:", newRecoveryTimeline);

    //                     // Send Details to notification service
    //                     let { email, first_name } = investment;
    //                     let subject = "AstraPay Investment Recovery";
    //                     let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${amountRecovered} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay}, has been recovered. Your outstanding balance is  ${currencyCode} ${investment.amount_outstanding}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                     console.log("newNotificationMessage line 3413:", newNotificationMessage);
    //                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                         console.log("Notification sent successfully");
    //                     } else if (newNotificationMessage.message !== "Success") {
    //                         console.log("Notification NOT sent successfully");
    //                         console.log(newNotificationMessage);
    //                     }

    //                 } else if (payoutDetails.paid.toString() == "1" || payoutDetails.paid == true) {
    //                     console.log(`This investment with id: ${investment.id} has been repaid or fully recovered. Response data for recovery in investment service, line 3422`)
    //                 }
    //             }
    //         }

    //         await processInvestment(ainvestment)
    //         // commit changes to database
    //         await trx.commit();
    //         return ainvestment;
    //     } catch (error) {
    //         console.log(" Line 3432: errrrrrrrrrooooooooooooooooooooooooooooooo ")
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    // public async selectInvestmentsForRecoveryOrCreateDefaulterRecord(queryParams: any): Promise<Investment[] | any> {
    //     const trx = await Database.transaction()
    //     try {
    //         console.log("Query params in investment service line 4004:", queryParams)
    //         let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams;
    //         if (!updatedAtFrom) {
    //             // default to last 3 months
    //             queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //             updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
    //         }
    //         // debugger;
    //         if (!updatedAtTo) {
    //             queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
    //             updatedAtTo = DateTime.now().toISO();//.toISODate();
    //         }
    //         console.log(" updatedAtFrom line 4016 ==============================================================");
    //         console.log(queryParams);
    //         offset = Number(offset);
    //         limit = Number(limit);
    //         // const queryGetter = await this.queryBuilder(queryParams)
    //         // const investmentLogsService = new InvestmentLogsServices();
    //         const settingsService = new SettingServices();
    //         const timelineService = new TimelinesServices();
    //         const investmentabilityStatusesService = new InvestmentabilityStatusesServices();
    //         const payoutSchedulesService = new PayoutSchedulesServices();
    //         const payoutDefaultersService = new PayoutDefaultersServices();
    //         const repaidInvestmentsService = new RepaidInvestmentsServices();
    //         const typesService = new TypesServices();

    //         const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    //         // console.log("Approval setting line 4031:", settings);
    //         if (!settings) {
    //             console.log(`There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`)
    //             throw new AppException({ message: `There is no setting with tagName: ${CURRENT_SETTING_TAGNAME} please check and try again.`, codeSt: "500" })
    //         }
    //         //  get the investment currency
    //         let { currencyCode, gracePeriod } = settings;
    //         let responseData = await Database
    //             .from('investments')
    //             .useTransaction(trx) // 👈
    //             .where('status', "active")
    //             .where('updated_at', '>=', updatedAtFrom)
    //             .where('updated_at', '<=', updatedAtTo)
    //             .offset(offset)
    //             .limit(limit)
    //         // .forUpdate()

    //         // console.log(responseData)
    //         if (!responseData) {
    //             console.log(`There is no active and defaulted investment or recovery has been completed. Please, check and try again.`)
    //             throw new AppException({ message: `There is no active and defaulting investment or recovery has been completed. Please, check and try again.`, codeSt: "500" })
    //         }
    //         let investmentArray: any[] = [];
    //         const processInvestment = async (investment) => {
    //             // console.log(" The current investment startDate, line 4055:", investment.startDate)
    //             let { id, created_at, start_date, payout_date, wallet_id, user_id, amount_approved, duration, lng, lat, amount_outstanding_on_investment, amount_outstanding_on_interest } = investment;//interest_due_on_investment,
    //             investment.checked_for_payment_at = DateTime.now();
    //             investment.created_at = DateTime.fromJSDate(created_at);
    //             // console.log("created_at at for the current investment line 4059", investment.created_at);
    //             investment.start_date = DateTime.fromJSDate(start_date);
    //             // console.log("start_date at for the current investment line 4062", investment.start_date);
    //             investment.payout_date = DateTime.fromJSDate(payout_date);
    //             // console.log("payout_date at for the current investment line 4063", investment.payout_date);

    //             // Add search  by payout due date
    //             let payoutDueDate = investment.payout_date.toISODate();
    //             // console.log(" Amount Approved type is :", typeof amount_approved);
    //             // debugger
    //             let payoutDetails = await payoutSchedulesService.getPayoutScheduleByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndAmount(user_id, wallet_id, id, payoutDueDate, amount_approved);
    //             // console.log(" Payout details +++===========================+++++")
    //             // console.log(payoutDetails);

    //             // debugger
    //             if (!payoutDetails) {
    //                 throw new AppException({ message: `This investment does not have a payout schedule, please check your parameters and try again. Thank you.`, codeSt: "500" })
    //             }
    //             // console.log(payoutDetails!.paid.toString());
    //             // debugger
    //             // check if load has not been repaid
    //             if (payoutDetails.paid.toString() == "0" || payoutDetails.paid == false) {
    //                 // TODO
    //                 // Remove and change to payout schedule data
    //                 // console.log(" Grace period 2 line 4083:",typeof gracePeriod)  fromMillis(milliseconds, options)
    //                 let grace_period = Number(gracePeriod);
    //                 // Uncomment after test
    //                 let startDate = investment.start_date; //DateTime.now().minus({ days: 4 }).toISO();
    //                 // console.log("Time investment was started line 4087: ", startDate);

    //                 duration = Number(duration) + grace_period; // plus gracePeriod
    //                 // console.log("grace_period of investment line 4090: ",typeof grace_period);
    //                 // console.log("Duration of investment line 4091: ", typeof duration);

    //                 let startDateInMs = DateTime.now().minus({ days: grace_period }).toMillis()
    //                 // console.log("Time investment was started in ms line 4094: ", startDateInMs);

    //                 let durationInMs = DateTime.now().minus({ days: duration }).toMillis()
    //                 // console.log("Time investment duration in ms line 4097: ", durationInMs);
    //                 // let overDueDate = DateTime.now()

    //                 if (durationInMs > startDateInMs) {
    //                     console.log("Investment is overdue line 4101: ============================================================= ");
    //                 }
    //                 let timelineObject;
    //                 // let timeline;
    //                 let isOverDueForPayout = await dueForPayout(startDate, duration);
    //                 console.log("Is over due for payout status line 4106 ===========================================");
    //                 console.log(isOverDueForPayout)
    //                 // debugger;
    //                 if (isOverDueForPayout == true && investment.status === 'active' && investment.is_payout_successful.toString() == "0") {
    //                     //  START
    //                     console.log(`Starting Investment Recovery process for investment with ID : ${investment.id}, line 4485 ===========================================`);
    //                     let payload = investment
    //                     let { customer_savings_account, id, amount_outstanding } = investment; //total_amount_to_repay,
    //                     // let penalty = (1 / 100) * Number(total_amount_to_repay);
    //                     let penalty = (1 / 100) * Number(amount_outstanding);
    //                     // console.log("Penalty line 4116:", penalty);
    //                     // console.log("Investment record over due for payout data line 4117:", payload);
    //                     // debugger;
    //                     // payload.investmentId = investmentId;
    //                     // console.log(" investment[0].status line 4120:", investment.status);
    //                     let investmentRecovery;
    //                     let amount_to_be_deducted;
    //                     let interest_to_be_deducted;
    //                     // let newTimeline;
    //                     let hasExistingPayoutDefault;
    //                     // let typeName = investment.investment_type_name;
    //                     let typeId = investment.investment_type_id;
    //                     // New code update
    //                     // const investmentType = await typesService.getTypeByTypeName(typeName);
    //                     const investmentType = await typesService.getTypeByTypeId(typeId);
    //                     // console.log(" investmentType ==============================");
    //                     // console.log(investmentType);
    //                     if (!investmentType) {
    //                         // console.log(`Investment Type Named: ${typeName} does not exist.`)
    //                         // throw new AppException({ message: `Investment Type Named: ${typeName} does not exist.`, codeSt: "500" })
    //                         console.log(`Investment Type Id: ${typeId} does not exist.`);
    //                         throw new AppException({ message: `Investment Type Id: ${typeId} does not exist.`, codeSt: "500" });
    //                     }
    //                     // @ts-ignore
    //                     // TODO
    //                     // Uncomment the code below after testing investment recovery from wallet endpoint
    //                     let { fixedCharge, ratedCharge, outstandingInvestmentWalletId, investmentFundingAccount, investmentPayoutAccount,
    //                         interestOnInvestmentAccount, interestOnInvestmentWalletId, investmentRecoveryWalletId, } = investmentType;
    //                     // get user investment wallet, or create a new investment wallet for a first time user
    //                     let genericWallet = await getUserWalletsById(user_id);
    //                     // console.log("genericWallet line 4141:", genericWallet);
    //                     if (genericWallet.status == 'FAILED TO FETCH WALLET') {
    //                         console.log(`Line 4143: Failed to fetch wallets for user with ID: ${user_id} ,please try again.`);
    //                         throw new AppException({ message: `The user with ID: ${user_id} does not have wallet, please try again.`, codeSt: "500" });
    //                     }
    //                     let investmentWallet = genericWallet.find(o => o.type === 'LOAN');
    //                     // console.log("User record line 4147 :");
    //                     // console.log(investmentWallet);
    //                     const mainWallet = genericWallet.find(o => o.type === 'GENERIC');
    //                     // console.log("User record line 4150 :");
    //                     // console.log(mainWallet);
    //                     if (!investmentWallet) {
    //                         if (!investmentWallet) {
    //                             console.log(`The user with ID: ${user_id} does not have a investment wallet, please try again.`)
    //                             throw new AppException({ message: `The user with ID: ${user_id} does not have a investment wallet, please try again.`, codeSt: "500" })
    //                         }
    //                     }
    //                     // @ts-ignore
    //                     let userMainWalletId = mainWallet!.walletId;
    //                     let availableMainWalletBalance = mainWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 4161: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 4162:", availableMainWalletBalance)
    //                     let userInvestmentWalletId = investmentWallet!.walletId;
    //                     // let availableInvestmentWalletBalance = investmentWallet.availableBalance;
    //                     // console.log("User Investment walletId, line 4165: ", userInvestmentWalletId);
    //                     // console.log("user Investment Wallet Current Balance, line 4166:", availableInvestmentWalletBalance)
    //                     let investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                     let description = `${investment.first_name},the recovery of ${currencyCode} ${Number(amount_to_be_deducted) + Number(interest_to_be_deducted)} out of your ${currencyCode} ${amount_approved} over due investment, has been done successfully.`;
    //                     // Get the User Savings Account Balance
    //                     let savingsAccountBalance = await getCustomerSavingsAccountBalance(customer_savings_account);
    //                     // console.log(" Customer Account Balance =================================================")
    //                     // console.log(savingsAccountBalance);
    //                     // debugger;
    //                     let amountDeductable = Number(savingsAccountBalance) - Number(MINIMUM_BALANCE);
    //                     let amountToBeDeducted = Number(amount_outstanding_on_investment) + Number(amount_outstanding_on_interest);
    //                     // console.log("amountDeductable: ", amountDeductable);
    //                     // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                     // amount_outstanding_on_investment,amount_outstanding_on_interest
    //                     if (amountDeductable > 0 || availableMainWalletBalance > 0) {
    //                         amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                         interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                         if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                             amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - amount_outstanding_on_interest);
    //                             interest_to_be_deducted = amount_outstanding_on_interest;
    //                         }
    //                         if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                             amount_to_be_deducted = amount_outstanding_on_investment
    //                         }
    //                         // console.log("Amount to be deducted for recovery, line 4189:", amount_to_be_deducted);
    //                         // console.log("Interest to be deducted for recovery, line 4190:", interest_to_be_deducted);

    //                         investmentRecovery = await repayDueInvestment(investmentRecoveryReference, userInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, outstandingInvestmentWalletId, investmentPayoutAccount,
    //                             interestOnInvestmentAccount, customer_savings_account, description, lng, lat);
    //                         // console.log("Investment Recovery transaction response");
    //                         // console.log(investmentRecovery);

    //                         // NEW CODE LINE START
    //                         // let hasExistingPayoutDefault; //= await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                         // console.log("hasExistingPayoutDefault line 4199:");
    //                         // console.log(hasExistingPayoutDefault);
    //                         let amountDue = amount_outstanding_on_interest + amount_outstanding_on_investment;//total_amount_to_repay;
    //                         let amountPaid = amount_to_be_deducted + interest_to_be_deducted;//investment.amount_paid;
    //                         let amountOutstanding = amountDue - amountPaid;
    //                         let payoutMethod = "full";
    //                         if (amountPaid !== amountDue) {
    //                             payoutMethod = "part"
    //                         }
    //                         if (investmentRecovery.status !== "FAILED TO REPAY LOAN" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') {
    //                             // For Successful Recovery from SAGAMY
    //                             // FOR MULTIPLE RECOVERY RECORD

    //                             if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                 let payoutDefaulterPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     payoutScheduleId: payoutDetails.id,
    //                                     amount: investment.amount_approved, // amount_to_be_deducted
    //                                     interest: investment.interest_due_on_investment, // interest_to_be_deducted
    //                                     totalAmountDue: investment.total_amount_to_repay,
    //                                     payoutDueDate: investment.payout_date,
    //                                     datePayoutWasEffected: DateTime.now(),
    //                                     paid: true,
    //                                     transactionId: investmentRecovery.data.transxnId,
    //                                     transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                     amountPaid: amountPaid,
    //                                     amountOutstanding: amountOutstanding,// investment.amount_outstanding
    //                                     penalty,
    //                                     gracePeriod: gracePeriod.toString(),
    //                                     recoveredBy: "Super Admin",
    //                                     accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: "sagamy",
    //                                     payoutModel: payoutMethod, // full, part,
    //                                 }
    //                                 await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);

    //                                 // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                 // console.log("newPayoutDefaulter line 4238:");
    //                                 // console.log(newPayoutDefaulter);
    //                             }
    //                             //else if (hasExistingPayoutDefault) {
    //                             //   console.log(" Payout defaulter record is existing line 4242 ++++++++===================================+++++++++++++ ")
    //                             // }

    //                             // update investment record data

    //                             investment.investment_recovery_reference = investmentRecoveryReference;
    //                             // hasExistingPayoutDefault = await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                             // console.log("hasExistingPayoutDefault line 4249:");
    //                             // console.log(hasExistingPayoutDefault);
    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);
    //                             investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                             investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                             investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                             investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);
    //                             investment.status = "default";
    //                             payload = investment;
    //                             // update the investment
    //                             // TODO
    //                             // change to service from API
    //                             const headers = {
    //                                 "internalToken": ASTRAPAY_BEARER_TOKEN
    //                             }
    //                             const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                             // amount: payloadAmount,
    //                             // FAILED TO REPAY LOAN
    //                             console.log("The API response for investment update request line 4271: ", response);
    //                             // debugger
    //                             if (response && response.data.status === "FAILED") {
    //                                 console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                 // update timeline
    //                                 await trx.commit();
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery update failed",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered successfully but update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 4288:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 4290:", newTimeline);
    //                                 console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                 //  throw new AppException({ message: `The update of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                             }
    //                             // create and send a new timeline
    //                             console.log("Investment recovery successful, request status is OK");

    //                             // update investmentability status
    //                             let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                             // console.log("investmentability Status line 4299:", investmentabilityStatus);
    //                             // @ts-ignore
    //                             let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                             let newRecommendation = recommendation + amount_to_be_deducted;
    //                             let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted;
    //                             let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                             }
    //                             let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted;
    //                             let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted;
    //                             investmentabilityStatus!.recommendation = newRecommendation;
    //                             investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                             investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                             investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                             investmentabilityStatus!.lastInvestmentPerformanceRating = "40";
    //                             // let currentDate = new Date().toISOString()
    //                             // investmentDuration('2022-04-30 10:02:07.58+01', currentDate)
    //                             let currentDate = new Date().toISOString()
    //                             let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                             // console.log("currentInvestmentDuration line 4320 ======================");
    //                             // console.log(currentInvestmentDuration);
    //                             investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;
    //                             investmentabilityStatus!.lat = investment.lat;
    //                             investmentabilityStatus!.lng = investment.lng;
    //                             investmentabilityStatus!.isFirstInvestment = false;
    //                             investmentabilityStatus!.isDefaulter = true;
    //                             // Save
    //                             investmentabilityStatus!.save()
    //                             // update investment information

    //                             investment.request_type = "repay_defaulted_investment";
    //                             investment.date_recovery_was_done = DateTime.now();
    //                             // TODO
    //                             // save transaction Id
    //                             if (investmentRecovery.data.transxnId) {
    //                                 investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                             }
    //                             //  save investmentRecoveryReference
    //                             investment.investment_recovery_reference = investmentRecoveryReference;

    //                             // Add to list of defaulted investment if not existing
    //                             let paymentStatus = false;
    //                             // on success, update investment status to completed if all the amount investment are recovered
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 investment.status = "completed";
    //                                 paymentStatus = true;
    //                                 investment.is_recovery_successful = true;
    //                                 investment.is_payout_successful = true;
    //                             }
    //                             console.log("paymentStatus line 4785", paymentStatus);
    //                             investment.label = "recovery";
    //                             // Save
    //                             let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                             // console.log(" Current log, line 4353 :", currentInvestment);
    //                             // send for update
    //                             await this.updateInvestment(currentInvestment, investment);
    //                             // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                             // console.log(" Current log, line 4356 :", updatedInvestment);
    //                             // update investmentLog
    //                             // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                             // console.log(" Current log, line 4359 :", currentInvestmentLog);
    //                             // send for update
    //                             // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                             // console.log(" Current log, line 4362 :", updatedInvestmentLog);

    //                             // TODO
    //                             // Update Payout schedule record for this investment
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 payoutDetails.paid = true;
    //                             }
    //                             payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                             payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                             let payoutUpdatePayload = payoutDetails;
    //                             let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                             // console.log(" Updated payout schedule,line 4373 ", updatedPayoutDetails);
    //                             // Create a new record in Repaid investment table
    //                             // let { payout_date } = investment;
    //                             // console.log(" Payout Date , line 4376", payout_date);
    //                             // payout_date = payout_date.toISODate(); // convert to 2022-07-28
    //                             // console.log(" Payout Date in ISO format, line 4378", payoutDueDate);
    //                             let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                             let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                             // console.log("hasExistingRepaidInvestment line 4381:");
    //                             // console.log(hasExistingRepaidInvestment);
    //                             let fullRecoveryStatus = false;
    //                             if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                 fullRecoveryStatus = true;
    //                                 payoutMethod = "full";
    //                                 console.log("Recovery has been fully made, line 4387 ===============================:");
    //                             }
    //                             if (!hasExistingRepaidInvestment) {
    //                                 let repaidInvestmentPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     payoutDueDate: investment.payout_date,
    //                                     paid: fullRecoveryStatus,
    //                                     transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                     transactionReference: investment.investment_recovery_reference,
    //                                     payoutScheduleId: updatedPayoutDetails!.id,
    //                                     amountDue: amountDue,
    //                                     amountPaid: amountPaid,
    //                                     amountOutstanding: amountOutstanding,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: "sagamy",
    //                                     payoutModel: payoutMethod, //"full",
    //                                 }
    //                                 await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 // console.log("newRepaidInvestment line 4410:");
    //                                 // console.log(newRepaidInvestment);
    //                             } else if (hasExistingRepaidInvestment) {
    //                                 let repaidInvestmentPayload = {
    //                                     walletId: wallet_id,
    //                                     userId: user_id,
    //                                     investmentId: investment.id,
    //                                     amount: investment.amount_approved,
    //                                     interest: investment.interest_due_on_investment,
    //                                     payoutDueDate: investment.payout_date,
    //                                     paid: fullRecoveryStatus,
    //                                     transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                     transactionReference: investment.investment_recovery_reference, //investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                     payoutScheduleId: updatedPayoutDetails!.id,
    //                                     amountDue: amountDue,
    //                                     amountPaid: amountPaid, //hasExistingRepaidInvestment.amountPaid +
    //                                     amountOutstanding: amountOutstanding,// hasExistingRepaidInvestment.amountOutstanding - amountPaid,
    //                                     label: "recovery",
    //                                     type: "automated",
    //                                     subType: "sagamy",
    //                                     payoutModel: payoutMethod,// "part",//  //"full",
    //                                 }
    //                                 // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                 await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                 // let updateRepaidInvestment = await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                 // console.log("updateRepaidInvestment line 4434:");
    //                                 // console.log(updateRepaidInvestment);
    //                             }
    //                             // Commit update to Database
    //                             await trx.commit()
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment payout is over due",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name} your investment of ${currencyCode} ${investment.total_amount_to_repay} is over due for payout/recovery.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 4451:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 4453:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment recovery successful, request status is OK");
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                             };
    //                             // console.log("Timeline object line 4469:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 4471:", newTimeline);

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Recovery";
    //                             let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay}, has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 4485:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }
    //                             // NEW CODE LINE END
    //                         } else {
    //                             // If Recovery from SAGAMY was not Successful 
    //                             investmentRecovery = { status: 422 };
    //                             console.log(" Current Investment status Line 4496:", investmentRecovery.status)
    //                             // Send Notification and update timeline, for failed from SAGAMY Savings Account
    //                             // update timeline
    //                             timelineObject = {
    //                                 id: uuid(),
    //                                 action: "investment recovery from savings account failed",
    //                                 investmentId: investment.id,
    //                                 walletId: investment.wallet_id,
    //                                 userId: investment.user_id,
    //                                 // @ts-ignore
    //                                 message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your savings account has failed. Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                 createdAt: DateTime.now(),
    //                                 metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                             };
    //                             // console.log("Timeline object line 4510:", timelineObject);
    //                             await timelineService.createTimeline(timelineObject);
    //                             // newTimeline = await timelineService.createTimeline(timelineObject);
    //                             // console.log("new Timeline object line 4512:", newTimeline);

    //                             // create and send a new timeline
    //                             console.log("Investment recovery from SAGAMY was unsuccessful, line 4515 ================================== ");

    //                             // Send Details to notification service
    //                             let { email, first_name } = investment;
    //                             let subject = "AstraPay Investment Recovery Failed";
    //                             let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your savings account has failed. 

    //            Please fund your account with at least ${currencyCode} ${Number(amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                             let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                             console.log("newNotificationMessage line 4531:", newNotificationMessage);
    //                             if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                 console.log("Notification sent successfully");
    //                             } else if (newNotificationMessage.message !== "Success") {
    //                                 console.log("Notification NOT sent successfully");
    //                                 console.log(newNotificationMessage);
    //                             }
    //                         }
    //                         // Change status code to number
    //                         // @ts-ignore
    //                         let investmentRecoveryFromMainWallet;
    //                         if (investmentRecovery.status != undefined && investmentRecovery.status != 200 || investment.amount_outstanding_on_investment > 0 || investment.amount_outstanding_on_interest > 0) {
    //                             // try payout from users main wallet
    //                             // Debit the  User wallet with the interest on investment
    //                             try {
    //                                 // Uncomment after Test
    //                                 investmentRecoveryReference = DateTime.now() + randomstring.generate(4);
    //                                 // debugger;
    //                                 // TODO
    //                                 // Get User Wallet Balance : availableMainWalletBalance
    //                                 amountDeductable = Number(availableMainWalletBalance) - Number(MINIMUM_BALANCE);
    //                                 amountToBeDeducted = Number(investment.amount_outstanding_on_investment) + Number(investment.amount_outstanding_on_interest);
    //                                 // console.log("amountDeductable: ", amountDeductable);
    //                                 // console.log("amountToBeDeducted: ", amountToBeDeducted);
    //                                 if (amountDeductable > 0) {
    //                                     amount_to_be_deducted = ((100 - Number(investment.interest_rate)) / 100) * Number(amountDeductable);
    //                                     interest_to_be_deducted = (Number(investment.interest_rate) / 100) * Number(amountDeductable);
    //                                     if (interest_to_be_deducted > amount_outstanding_on_interest) {
    //                                         amount_to_be_deducted = amount_to_be_deducted + (interest_to_be_deducted - amount_outstanding_on_interest);
    //                                         interest_to_be_deducted = amount_outstanding_on_interest;
    //                                     }
    //                                     if (amount_to_be_deducted > amount_outstanding_on_investment) {
    //                                         amount_to_be_deducted = amount_outstanding_on_investment
    //                                     }
    //                                 } else if (amountDeductable <= 0 && amountToBeDeducted > 0) {
    //                                     // Update investment status to default
    //                                     investment.status = "default";
    //                                     investment.label = "recovery";
    //                                     // Save
    //                                     let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                                     // console.log(" Current log, line 4570 :", currentInvestment);
    //                                     //    await currentInvestment!.save();
    //                                     // send for update
    //                                     await this.updateInvestment(currentInvestment, investment);
    //                                     // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                                     // console.log(" Current log, line 4574 :", updatedInvestment);
    //                                     // update investmentLog
    //                                     // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                                     // console.log(" Current log, line 4577 :", currentInvestmentLog);
    //                                     // send for update
    //                                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                     // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                     // console.log(" Current log, line 4580 :", updatedInvestmentLog);

    //                                     // Update timeline
    //                                     await trx.commit();
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name}, your over due investment of ${currencyCode} ${investment.total_amount_to_repay} recovery was unsuccessful.Please fund your account(s), before it is try again,thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                     };
    //                                     // console.log("Timeline object line 4595:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 4597:", newTimeline);
    //                                     console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)

    //                                     // Send Notification
    //                                     let { email, first_name } = investment;
    //                                     let subject = "AstraPay Investment Defaulting / Recovery";
    //                                     let message = `
    //             ${investment.first_name} this is to inform you, that your investment of ${currencyCode} ${investment.total_amount_to_repay}, is over due for recovery. 

    //             Please fund you account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}, for a successful recovery of the investment.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                     console.log("newNotificationMessage line 4019:", newNotificationMessage);
    //                                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                         console.log("Notification sent successfully");
    //                                     } else if (newNotificationMessage.message !== "Success") {
    //                                         console.log("Notification NOT sent successfully");
    //                                         console.log(newNotificationMessage);
    //                                     }

    //                                     throw new AppException({ message: `There was an error debiting the user wallet,the amount deductable is ${currencyCode} ${amountDeductable}, please try again. ${investmentRecovery.message}`, codeSt: `${500}` })
    //                                 } else if (amountToBeDeducted <= 0) {
    //                                     // Update investment status to default
    //                                     investment.status = "default";
    //                                     investment.label = "recovery";
    //                                     // Save
    //                                     let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                                     // console.log(" Current log, line 4627 :", currentInvestment);
    //                                     //    await currentInvestment!.save();
    //                                     // send for update
    //                                     await this.updateInvestment(currentInvestment, investment);
    //                                     // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                                     // console.log(" Current log, line 4631 :", updatedInvestment);
    //                                     // update investmentLog
    //                                     // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                                     // console.log(" Current log, line 4041 :", currentInvestmentLog);
    //                                     // send for update
    //                                     // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                     // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                     // console.log(" Current log, line 4637 :", updatedInvestmentLog);

    //                                     // Update timeline
    //                                     await trx.commit();
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery completed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name}, your over due investment of ${currencyCode} ${investment.total_amount_to_repay} recovery was successful and complete.Thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                     };
    //                                     // console.log("Timeline object line 4651:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 4654:", newTimeline);
    //                                     console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)

    //                                     // Send Notification
    //                                     let { email, first_name } = investment;
    //                                     let subject = "AstraPay Investment Complete Recovery";
    //                                     let message = `
    //             ${investment.first_name} this is to inform you, that your investment of ${currencyCode} ${investment.total_amount_to_repay}, which is over due for recovery, has been recovered successfully and completely. 

    //             Thank you.

    //             AstraPay Investment.`;
    //                                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                     console.log("newNotificationMessage line 4667:", newNotificationMessage);
    //                                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                         console.log("Notification sent successfully");
    //                                     } else if (newNotificationMessage.message !== "Success") {
    //                                         console.log("Notification NOT sent successfully");
    //                                         console.log(newNotificationMessage);
    //                                     }

    //                                     throw new AppException({ message: `The investment with ${id} has been recovered successfully and completely. Thank you.`, codeSt: `${500}` })

    //                                 }
    //                                 // console.log("Amount to be deducted for recovery, line 4678:", amount_to_be_deducted);
    //                                 // console.log("Interest to be deducted for recovery, line 4679:", interest_to_be_deducted);
    //                                 investmentRecovery = await recoverInvestmentFromUserMainWallet(investmentRecoveryReference, userInvestmentWalletId, userMainWalletId, outstandingInvestmentWalletId, investmentRecoveryWalletId,
    //                                     interestOnInvestmentWalletId, amount_to_be_deducted, interest_to_be_deducted, description, lng, lat);
    //                                 outstandingInvestmentWalletId
    //                                 // console.log("Investment Recovery from Main Wallet transaction response");
    //                                 // console.log(investmentRecovery);
    //                                 if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage !== 'Duplicate batch payment id') {
    //                                     investmentRecoveryFromMainWallet = "FAILED";
    //                                     let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                     console.log("statusCode line 4095:", statusCode);
    //                                     let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                     console.log("statusCodeExtension line 4097:", statusCodeExtension);
    //                                     console.log(" Investment recovery exceptional error message, line 4690 ==================================")
    //                                     console.log(investmentRecovery.message);
    //                                     // Send Notification & update timeline for failed investment recovery from Main Wallet
    //                                     // update timeline
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery from wallet failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery,and recovery from your wallet has failed. Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}. Thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.amount_outstanding}`,
    //                                     };
    //                                     // console.log("Timeline object line 4706:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 4708:", newTimeline);

    //                                     // create and send a new timeline
    //                                     console.log("Investment recovery from ASTRAPAY Wallet was unsuccessful, line 4680 ================================== ");

    //                                     // Send Details to notification service
    //                                     let { email, first_name } = investment;
    //                                     let subject = "AstraPay Investment Recovery Failed";
    //                                     let message = `
    //            ${investment.first_name} your investment of ${currencyCode} ${investment.amount_outstanding} is over due for payout/recovery, and recovery from your wallet has failed. 
    //            Please fund your account with at least ${currencyCode} ${Number(investment.amount_outstanding) + Number(MINIMUM_BALANCE)}.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                     let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                     console.log("newNotificationMessage line 4726:", newNotificationMessage);
    //                                     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                         console.log("Notification sent successfully");
    //                                     } else if (newNotificationMessage.message !== "Success") {
    //                                         console.log("Notification NOT sent successfully");
    //                                         console.log(newNotificationMessage);
    //                                     }
    //                                     throw new AppException({ message: `The recovery of the Laon with ID: ${id} from user's wallet was not successful. There was an error debiting the user wallet, please try again. ${investmentRecovery.message}. Thank you.`, codeSt: `${statusCode}` })
    //                                 } else if (investmentRecovery.status === "FAILED TO DEBIT WALLET" && investmentRecovery.errorMessage == 'Duplicate batch payment id') {
    //                                     investmentRecoveryFromMainWallet = "OK";
    //                                     // NEW CODE LINE 2 START
    //                                     let hasExistingPayoutDefault //= await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                                     // console.log("hasExistingPayoutDefault line 4738:");
    //                                     // console.log(hasExistingPayoutDefault);
    //                                     amountDue = investment.amount_outstanding_on_investment + investment.amount_outstanding_on_interest;
    //                                     amountPaid = amount_to_be_deducted + interest_to_be_deducted;//investment.amount_paid;
    //                                     amountOutstanding = amountDue - amountPaid;
    //                                     payoutMethod = "full";
    //                                     if (amountPaid !== amountDue) {
    //                                         payoutMethod = "part"
    //                                     }
    //                                     // Add to list of defaulted investment if not existing
    //                                     // console.log(" Payout Date in ISO format, line 4748", payoutDueDate);
    //                                     if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                         let payoutDefaulterPayload = {
    //                                             walletId: wallet_id,
    //                                             userId: user_id,
    //                                             investmentId: investment.id,
    //                                             payoutScheduleId: payoutDetails.id,
    //                                             amount: investment.amount_approved,
    //                                             interest: investment.interest_due_on_investment,
    //                                             totalAmountDue: investment.total_amount_to_repay,
    //                                             payoutDueDate: investment.payout_date,
    //                                             datePayoutWasEffected: DateTime.now(),
    //                                             paid: true,
    //                                             transactionId: investmentRecovery.data.transxnId,
    //                                             transactionReference: investmentRecoveryReference, //investment.investment_recovery_reference,
    //                                             amountPaid: amountPaid,
    //                                             amountOutstanding: amountOutstanding,
    //                                             penalty,
    //                                             gracePeriod: gracePeriod.toString(),
    //                                             recoveredBy: "Super Admin",
    //                                             accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                             label: "recovery",
    //                                             type: "automated",
    //                                             subType: "astrapay",
    //                                             payoutModel: payoutMethod, // full, part,
    //                                         }
    //                                         let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                         console.log("newPayoutDefaulter line 4775:");
    //                                         console.log(newPayoutDefaulter);
    //                                     } else if (hasExistingPayoutDefault) {
    //                                         console.log(" Payout defaulter record is existing line 4778 ++++++++===================================+++++++++++++ ")
    //                                     }
    //                                     // NEW CODE LINE 2 END

    //                                     let statusCode = Number((investmentRecovery.errorCode).split("-")[0]);
    //                                     console.log("statusCode line 4783:", statusCode);
    //                                     let statusCodeExtension = Number((investmentRecovery.errorCode).split("-")[1]);
    //                                     console.log("statusCodeExtension line 4785:", statusCodeExtension);
    //                                     trx.commit();
    //                                     throw new AppException({ message: `There was an error debiting the user wallet, please try again. ${investmentRecovery.message}, ${investmentRecovery.errorMessage}`, codeSt: `${statusCode}` })
    //                                 }
    //                                 investmentRecoveryFromMainWallet = "OK";
    //                                 // NEW CODE LINE 3 START
    //                                 let hasExistingPayoutDefault //= await payoutDefaultersService.getPayoutDefaulterByUserIdAndInvestmentIdAndWalletIdAndPayoutDate(user_id, id, wallet_id, payoutDueDate);
    //                                 // console.log("hasExistingPayoutDefault line 4792:");
    //                                 // console.log(hasExistingPayoutDefault);
    //                                 amountDue = investment.amount_outstanding_on_investment + investment.amount_outstanding_on_interest;//total_amount_to_repay;
    //                                 amountPaid = amount_to_be_deducted + interest_to_be_deducted; //investment.amount_paid;
    //                                 amountOutstanding = amountDue - amountPaid;
    //                                 payoutMethod = "full";
    //                                 if (amountPaid !== amountDue) {
    //                                     payoutMethod = "part"
    //                                 }
    //                                 if (!hasExistingPayoutDefault || hasExistingPayoutDefault == undefined) {
    //                                     let payoutDefaulterPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         payoutScheduleId: payoutDetails.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         totalAmountDue: investment.total_amount_to_repay,
    //                                         payoutDueDate: investment.payout_date,
    //                                         datePayoutWasEffected: DateTime.now(),
    //                                         paid: true,
    //                                         transactionId: investmentRecovery.data.transxnId,
    //                                         transactionReference: investmentRecoveryReference,//investment.investment_recovery_reference,
    //                                         amountPaid: amountPaid,
    //                                         amountOutstanding: amountOutstanding,
    //                                         penalty,
    //                                         gracePeriod: gracePeriod.toString(),
    //                                         recoveredBy: "Super Admin",
    //                                         accountMoneyWasDepositedInto: investmentPayoutAccount,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: "astrapay",
    //                                         payoutModel: payoutMethod, // full, part,
    //                                     }
    //                                     await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // let newPayoutDefaulter = await payoutDefaultersService.createPayoutDefaulter(payoutDefaulterPayload);
    //                                     // console.log("newPayoutDefaulter line 4827:");
    //                                     // console.log(newPayoutDefaulter);
    //                                 } else if (hasExistingPayoutDefault) {
    //                                     console.log(" Payout defaulter record is existing line 4830 ++++++++===================================+++++++++++++ ")
    //                                 }
    //                                 // update investment record data
    //                                 investment.investment_recovery_reference = investmentRecoveryReference;

    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 investment.amount_paid = investment.amount_paid + Number(amount_to_be_deducted + interest_to_be_deducted);
    //                                 investment.amount_outstanding = investment.amount_outstanding - Number(amount_to_be_deducted + interest_to_be_deducted);

    //                                 investment.total_amount_paid_on_investment = investment.total_amount_paid_on_investment + Number(amount_to_be_deducted);
    //                                 investment.amount_outstanding_on_investment = investment.amount_outstanding_on_investment - Number(amount_to_be_deducted);
    //                                 investment.total_amount_paid_on_interest = investment.total_amount_paid_on_interest + Number(interest_to_be_deducted);
    //                                 investment.amount_outstanding_on_interest = investment.amount_outstanding_on_interest - Number(interest_to_be_deducted);

    //                                 investment.status = "default";
    //                                 payload = investment;
    //                                 // update the investment
    //                                 // TODO
    //                                 // change to service from API
    //                                 const headers = {
    //                                     "internalToken": ASTRAPAY_BEARER_TOKEN
    //                                 }
    //                                 const response = await axios.put(`${API_URL}/investments?userId=${investment.user_id}&walletId=${investment.wallet_id}&investmentId=${investment.id}`, payload, { headers: headers });
    //                                 // amount: payloadAmount,
    //                                 // FAILED TO REPAY LOAN
    //                                 console.log("The API response for investment update request line 4856: ", response);
    //                                 // debugger
    //                                 if (response && response.data.status === "FAILED") {
    //                                     console.log("Investment recovery update unsuccessful, request status is FAILED");
    //                                     // update timeline
    //                                     await trx.commit();
    //                                     timelineObject = {
    //                                         id: uuid(),
    //                                         action: "investment recovery update failed",
    //                                         investmentId: investment.id,
    //                                         walletId: investment.wallet_id,
    //                                         userId: investment.user_id,
    //                                         // @ts-ignore
    //                                         message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered successfully but update was unsuccessful. It will be resolved as soon as possible.Please check your account and try again,thank you.`,
    //                                         createdAt: DateTime.now(),
    //                                         metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                     };
    //                                     // console.log("Timeline object line 4874:", timelineObject);
    //                                     await timelineService.createTimeline(timelineObject);
    //                                     // let newTimeline = await timelineService.createTimeline(timelineObject);
    //                                     // console.log("new Timeline object line 4876:", newTimeline);
    //                                     console.log(`The update of the Investment with ID: ${id} was not successful, please try again, thank you.`)
    //                                     //  throw new AppException({ message: `The update of the Investment with ID: ${id} was not successful, please try again, thank you.`, codeSt: `${500}` })
    //                                 }
    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK; line 4881 ===========================");

    //                                 // update investmentability status
    //                                 let investmentabilityStatus = await investmentabilityStatusesService.getInvestmentabilitystatusByUserId(user_id);
    //                                 // console.log("investmentability Status line 4894:", investmentabilityStatus);
    //                                 // @ts-ignore
    //                                 let { recommendation, amountInvestmentable, totalNumberOfInvestmentsRepaid, totalAmountOfInvestmentsRepaid, totalAmountOfInvestmentsYetToBeRepaid, } = investmentabilityStatus;
    //                                 let newRecommendation = recommendation + amount_to_be_deducted;
    //                                 let newAmountInvestmentable = amountInvestmentable + amount_to_be_deducted;
    //                                 let newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid;
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     newTotalNumberOfInvestmentsRepaid = totalNumberOfInvestmentsRepaid + 1;
    //                                 }
    //                                 let newTotalAmountOfInvestmentsRepaid = totalAmountOfInvestmentsRepaid + amount_to_be_deducted;
    //                                 let newTotalAmountOfInvestmentsYetToBeRepaid = totalAmountOfInvestmentsYetToBeRepaid - amount_to_be_deducted;
    //                                 investmentabilityStatus!.recommendation = newRecommendation;
    //                                 investmentabilityStatus!.amountInvestmentable = newAmountInvestmentable;
    //                                 investmentabilityStatus!.totalNumberOfInvestmentsRepaid = newTotalNumberOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsRepaid = newTotalAmountOfInvestmentsRepaid;
    //                                 investmentabilityStatus!.totalAmountOfInvestmentsYetToBeRepaid = newTotalAmountOfInvestmentsYetToBeRepaid;
    //                                 investmentabilityStatus!.lastInvestmentPerformanceRating = "40";
    //                                 // let currentDate = new Date().toISOString()
    //                                 // investmentDuration('2022-04-30 10:02:07.58+01', currentDate)
    //                                 let currentDate = new Date().toISOString()
    //                                 let currentInvestmentDuration = investmentDuration(investment.start_date, currentDate);
    //                                 // console.log("currentInvestmentDuration line 4906 ======================");
    //                                 // console.log(currentInvestmentDuration);
    //                                 investmentabilityStatus!.lastInvestmentDuration = (await currentInvestmentDuration).toString();//duration;
    //                                 investmentabilityStatus!.lat = investment.lat;
    //                                 investmentabilityStatus!.lng = investment.lng;
    //                                 investmentabilityStatus!.isFirstInvestment = false;
    //                                 investmentabilityStatus!.isDefaulter = true;
    //                                 // Save
    //                                 investmentabilityStatus!.save()
    //                                 // update investment information

    //                                 investment.request_type = "repay_defaulted_investment";
    //                                 investment.date_recovery_was_done = DateTime.now();

    //                                 if (investmentRecovery.data.transxnId) {
    //                                     investment.investment_recovery_transaction_id = investmentRecovery.data.transxnId;
    //                                 }
    //                                 // Add to list of defaulted investment if not existing
    //                                 let paymentStatus = false;
    //                                 // on success, update investment status to completed if all the amount investment are recovered
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     investment.status = "completed";
    //                                     paymentStatus = true;
    //                                     investment.is_recovery_successful = true;
    //                                     investment.is_payout_successful = true;
    //                                 }
    //                                 console.log(" paymentStatus , line 5369 :", paymentStatus);
    //                                 investment.label = "recovery";
    //                                 // Save
    //                                 let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 4935 :", currentInvestment);
    //                                 //    await currentInvestment!.save();
    //                                 // send for update
    //                                 await this.updateInvestment(currentInvestment, investment);
    //                                 // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                                 // console.log(" Current log, line 4939 :", updatedInvestment);
    //                                 // update investmentLog
    //                                 // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                                 // console.log(" Current log, line 4942 :", currentInvestmentLog);
    //                                 // send for update
    //                                 // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                                 // console.log(" Current log, line 4945 :", updatedInvestmentLog);

    //                                 // TODO
    //                                 // Update Payout schedule record for this investment
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     payoutDetails.paid = true;
    //                                 }
    //                                 payoutDetails.transactionId = investment.investment_recovery_transaction_id;
    //                                 payoutDetails.transactionReference = investment.investment_recovery_reference;
    //                                 let payoutUpdatePayload = payoutDetails;
    //                                 let updatedPayoutDetails = await payoutSchedulesService.updatePayoutSchedule(payoutDetails, payoutUpdatePayload);
    //                                 // console.log(" Updated payout schedule,line 4956 ", updatedPayoutDetails);
    //                                 let investmentRecoveryTransactionId = payoutDetails.transactionId;
    //                                 // TODO
    //                                 // Ensure there is no double Repaid Investment Record
    //                                 let hasExistingRepaidInvestment = await repaidInvestmentsService.getRepaidInvestmentByUserIdAndWalletIdAndInvestmentIdAndPayoutDueDateAndTransactionId(user_id, wallet_id, id, payoutDueDate, investmentRecoveryTransactionId);
    //                                 // console.log("hasExistingRepaidInvestment line 4961:");
    //                                 // console.log(hasExistingRepaidInvestment);
    //                                 let fullRecoveryStatus = false;
    //                                 if (investment.total_amount_to_repay == investment.amount_paid) {
    //                                     fullRecoveryStatus = true;
    //                                     payoutMethod = "full";
    //                                 }
    //                                 if (!hasExistingRepaidInvestment) {
    //                                     let repaidInvestmentPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         payoutDueDate: investment.payout_date,
    //                                         paid: fullRecoveryStatus,
    //                                         transactionId: investmentRecovery.data.transxnId, //investment.investmentRecoveryTransactionId,
    //                                         transactionReference: investment.investment_recovery_reference,
    //                                         payoutScheduleId: updatedPayoutDetails!.id,
    //                                         amountDue: amountDue,
    //                                         amountPaid: amountPaid,
    //                                         amountOutstanding: amountOutstanding,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: "astrapay",
    //                                         payoutModel: payoutMethod, //"full",
    //                                     }
    //                                     await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // let newRepaidInvestment = await repaidInvestmentsService.createRepaidInvestment(repaidInvestmentPayload);
    //                                     // console.log("newRepaidInvestment line 4989:");
    //                                     // console.log(newRepaidInvestment);
    //                                 } else if (hasExistingRepaidInvestment) {
    //                                     let repaidInvestmentPayload = {
    //                                         walletId: wallet_id,
    //                                         userId: user_id,
    //                                         investmentId: investment.id,
    //                                         amount: investment.amount_approved,
    //                                         interest: investment.interest_due_on_investment,
    //                                         payoutDueDate: investment.payout_date,
    //                                         paid: fullRecoveryStatus,
    //                                         transactionId: investmentRecovery.data.transxnId,
    //                                         transactionReference: investment.investment_recovery_reference,
    //                                         payoutScheduleId: updatedPayoutDetails!.id,
    //                                         amountDue: amountDue,
    //                                         amountPaid: amountPaid,
    //                                         amountOutstanding: amountOutstanding,
    //                                         label: "recovery",
    //                                         type: "automated",
    //                                         subType: "astrapay",
    //                                         payoutModel: payoutMethod,// "part",//  //"full",
    //                                     }
    //                                     await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                     // let updateRepaidInvestment = await repaidInvestmentsService.updateRepaidInvestment(hasExistingRepaidInvestment, repaidInvestmentPayload);
    //                                     // console.log("updateRepaidInvestment line 5012:");
    //                                     // console.log(updateRepaidInvestment);
    //                                 }

    //                                 // Commit update to Database
    //                                 await trx.commit()
    //                                 // create and send a new timeline
    //                                 console.log("Investment recovery successful, request status is OK");
    //                                 // update timeline
    //                                 timelineObject = {
    //                                     id: uuid(),
    //                                     action: "investment recovery",
    //                                     investmentId: investment.id,
    //                                     walletId: investment.wallet_id,
    //                                     userId: investment.user_id,
    //                                     // @ts-ignore
    //                                     message: `${investment.first_name}, ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay} has been recovered, please check your account,thank you.`,
    //                                     createdAt: DateTime.now(),
    //                                     metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                                 };
    //                                 // console.log("Timeline object line 5032:", timelineObject);
    //                                 await timelineService.createTimeline(timelineObject);
    //                                 // newTimeline = await timelineService.createTimeline(timelineObject);
    //                                 // console.log("new Timeline object line 5034:", newTimeline);

    //                                 // Send Details to notification service
    //                                 let { email, first_name } = investment;
    //                                 let subject = "AstraPay Investment Recovery";
    //                                 let message = `
    //             ${investment.first_name} this is to inform you, that ${currencyCode} ${Number(amount_to_be_deducted + interest_to_be_deducted)} out of your over due investment of ${currencyCode} ${investment.total_amount_to_repay}, has been recovered.

    //             Please check your account.

    //             Thank you.

    //             AstraPay Investment.`;
    //                                 let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                                 console.log("newNotificationMessage line 5048:", newNotificationMessage);
    //                                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                                     console.log("Notification sent successfully");
    //                                 } else if (newNotificationMessage.message !== "Success") {
    //                                     console.log("Notification NOT sent successfully");
    //                                     console.log(newNotificationMessage);
    //                                 }
    //                                 // NEW CODE LINE 3 END
    //                             } catch (error) {
    //                                 console.error(error.message);
    //                                 throw error;
    //                             }
    //                             // debugger
    //                         }
    //                         // TODO
    //                         // Uncomment the code below to use Okra Garnishment
    //                         // else if (investmentRecovery.status != undefined && investmentRecovery.status != 200 && investmentRecoveryFromMainWallet == "FAILED") {
    //                         //   // try payout with the use of Okra Garnishment feature
    //                         //   console.log("Trying to recover investment from Main Wallet Status: line 5076", investmentRecoveryFromMainWallet);
    //                         //   console.log(" Sending Investment to Okra for garnishment line 5077 ===========");
    //                         // }
    //                     } else if (amountDeductable <= 0 && availableMainWalletBalance <= 0) {
    //                         // Update investment status to default
    //                         investment.status = "default";
    //                         investment.label = "recovery";
    //                         // Save
    //                         let currentInvestment = await this.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //                         // console.log(" Current log, line 5075 :", currentInvestment);
    //                         //    await currentInvestment!.save();
    //                         // send for update
    //                         await this.updateInvestment(currentInvestment, investment);
    //                         // let updatedInvestment = await this.updateInvestment(currentInvestment, investment);
    //                         // console.log(" Current log, line 5079 :", updatedInvestment);
    //                         // update investmentLog
    //                         // let currentInvestmentLog = await investmentLogsService.getInvestmentlogsByIdAndWalletIdAndUserId(investment.id, wallet_id, user_id);
    //                         // console.log(" Current log, line 5082 :", currentInvestmentLog);
    //                         // send for update
    //                         // await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                         // let updatedInvestmentLog = await investmentLogsService.updateInvestmentlog(currentInvestmentLog, investment);
    //                         // console.log(" Current log, line 5085 :", updatedInvestmentLog);

    //                         // Update timeline
    //                         // Commit update to Database
    //                         await trx.commit()
    //                         timelineObject = {
    //                             id: uuid(),
    //                             action: "investment payout is over due",
    //                             investmentId: investment.id,
    //                             walletId: investment.wallet_id,
    //                             userId: investment.user_id,
    //                             // @ts-ignore
    //                             message: `${investment.first_name} your investment of ${currencyCode} ${investment.total_amount_to_repay} is over due for payout/recovery.`,
    //                             createdAt: DateTime.now(),
    //                             metadata: `total amount to be deducted plus interest: ${currencyCode} ${investment.total_amount_to_repay}`,
    //                         };
    //                         // console.log("Timeline object line 5101:", timelineObject);
    //                         await timelineService.createTimeline(timelineObject);
    //                         // newTimeline = await timelineService.createTimeline(timelineObject);
    //                         // console.log("new Timeline object line 5103:", newTimeline);

    //                         // Send Notification
    //                         let { email, first_name } = investment;
    //                         let subject = "AstraPay Investment Recovery";
    //                         let message = `
    //           ${investment.first_name} this is to inform you, that your investment of ${currencyCode} ${investment.amount_approved}, is over due for payout/recovery.

    //           Please fund your account(s).

    //           Thank you.

    //           AstraPay Investment.`;
    //                         let newNotificationMessage = await sendNotification(email, subject, first_name, message);
    //                         console.log("newNotificationMessage line 5117:", newNotificationMessage);
    //                         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
    //                             console.log("Notification sent successfully");
    //                         } else if (newNotificationMessage.message !== "Success") {
    //                             console.log("Notification NOT sent successfully");
    //                             console.log(newNotificationMessage);
    //                         }
    //                     } else if (payoutDetails.paid.toString() == "1" || payoutDetails.paid == true) {
    //                         console.log(`This investment with id: ${investment.id} has been paid. Response data for recovery in investment service, line 4491`)
    //                     }
    //                 }
    //             }
    //         }

    //         for (let index = 0; index < responseData.length; index++) {
    //             try {
    //                 const ainvestment = responseData[index];
    //                 await processInvestment(ainvestment);
    //                 investmentArray.push(ainvestment);
    //             } catch (error) {
    //                 console.log("Error line 5137:", error);
    //                 throw error;
    //             }
    //         }
    //         // commit changes to database
    //         await trx.commit();
    //         // console.log("Response data for payout in investment service, line 5153:", investmentArray)
    //         return investmentArray;
    //     } catch (error) {
    //         console.log(error)
    //         await trx.rollback();
    //         throw error;
    //     }
    // }

    public async getInvestmentByInvestmentId(id: string): Promise<Investment | any | null> {
        try {
            // const investment = await Investment.findBy('id', id);
            const investment = await Investment.query().where({ id: id })
                .preload("timelines", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutSchedules", (query) => { query.orderBy("createdAt", "desc"); })
                // .preload("payoutInvestments", (query) => { query.orderBy("createdAt", "desc"); })
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
        console.log(response)
        return response
    }
}
