'use strict'

import { ApprovalType } from 'App/Services/types/approval_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
import Approval from 'App/Models/Approval'
import { DateTime } from 'luxon'
import { v4 as uuid } from "uuid";
import TimelinesServices from './TimelinesServices'
import InvestmentsServices from './InvestmentsServices'
import { debitUserWallet } from 'App/Helpers/debitUserWallet'
// import { sendNotification } from 'App/Helpers/sendNotification'
import { creditUserWallet } from 'App/Helpers/creditUserWallet'
import { sendNotificationWithoutPdf } from 'App/Helpers/sendNotificationWithoutPdf'

Database.query()

export default class ApprovalsServices {
    public async createApproval(terminateApproval: ApprovalType): Promise<Approval> {
        try {
            const approval = await Approval.create(terminateApproval)
            const timelineService = new TimelinesServices();
            const investmentService = new InvestmentsServices();
            let timelineObject;
            // change timeline messsage based on the requestType
            if (approval.requestType === "start_investment") {
                let investmentId = approval.investmentId;
                let investmentDetails;
                if (investmentId) {
                    investmentDetails = await investmentService.getInvestmentByInvestmentId(investmentId)
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment request approval created",
                    investmentId: approval.investmentId,
                    userId: investmentDetails.userId,
                    walletId: investmentDetails.walletId,
                    // @ts-ignore
                    message: `${investmentDetails.firstName} investment request approval record has just been created.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${investmentDetails.requestType}`,
                };
                // console.log("Timeline object line 285:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 287:", newTimeline);
            } else if (approval.requestType === "start_investment_rollover") {
                let investmentId = approval.investmentId;
                let investmentDetails;
                if (investmentId) {
                    investmentDetails = await investmentService.getInvestmentByInvestmentId(investmentId)
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment request approval created",
                    investmentId: approval.investmentId,
                    userId: investmentDetails.userId,
                    walletId: investmentDetails.walletId,
                    // @ts-ignore
                    message: `${investmentDetails.firstName} investment request approval record has just been created.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${investmentDetails.requestType}`,
                };
                // console.log("Timeline object line 285:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 287:", newTimeline);
            }

            return approval
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovals(queryParams: any): Promise<Approval[] | any> {
        try {
            console.log("Query params in approval service:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams;
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
            const queryGetter = await this.queryBuilder(queryParams)
            let responseData = await Approval.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            console.log("Response data in approval service:", responseData)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByApprovalId(id: string): Promise<Approval | any | null> {
        try {
            // const approval = await Approval.findBy('id', id);
            const approval = await Approval.query().where({ id: id }).first();
            console.log("Approval search result from service")
            console.log(approval);
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByInvestmentId(InvestmentId: string): Promise<Approval | null> {
        try {
            const approval = await Approval.query().where({ investment_id: InvestmentId }).first();
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByUserIdAndWalletId(userId: string, walletId: string): Promise<Approval | null> {
        try {
            const approval = await Approval.query().where({ userId: userId, walletId: walletId }).first();
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId: string, userId: string, walletId: string, requestType: string, approvalStatus: string): Promise<Approval | null> {
        try {
            const approval = await Approval.query().where({
                userId: userId, walletId: walletId, investmentId: investmentId, requestType: requestType, approvalStatus: approvalStatus
            }).first();
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async updateApproval(selectedApproval: any, updateApproval: ApprovalType): Promise<Approval | null> {
        try {
            let saveApproval = await selectedApproval.merge(updateApproval)
            await saveApproval.save();
            // debugger
            const investmentService = new InvestmentsServices();
            const selectedInvestmentRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
            const timelineService = new TimelinesServices();
            let timelineObject;
            let investmentId = selectedInvestmentRequest.id;
            // change timeline messsage based on the requestType 
            if (saveApproval.requestType === "start_investment") {
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_approved";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // TODO: handle remark
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                    //  TODO: Debit user wallet to activate the investment
                    // Data to send for transfer of fund
                    let { amount, lng, lat, investmentRequestReference,
                        firstName, lastName,
                        walletId, userId,
                        phone,
                        email,
                        rfiCode, currencyCode } = selectedInvestmentRequestUpdate;
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
                    debugger

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
                    // console.log("Timeline object line 190:", timelineObject);
                    await timelineService.createTimeline(timelineObject);

                    // Send Notification to admin and others stakeholder
                    let investment = selectedInvestmentRequest;
                    let messageKey = "approval";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 239:", newNotificationMessageWithoutPdf);
                    // debugger
                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessageWithoutPdf);
                    }

                    // Testing
                    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
                    // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
                    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
                    // console.log('Testing Payout Date: ' + testingPayoutDate)

                    // update record
                    let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 221 :", currentInvestment);
                    // send for update
                    let updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    // console.log(" Current log, line 224 :", updatedInvestment);
                    // if successful 
                    if (debitUserWalletForInvestment.status == 200) {
                        // update the investment details
                        selectedInvestmentRequestUpdate.status = 'active'
                        selectedInvestmentRequestUpdate.approvalStatus = 'approved'
                        selectedInvestmentRequestUpdate.startDate = DateTime.now() //.toISODate()
                        selectedInvestmentRequestUpdate.payoutDate = DateTime.now().plus({ days: selectedInvestmentRequestUpdate.duration })
                        selectedInvestmentRequestUpdate.isInvestmentCreated = true
                        // debugger

                        // Save the updated record
                        // await record.save();
                        // update record
                        currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // console.log(" Current log, line 325441 :", currentInvestment);
                        // send for update
                        updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                        console.log(" Current log, line 257 :", updatedInvestment);

                        // console.log("Updated record Status line 259: ", record);
                        timelineObject = {
                            id: uuid(),
                            investmentId: investmentId,
                            userId: userId,
                            walletId: walletId,
                            action: 'investment activated',
                            // @ts-ignore
                            message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated.`,
                            createdAt: selectedInvestmentRequestUpdate.startDate,
                            metadata: `duration: ${selectedInvestmentRequestUpdate.duration}, payout date : ${selectedInvestmentRequestUpdate.payoutDate}`,
                        }
                        // console.log('Timeline object line 292:', timelineObject)
                        await timelineService.createTimeline(timelineObject);
                        // Send Details to notification service
                        //         let subject = "AstraPay Investment Activation";
                        //         let message = `
                        // ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${selectedInvestmentRequestUpdate.duration} days, has been activated on ${selectedInvestmentRequestUpdate.startDate} and it will be mature for payout on ${selectedInvestmentRequestUpdate.payoutDate}.

                        // Please check your device. 

                        // Thank you.

                        // AstraPay Investment.`;
                        //         let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                        //         // console.log("newNotificationMessage line 305:", newNotificationMessage);
                        //         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                        //             console.log("Notification sent successfully");
                        //         } else if (newNotificationMessage.message !== "Success") {
                        //             console.log("Notification NOT sent successfully");
                        //             console.log(newNotificationMessage);
                        //         }
                        // Send Notification to admin and others stakeholder
                        let investment = selectedInvestmentRequest;
                        let messageKey = "activation";
                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // console.log("newNotificationMessage line 316:", newNotificationMessageWithoutPdf);
                        // debugger
                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessageWithoutPdf);
                        }

                    } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                        console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 1009 ============`);
                        // debugger
                        let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // console.log(" Current log, line 280 :", currentInvestment);
                        // send for update
                        await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);

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
                        // console.log("Timeline object line 296:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 299:", newTimeline);
                        // update record
                        // debugger

                        // Send Notification to admin and others stakeholder
                        let investment = selectedInvestmentRequest;
                        let messageKey = "activation_failed";
                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // console.log("newNotificationMessage line 371:", newNotificationMessageWithoutPdf);
                        // debugger
                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessageWithoutPdf);
                        }


                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 320 =========:", updatedInvestment);
                        // console.log("debitUserWalletForInvestment reponse data 321 ==================================", debitUserWalletForInvestment)
                        // debugger
                        // throw Error(debitUserWalletForInvestment);
                        throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                        // return {
                        //         status: "FAILED",//debitUserWalletForInvestment.status,
                        //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                        //     };
                    }

                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "declined" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_declined";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // TODO: handle remark
                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);

                    let { firstName,walletId, userId, } = selectedInvestmentRequestUpdate;
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment declined",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment request has been declined. Please try again. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 383:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                }
               
            } else if (saveApproval.requestType === "start_investment_rollover") {
                // get the request by request id
                // update status based on admin action

                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    // selectedInvestmentRequestUpdate.status = "investment_approved";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // TODO: handle remark
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                    //  TODO: Debit user wallet to activate the investment
                    // Data to send for transfer of fund
                    let { //amount, //lng, lat, investmentRequestReference,
                        firstName, //lastName,
                        walletId, userId,
                        // phone,
                        //email,
                        rfiCode,
                        // currencyCode
                    } = selectedInvestmentRequestUpdate;
                    // debugger
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment rollover approved",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment rollover request has been approved, please wait while the investment is activated. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 190:", timelineObject);
                    await timelineService.createTimeline(timelineObject);

                    // Send Notification to admin and others stakeholder
                    let investment = selectedInvestmentRequest;
                    let messageKey = "approval";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 497:", newNotificationMessageWithoutPdf);
                    // debugger
                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessageWithoutPdf);
                    }

                    // update record
                    let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 508 :", currentInvestment);
                    // send for update
                    let updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    // console.log(" Current log, line 511 :", updatedInvestment);
                    // if successful 
                    // if (debitUserWalletForInvestment.status == 200) {
                    // update the investment details
                    selectedInvestmentRequestUpdate.status = 'active'
                    selectedInvestmentRequestUpdate.approvalStatus = 'approved'
                    selectedInvestmentRequestUpdate.startDate = DateTime.now() //.toISODate()
                    selectedInvestmentRequestUpdate.payoutDate = DateTime.now().plus({ days: selectedInvestmentRequestUpdate.duration })
                    selectedInvestmentRequestUpdate.isInvestmentCreated = true
                    // debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 341 :", currentInvestment);
                    // send for update
                    updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    console.log(" Current log, line 344 :", updatedInvestment);

                    // console.log("Updated record Status line 1281: ", record);
                    timelineObject = {
                        id: uuid(),
                        investmentId: investmentId,
                        userId: userId,
                        walletId: walletId,
                        action: 'investment rollover activated',
                        // @ts-ignore
                        message: `${firstName}, your investment rollover of ${currencyCode} ${amount} has been activated.`,
                        createdAt: selectedInvestmentRequestUpdate.startDate,
                        metadata: `duration: ${selectedInvestmentRequestUpdate.duration}, payout date : ${selectedInvestmentRequestUpdate.payoutDate}`,
                    }
                    // console.log('Timeline object line 543:', timelineObject)
                    await timelineService.createTimeline(timelineObject);
                    
                    // Send Notification to admin and others stakeholder
                    //  investment = record;
                    messageKey = "activation";
                    newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 567:", newNotificationMessageWithoutPdf);
                    // debugger
                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessageWithoutPdf);
                    }

                    currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 577 :", currentInvestment);
                    // send for update
                    await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);

                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "declined" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_declined";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // TODO: handle remark
                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                    let record = selectedInvestmentRequest;
                    let {
                        // start
                        //@ts-ignore
                        id,
                        lastName,
                        firstName,
                        walletId,
                        userId,
                        // investmentTypeId,
                        rfiCode,
                        currencyCode,
                        lng,
                        lat,
                        phone,
                        email,
                        amount,
                        // duration,
                        // interestRate: 0,
                        // interestDueOnInvestment: 0,
                        // interestDueOnInvestment,
                        // end
                    } = record;
                    let beneficiaryName = `${firstName} ${lastName}`;
                    let beneficiaryAccountNumber = walletId;
                    let beneficiaryAccountName = beneficiaryName;
                    let beneficiaryPhoneNumber = phone;
                    let beneficiaryEmail = email;
                    // Send to the endpoint for debit of wallet
                    let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;

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
                    // console.log("Timeline object line 602:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 605:", newTimeline);
                    // update record
                    // debugger
                    // Send Details to notification service
                    //     let subject = "AstraPay Investment Activation Failed";
                    //     let message = `
                    // ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again.

                    // Thank you.

                    // AstraPay Investment.`;
                    //     let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                    //     // console.log("newNotificationMessage line 650:", newNotificationMessage);
                    //     if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                    //         console.log("Notification sent successfully");
                    //     } else if (newNotificationMessage.message !== "Success") {
                    //         console.log("Notification NOT sent successfully");
                    //         console.log(newNotificationMessage);
                    //     }
                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "activation_failed";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 661:", newNotificationMessageWithoutPdf);
                    // debugger
                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessageWithoutPdf);
                    }

                    // Credit the user wallet with the amount to be rollover
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
                    let decPl = 3;
                    if (creditUserWalletWithPrincipal.status == 200) {
                        let amountPaidOut = amount;
                        // let decPl = 2;
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
                        let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                        // console.log(" Current log, line 608 :", currentInvestment);
                        // send for update
                        await investmentService.updateInvestment(currentInvestment, record);
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

                        // Send Notification to admin and others stakeholder
                        let investment = record;
                        let messageKey = "payout";
                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // console.log("newNotificationMessage line 754:", newNotificationMessageWithoutPdf);
                        // debugger
                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessageWithoutPdf);
                        }

                    } else if (creditUserWalletWithPrincipal.status !== 200) {
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
                        let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                        // console.log(" Current log, line 517 :", currentInvestment);
                        // send for update
                        await investmentService.updateInvestment(currentInvestment, record);
                        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        // console.log(" Current log, line 701 :", updatedInvestment);

                        // console.log("Updated record Status line 703: ", record);

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
                        // console.log("Timeline object line 717:", timelineObject);
                        await timelineService.createTimeline(timelineObject);
                        // let newTimeline = await timelineService.createTimeline(timelineObject);
                        // console.log("new Timeline object line 720:", newTimeline);
                        // update record

                      
                        // Send Notification to admin and others stakeholder
                        let investment = record;
                        let messageKey = "payout_and_rollover_failed";
                        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // console.log("newNotificationMessage line 834:", newNotificationMessageWithoutPdf);
                        // debugger
                        if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            console.log("Notification sent successfully");
                        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            console.log("Notification NOT sent successfully");
                            console.log(newNotificationMessageWithoutPdf);
                        }

                    }
                    // console.log("creditUserWalletForInvestment reponse data 743 ==================================", debitUserWalletForInvestment)
                    // debugger
                    // throw Error(creditUserWalletForInvestment);
                    // throw Error(`${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`);
                    // return {
                    //         status: "FAILED",//creditUserWalletForInvestment.status,
                    //         message: `${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`,
                    //     };
                }
             
            } else if (saveApproval.requestType === "payout_investment") {
                const selectedInvestmentPayoutRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentPayoutRequest ========================================================")
                    console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.status = "approved";
                    // selectedInvestmentPayoutRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // debugger
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentPayoutRequest ========================================================")
                    console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "investment_payout_declined" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.status = "investment_payout_declined";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment payout declined",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment payout request has been declined. Please try again. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 823:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                } else if (saveApproval.approvalStatus === "suspend_payout" && saveApproval.isPayoutSuspended === true) {
                    // update the neccesary field
                    console.log("selectedInvestmentPayoutRequest ========================================================")
                    console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "payout_suspended" //saveApproval.approvalStatus;
                    // selectedInvestmentPayoutRequestUpdate.status = "payout_suspended";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment payout suspended",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment payout has been suspended. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 849:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                } else if (saveApproval.approvalStatus === "suspend_rollover" && saveApproval.isRolloverSuspended === true) {
                    // update the neccesary field
                    console.log("selectedInvestmentPayoutRequest ========================================================")
                    console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "rollover_suspended" //saveApproval.approvalStatus;
                    // selectedInvestmentPayoutRequestUpdate.status = "rollover_suspended";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment rollover suspended",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId, 
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment rollover request has been suspended. Thank you.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 383:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                }
              
            } else if (saveApproval.requestType === "terminate_investment") {
                const selectedInvestmentTerminationRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentTerminationRequest ========================================================")
                    console.log(selectedInvestmentTerminationRequest)
                    let selectedInvestmentTerminationRequestUpdate = selectedInvestmentTerminationRequest;
                    selectedInvestmentTerminationRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    selectedInvestmentTerminationRequestUpdate.status = "liquidation_approved";
                    // Calculate and deduct the penalty from the accrued interest, before payout

                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // debugger
                    await investmentService.updateInvestment(selectedInvestmentTerminationRequest, selectedInvestmentTerminationRequestUpdate);
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment liquidation approved",
                        investmentId: saveApproval.investmentId,
                        userId: selectedApproval.userId,
                        walletId: selectedApproval.walletId,
                        // @ts-ignore
                        message: `${selectedInvestmentTerminationRequest.firstName},your investment liquidation request has just been approved.`,
                        createdAt: DateTime.now(),
                        metadata: `request type : ${selectedApproval.requestType}`,
                    };
                    // console.log("Timeline object line 964:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 967:", newTimeline);

                    // Send to investmentsService for processing of liquidation
                    await investmentService.liquidateInvestment(saveApproval.investmentId);

                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    // console.log("selectedInvestmentTerminationRequest ========================================================")
                    // console.log(selectedInvestmentTerminationRequest)
                    let selectedInvestmentTerminationRequestUpdate = selectedInvestmentTerminationRequest;
                    selectedInvestmentTerminationRequestUpdate.approvalStatus = "liquidation_declined" //saveApproval.approvalStatus;
                    // selectedInvestmentTerminationRequestUpdate.status = "liquidation_declined";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentTerminationRequest, selectedInvestmentTerminationRequestUpdate);
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment liquidation declined",
                        investmentId: saveApproval.investmentId,
                        userId: selectedApproval.userId,
                        walletId: selectedApproval.walletId,
                        // @ts-ignore
                        message: `${selectedInvestmentTerminationRequest.firstName},your investment liquidation request has just been declined.`,
                        createdAt: DateTime.now(),
                        metadata: `request type : ${selectedApproval.requestType}`,
                    };
                    // console.log("Timeline object line 994:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 997:", newTimeline);

                    // Send Notification to admin and others stakeholder
                    let investment = selectedInvestmentTerminationRequest;
                    let { rfiCode } = selectedInvestmentTerminationRequest;
                    let messageKey = "liquidation_rejection";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 2563:", newNotificationMessageWithoutPdf);
                    // debugger
                    if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        console.log("Notification NOT sent successfully");
                        console.log(newNotificationMessageWithoutPdf);
                    }
                }

            }
            return saveApproval
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteApproval(selectedApproval: any): Promise<Approval | null> {
        try {
            await selectedApproval.delete()
            return selectedApproval
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
        if (queryFields.investmentId) {
            predicateExists()
            predicate = predicate + "investment_id=?";
            params.push(queryFields.investmentId)
        }
        if (queryFields.requestType) {
            predicateExists()
            predicate = predicate + "request_type=?";
            params.push(queryFields.requestType)
        }
        if (queryFields.approvalStatus) {
            predicateExists()
            predicate = predicate + "approval_status=?";
            params.push(queryFields.approvalStatus)
        }
        if (queryFields.assignedTo) {
            predicateExists()
            predicate = predicate + "assigned_to=?";
            params.push(queryFields.assignedTo)
        }
        if (queryFields.processedBy) {
            predicateExists()
            predicate = predicate + "processed_by=?";
            params.push(queryFields.processedBy)
        }
        if (queryFields.remark) {
            predicateExists()
            predicate = predicate + "remark=?";
            params.push(queryFields.remark)
        }
        if (queryFields.createdAt) {
            predicateExists()
            predicate = predicate + "terminated_at=?";
            params.push(queryFields.createdAt)
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
        return response
    }
}