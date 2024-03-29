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
import { creditUserWallet } from 'App/Helpers/creditUserWallet'
import { sendNotificationWithoutPdf } from 'App/Helpers/sendNotificationWithoutPdf'
import { checkTransactionStatus } from 'App/Helpers/checkTransactionStatus'

Database.query()

export default class ApprovalsServices {
    public async createApproval(createApproval: ApprovalType): Promise<Approval> {
        try {
            const approval = await Approval.create(createApproval)
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
                    message: `${investmentDetails.firstName} ,your investment request approval record has just been created.`,
                    adminMessage: `${investmentDetails.firstName} investment request approval record was created.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${investmentDetails.requestType}`,
                };
                // console.log("Timeline object line 285:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 287:", newTimeline);
                // debugger
                    let payoutApprovalObject;

                    // TODO: Send to the Admin for approval
                    // update payoutApprovalObject
                    payoutApprovalObject = {
                        rfiCode: investmentDetails.rfiCode,
                        walletId: investmentDetails.walletId,
                        investmentId: investmentId,
                        userId: investmentDetails.userId,
                        requestType: "payout_investment",
                        approvalStatus: "pending",
                        assignedTo: "",//investment.assignedTo,
                        processedBy: "",//investment.processedBy,
                        // remark: "",
                    };
                await Approval.create(payoutApprovalObject);
                    debugger
            

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
                    message: `${investmentDetails.firstName} , your investment request approval record has just been created.`,
                    adminMessage: `${investmentDetails.firstName} investment request approval record was created.`,
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
            // debugger
            let responseData = await Approval.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            // console.log("Response data in approval service:", responseData)
            return responseData;
        } catch (error) {
            console.log(error)
            debugger
            throw error
        }
    }

    public async getApprovalsCount(queryParams: any): Promise<any> {
        try {
            const queryGetter = await this.queryBuilder(queryParams);
            const counter = await Approval.query()
                .whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .count("*");
            // return {
            //   totalCount: parseInt(counter[0].$extras.count),
            // };
            // debugger
            return parseInt(counter[0].$extras.count);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async getApprovalByApprovalId(id: string): Promise<Approval | any | null> {
        try {
            // const approval = await Approval.findBy('id', id);
            const approval = await Approval.query().where({ id: id }).first();
            console.log("Approval search result from service")
            // console.log(approval);
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalsByEmail(email: string): Promise<Approval[] | any | null> {
        try {
            // const approval = await Approval.findBy('id', id);
            const approval = await Approval.query().where({ email: email })
            // .first();
            console.log("Approval search result from service")
            // console.log(approval);
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
            debugger
            const approval = await Approval.query().where({
                user_id: userId, wallet_id: walletId, investment_id: investmentId, request_type: requestType, approval_status: approvalStatus
            }).first();
            debugger
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
            debugger
            const investmentService = new InvestmentsServices();
            const selectedInvestmentRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
            const timelineService = new TimelinesServices();
            let timelineObject;
            let investmentId = selectedInvestmentRequest.id;
            // change timeline messsage based on the requestType
            if (saveApproval.requestType === "start_investment") {
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus.toLowerCase() === "approved") {
                    // update the neccesary field
                    // console.log("selectedInvestmentRequest ========================================================")
                    // console.log(selectedInvestmentRequest)
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
                        walletId, userId, investorFundingWalletId,
                        phone,
                        email,
                        rfiCode, currencyCode, numberOfAttempts } = selectedInvestmentRequestUpdate;
                    let senderName = `${firstName} ${lastName}`;
                    let senderAccountNumber = investorFundingWalletId;//walletId;
                    let senderAccountName = senderName;
                    let senderPhoneNumber = phone;
                    let senderEmail = email;
                    // check if transaction with same customer ref exist
                    let checkTransactionStatusByCustomerRef = await checkTransactionStatus(investmentRequestReference, rfiCode);
                    debugger
                    // if(checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                    // if (!checkTransactionStatusByCustomerRef)
                    if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") {
                        // initiate a new  transaction
                        // Send to the endpoint for debit of wallet
                        let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                            senderName,
                            senderAccountNumber,
                            senderAccountName,
                            senderPhoneNumber,
                            senderEmail,
                            rfiCode, userId,)
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
                            adminMessage: `${firstName} investment request was approved.`,
                            createdAt: DateTime.now(),
                            metadata: ``,
                        };
                        // console.log("Timeline object line 217:", timelineObject);
                        await timelineService.createTimeline(timelineObject);

                        // Send Notification to admin and others stakeholder
                        let investment = selectedInvestmentRequest;
                        let messageKey = "approval";
                        // let newNotificationMessageWithoutPdf = await
                         sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // // console.log("newNotificationMessage line 224:", newNotificationMessageWithoutPdf);
                        // // debugger
                        // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        //     console.log("Notification sent successfully");
                        // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        //     console.log("Notification NOT sent successfully");
                        //     console.log(newNotificationMessageWithoutPdf);
                        // }

                        // update record
                        let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // console.log(" Current log, line 241 :", currentInvestment);
                        // send for update
                        await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                        // let updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                        // console.log(" Current log, line 244 :", updatedInvestment);
                        // if successful
                        if (debitUserWalletForInvestment && debitUserWalletForInvestment.status == 200) {
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
                            // console.log(" Current log, line 259 :", currentInvestment);
                            // send for update
                            await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                            // updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                            // console.log(" Current log, line 257 :", updatedInvestment);

                            // console.log("Updated record Status line 261: ", record);
                            timelineObject = {
                                id: uuid(),
                                investmentId: investmentId,
                                userId: userId,
                                walletId: walletId,
                                action: 'investment activated',
                                // @ts-ignore
                                message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated.`,
                                adminMessage: `${firstName} investment of ${currencyCode} ${amount} was activated.`,
                                createdAt: selectedInvestmentRequestUpdate.startDate,
                                metadata: `duration: ${selectedInvestmentRequestUpdate.duration}, payout date : ${selectedInvestmentRequestUpdate.payoutDate}`,
                            }
                            // console.log('Timeline object line 276:', timelineObject)
                            await timelineService.createTimeline(timelineObject);
                            // Send Details to notification service
                            //         let subject = "AstraPay Investment Activation";
                            //         let message = `
                            // ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${selectedInvestmentRequestUpdate.duration} days, has been activated on ${selectedInvestmentRequestUpdate.startDate} and it will be mature for payout on ${selectedInvestmentRequestUpdate.payoutDate}.

                            // Please check your device.

                            // Thank you.

                            // AstraPay Investment.`;
                            //         let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                            //         // console.log("newNotificationMessage line 289:", newNotificationMessage);
                            //         if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                            //             console.log("Notification sent successfully");
                            //         } else if (newNotificationMessage.message !== "Success") {
                            //             console.log("Notification NOT sent successfully");
                            //             console.log(newNotificationMessage);
                            //         }
                            // Send Notification to admin and others stakeholder
                            let investment = selectedInvestmentRequest;
                            let messageKey = "activation";
                            // let newNotificationMessageWithoutPdf = await 
                            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // // console.log("newNotificationMessage line 300:", newNotificationMessageWithoutPdf);
                            // // debugger
                            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            //     console.log("Notification sent successfully");
                            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            //     console.log("Notification NOT sent successfully");
                            //     console.log(newNotificationMessageWithoutPdf);
                            // }

                        } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                            console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${investorFundingWalletId} for investment activation line 315 ============`);
                            let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                            await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                            let timelineObject = {
                                id: uuid(),
                                action: "investment activation failed",
                                investmentId: investmentId,
                                walletId: walletId,
                                userId: userId,
                                message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}, please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
                                adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
                                createdAt: DateTime.now(),
                                metadata: ``,
                            };
                            await timelineService.createTimeline(timelineObject);
                            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf("activation_failed", rfiCode, selectedInvestmentRequest);
                            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                                console.log("Notification sent successfully");
                            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                                console.log("Notification NOT sent successfully");
                                console.log(newNotificationMessageWithoutPdf);
                            }
                            // throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                            console.log("investment activation failed", `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`)
                        }
                        //  if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                        //     console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${investorFundingWalletId} for investment activation line 315 ============`);
                        //     // debugger
                        //     let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        //     // console.log(" Current log, line 313 :", currentInvestment);
                        //     // send for update
                        //     await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);

                        //     // update timeline
                        //     timelineObject = {
                        //         id: uuid(),
                        //         action: "investment activation failed",
                        //         investmentId: investmentId,//id,
                        //         walletId: walletId,// walletId,
                        //         userId: userId,// userId,
                        //         // @ts-ignore
                        //         message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
                        //         adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
                        //         createdAt: DateTime.now(),
                        //         metadata: ``,
                        //     };
                        //     // console.log("Timeline object line 329:", timelineObject);
                        //     await timelineService.createTimeline(timelineObject);
                        //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                        //     // console.log("new Timeline object line 332:", newTimeline);
                        //     // update record
                        //     // debugger

                        //     // Send Notification to admin and others stakeholder
                        //     let investment = selectedInvestmentRequest;
                        //     let messageKey = "activation_failed";
                        //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        //     // console.log("newNotificationMessage line 340:", newNotificationMessageWithoutPdf);
                        //     // debugger
                        //     if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                        //         console.log("Notification sent successfully");
                        //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                        //         console.log("Notification NOT sent successfully");
                        //         console.log(newNotificationMessageWithoutPdf);
                        //     }


                        //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                        //     // console.log(" Current log, line 351 =========:", updatedInvestment);
                        //     // console.log("debitUserWalletForInvestment reponse data 352 ==================================", debitUserWalletForInvestment)
                        //     // debugger
                        //     // throw Error(debitUserWalletForInvestment);
                        //     throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                        //     // return {
                        //     //         status: "FAILED",//debitUserWalletForInvestment.status,
                        //     //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                        //     //     };
                        // }


                    } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                        // update the value for number of attempts
                        // get the current investmentRef, split , add one to the current number, update and try again
                        let getNumberOfAttempt = investmentRequestReference.split("_");
                        // console.log("getNumberOfAttempt line 367 =====", getNumberOfAttempt[1]);
                        let updatedNumberOfAttempts = numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
                        let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                        let newPaymentReference = `${uniqueInvestmentRequestReference}-${updatedNumberOfAttempts}`;
                        // console.log("Customer Transaction Reference ,@ InvestmentsController line 371 ==================")
                        // console.log(newPaymentReference);
                        investmentRequestReference = newPaymentReference;
                        debugger;
                        selectedInvestmentRequestUpdate.investmentRequestReference = newPaymentReference;
                        selectedInvestmentRequestUpdate.numberOfAttempts = updatedNumberOfAttempts;
                        // Send to the endpoint for debit of wallet
                        let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
                            senderName,
                            senderAccountNumber,
                            senderAccountName,
                            senderPhoneNumber,
                            senderEmail,
                            rfiCode, userId,)
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
                            adminMessage: `${firstName} investment request was approved.`,
                            createdAt: DateTime.now(),
                            metadata: ``,
                        };
                        // console.log("Timeline object line 396:", timelineObject);
                        await timelineService.createTimeline(timelineObject);

                        // Send Notification to admin and others stakeholder
                        let investment = selectedInvestmentRequest;
                        let messageKey = "approval";
                        // let newNotificationMessageWithoutPdf = await 
                        sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                        // // console.log("newNotificationMessage line 403:", newNotificationMessageWithoutPdf);
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
                        let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                        // console.log(" Current log, line 221 :", currentInvestment);
                        // send for update
                        await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                        // let updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                        // console.log(" Current log, line 224 :", updatedInvestment);
                        // if successful
                        if (debitUserWalletForInvestment && debitUserWalletForInvestment.status == 200) {
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
                            await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                            // updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                            // console.log(" Current log, line 257 :", updatedInvestment);

                            // console.log("Updated record Status line 259: ", record);
                            timelineObject = {
                                id: uuid(),
                                investmentId: investmentId,
                                userId: userId,
                                walletId: walletId,
                                action: 'investment activated',
                                // @ts-ignore
                                message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated.`,
                                adminMessage: `${firstName} investment of ${currencyCode} ${amount} was activated.`,
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
                            // let newNotificationMessageWithoutPdf = await 
                            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // // console.log("newNotificationMessage line 316:", newNotificationMessageWithoutPdf);
                            // // debugger
                            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            //     console.log("Notification sent successfully");
                            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            //     console.log("Notification NOT sent successfully");
                            //     console.log(newNotificationMessageWithoutPdf);
                            // }

                        } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
                            console.log(`Unsuccessful debit of user with ID: ${userId} and walletId : ${walletId} for investment activation line 500 ============`);
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
                                message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
                                adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
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
                            // let newNotificationMessageWithoutPdf = await 
                            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // // console.log("newNotificationMessage line 371:", newNotificationMessageWithoutPdf);
                            // // debugger
                            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            //     console.log("Notification sent successfully");
                            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            //     console.log("Notification NOT sent successfully");
                            //     console.log(newNotificationMessageWithoutPdf);
                            // }


                            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                            // console.log(" Current log, line 320 =========:", updatedInvestment);
                            // console.log("debitUserWalletForInvestment reponse data 321 ==================================", debitUserWalletForInvestment)
                            // debugger
                            // throw Error(debitUserWalletForInvestment);
                            // throw Error(`${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`);
                            console.log("investment activation failed", `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`)
                            // return {
                            //         status: "FAILED",//debitUserWalletForInvestment.status,
                            //         message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                            //     };
                        }
                    }

                } else if (saveApproval.approvalStatus.toLowerCase() === "declined") {
                    // update the neccesary field
                    // console.log("selectedInvestmentRequest ========================================================")
                    // console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "declined" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_declined";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // TODO: handle remark
                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);

                    let { firstName, walletId, userId, } = selectedInvestmentRequestUpdate;
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment declined",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment request has been declined. Please try again. Thank you.`,
                        adminMessage: `${firstName} investment request was declined.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 383:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                }

            } else if (saveApproval.requestType === "start_investment_rollover") {
                // get the request by request id
                // update status based on admin action

                if (saveApproval.approvalStatus.toLowerCase() === "approved") {
                    // update the neccesary field
                    // console.log("selectedInvestmentRequest ========================================================")
                    // console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    // selectedInvestmentRequestUpdate.status = "investment_approved";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // TODO: handle remark
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                    //  TODO: Debit user wallet to activate the investment
                    // Data to send for transfer of fund
                    let {
                        amount,
                        //lng, lat, investmentRequestReference,
                        firstName, //lastName,
                        walletId, userId,
                        // phone,
                        //email,
                        rfiCode,
                        currencyCode
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
                        adminMessage: `${firstName} investment rollover request was approved.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 190:", timelineObject);
                    await timelineService.createTimeline(timelineObject);

                    // Send Notification to admin and others stakeholder
                    let investment = selectedInvestmentRequest;
                    let messageKey = "approval";
                    // let newNotificationMessageWithoutPdf = await 
                    sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // // console.log("newNotificationMessage line 497:", newNotificationMessageWithoutPdf);
                    // // debugger
                    // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    //     console.log("Notification sent successfully");
                    // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    //     console.log("Notification NOT sent successfully");
                    //     console.log(newNotificationMessageWithoutPdf);
                    // }

                    // update record
                    let currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 508 :", currentInvestment);
                    // send for update
                    await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    // let updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
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
                    await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    // updatedInvestment = await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    // console.log(" Current log, line 344 :", updatedInvestment);

                    // console.log("Updated record Status line 1281: ", record);
                    timelineObject = {
                        id: uuid(),
                        investmentId: investmentId,
                        userId: userId,
                        walletId: walletId,
                        action: 'investment rollover activated',
                        // @ts-ignore
                        message: `${firstName}, your investment rollover of ${currencyCode} ${amount} has been activated.`,
                        adminMessage: `${firstName} investment rollover of ${currencyCode} ${amount} was activated.`,
                        createdAt: selectedInvestmentRequestUpdate.startDate,
                        metadata: `duration: ${selectedInvestmentRequestUpdate.duration}, payout date : ${selectedInvestmentRequestUpdate.payoutDate}`,
                    }
                    // console.log('Timeline object line 543:', timelineObject)
                    await timelineService.createTimeline(timelineObject);


                    currentInvestment = await investmentService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                    // console.log(" Current log, line 577 :", currentInvestment);
                    // send for update
                    await investmentService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
                    
                    // Send Notification to admin and others stakeholder
                    //  investment = record;
                    messageKey = "activation";
                    // newNotificationMessageWithoutPdf = await 
                    sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // // console.log("newNotificationMessage line 567:", newNotificationMessageWithoutPdf);
                    // // debugger
                    // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    //     console.log("Notification sent successfully");
                    // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    //     console.log("Notification NOT sent successfully");
                    //     console.log(newNotificationMessageWithoutPdf);
                    // }

                } else if (saveApproval.approvalStatus.toLowerCase() === "declined") {
                    // update the neccesary field
                    // console.log("selectedInvestmentRequest ========================================================")
                    // console.log(selectedInvestmentRequest)
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
                        walletId, investorFundingWalletId,
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
                    let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
                    let beneficiaryAccountName = beneficiaryName;
                    let beneficiaryPhoneNumber = phone;
                    let beneficiaryEmail = email;
                    // Send to the endpoint for debit of wallet
                    let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;

                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment activation declined",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to admin approval decline. Thank you.`,
                        adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} approval was decline.`,
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
                    // ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

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
                    // let newNotificationMessageWithoutPdf = await 
                    sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // // console.log("newNotificationMessage line 661:", newNotificationMessageWithoutPdf);
                    // // debugger
                    // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    //     console.log("Notification sent successfully");
                    // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    //     console.log("Notification NOT sent successfully");
                    //     console.log(newNotificationMessageWithoutPdf);
                    // };
                    let creditUserWalletWithPrincipal;
                    // Check if the amount is not Zero or less
                    if (amount <= 0) {
                        creditUserWalletWithPrincipal = {
                            status: 200,
                            data: { screenStatus: "APPROVED" }
                        }
                        debugger
                    } else {
                        // Credit the user wallet with the amount to be rollover
                        // Payout the amount that is to be rollover
                        creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                            beneficiaryName,
                            beneficiaryAccountNumber,
                            beneficiaryAccountName,
                            beneficiaryEmail,
                            beneficiaryPhoneNumber,
                            rfiCode, userId,
                            descriptionForPrincipal)
                        debugger
                    }
                        // if successful
                        let decPl = 3;
                        // if ( creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200  && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                        if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
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
                                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the admin declined the approval of the investment rollover. Thank you.`,
                                adminMessage: `The sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment was paid because the approval of the investment rollover was declined.`,
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
                            // let newNotificationMessageWithoutPdf = await 
                            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // // console.log("newNotificationMessage line 754:", newNotificationMessageWithoutPdf);
                            // // debugger
                            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            //     console.log("Notification sent successfully");
                            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            //     console.log("Notification NOT sent successfully");
                            //     console.log(newNotificationMessageWithoutPdf);
                            // }

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
                                adminMessage: `The payout of the sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment failed.`,
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
                            // let newNotificationMessageWithoutPdf = await 
                            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                            // // console.log("newNotificationMessage line 834:", newNotificationMessageWithoutPdf);
                            // // debugger
                            // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                            //     console.log("Notification sent successfully");
                            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                            //     console.log("Notification NOT sent successfully");
                            //     console.log(newNotificationMessageWithoutPdf);
                            // }

                        }
                        // console.log("creditUserWalletForInvestment reponse data 743 ==================================", debitUserWalletForInvestment)
                        // debugger
                    
                }

            } else if (saveApproval.requestType === "payout_investment") {
                debugger
                const selectedInvestmentPayoutRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus.toLowerCase() === "approved") {
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "approved" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.status = "approved";
                    // selectedInvestmentPayoutRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // debugger
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                } else if (saveApproval.approvalStatus.toLowerCase() === "declined") {
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "investment_payout_declined" //saveApproval.approvalStatus;
                    // selectedInvestmentPayoutRequestUpdate.status = "investment_payout_declined";
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
                        adminMessage: `${firstName} investment payout request was declined.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 823:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                } else if (saveApproval.approvalStatus.toLowerCase() === "suspend_payout" && saveApproval.isPayoutSuspended === true) {
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    debugger
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "payout_suspended" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.isPayoutSuspended = true;
                    // selectedInvestmentPayoutRequestUpdate.status = "payout_suspended";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    debugger
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment payout suspended",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment payout has been suspended. Thank you.`,
                        adminMessage: `${firstName} investment payout was suspended.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 849:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                } else if (saveApproval.approvalStatus.toLowerCase() === "suspend_rollover" && saveApproval.isRolloverSuspended === true) {
                    debugger
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "rollover_suspended" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.isRolloverSuspended = true;
                    // selectedInvestmentPayoutRequestUpdate.status = "rollover_suspended";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    debugger
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment rollover suspended",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment rollover request has been suspended. Thank you.`,
                        adminMessage: `${firstName} investment rollover request was suspended.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 383:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                }else if (saveApproval.approvalStatus.toLowerCase() === "activate_payout" && saveApproval.isPayoutSuspended === false) {
                                        debugger
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "payout_activated" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.isPayoutSuspended = false;
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    debugger
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment payout activated",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment payout has been activated. Thank you.`,
                        adminMessage: `${firstName} investment payout was activated.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 849:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                } else if (saveApproval.approvalStatus.toLowerCase() === "activate_rollover" && saveApproval.isRolloverSuspended === false) {
                    debugger
                    // update the neccesary field
                    // console.log("selectedInvestmentPayoutRequest ========================================================")
                    // console.log(selectedInvestmentPayoutRequest)
                    let selectedInvestmentPayoutRequestUpdate = selectedInvestmentPayoutRequest;
                    selectedInvestmentPayoutRequestUpdate.approvalStatus = "rollover_activated" //saveApproval.approvalStatus;
                    selectedInvestmentPayoutRequestUpdate.isRolloverSuspended = false;
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentPayoutRequest, selectedInvestmentPayoutRequestUpdate);
                    let { firstName, walletId, userId, } = selectedInvestmentPayoutRequestUpdate;
                    debugger
                    // update timeline
                    timelineObject = {
                        id: uuid(),
                        action: "investment rollover activated",
                        investmentId: investmentId,//id,
                        walletId: walletId,// walletId,
                        userId: userId,// userId,
                        // @ts-ignore
                        message: `${firstName}, your investment rollover request has been activated. Thank you.`,
                        adminMessage: `${firstName} investment rollover request was activated.`,
                        createdAt: DateTime.now(),
                        metadata: ``,
                    };
                    // console.log("Timeline object line 383:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                }

            } else if (saveApproval.requestType === "liquidate_investment") {
                const selectedInvestmentTerminationRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus.toLowerCase() === "approved") {
                    // update the neccesary field
                    // console.log("selectedInvestmentTerminationRequest ========================================================")
                    // console.log(selectedInvestmentTerminationRequest)
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
                        adminMessage: `${selectedInvestmentTerminationRequest.firstName} investment liquidation request was approved.`,
                        createdAt: DateTime.now(),
                        metadata: `request type : ${selectedApproval.requestType}`,
                    };
                    // console.log("Timeline object line 964:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 967:", newTimeline);
                    let loginUserData;
                    let query = {};
                    // Send to investmentsService for processing of liquidation
                    await investmentService.liquidateInvestment(saveApproval.investmentId, query, loginUserData);
                    debugger
                } else if (saveApproval.approvalStatus.toLowerCase() === "declined") {
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
                        adminMessage: `${selectedInvestmentTerminationRequest.firstName} investment liquidation request was declined.`,
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
                    // let newNotificationMessageWithoutPdf = await 
                    sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // // console.log("newNotificationMessage line 2563:", newNotificationMessageWithoutPdf);
                    // // debugger
                    // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    //     console.log("Notification sent successfully");
                    // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    //     console.log("Notification NOT sent successfully");
                    //     console.log(newNotificationMessageWithoutPdf);
                    // }
                }

            }

            debugger
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
        if (queryFields.email) {
            predicateExists()
            predicate = predicate + "email=?";
            params.push(queryFields.email)

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
        if (queryFields.approvedBy) {
            predicateExists()
            predicate = predicate + "approved_by=?";
            params.push(queryFields.approvedBy)
        }
        if (queryFields.rfiCode) {
            predicateExists()
            predicate = predicate + "rfi_code=?";
            params.push(queryFields.rfiCode)
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
