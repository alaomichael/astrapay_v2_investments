/* eslint-disable eqeqeq */
/* eslint-disable no-//debugger */
/* eslint-disable prettier/prettier */
import { debitUserWallet } from 'App/Helpers/debitUserWallet';
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Approval from "App/Models/Approval";
import Event from "@ioc:Adonis/Core/Event";
// import { sendNotification } from "App/Helpers/sendNotification";
import TimelinesServices from "App/Services/TimelinesServices";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import InvestmentsServices from "App/Services/InvestmentsServices";
import CreateApprovalValidator from "App/Validators/CreateApprovalValidator";
import { ApprovalType } from "App/Services/types/approval_type";
import ApprovalsServices from "App/Services/ApprovalsServices";
import UpdateApprovalValidator from "App/Validators/UpdateApprovalValidator";
import AppException from "App/Exceptions/AppException";
import { creditUserWallet } from 'App/Helpers/creditUserWallet';
import { sendNotificationWithPdf } from 'App/Helpers/sendNotificationWithPdf';
import SettingsServices from 'App/Services/SettingsServices';
import { sendNotificationWithoutPdf } from 'App/Helpers/sendNotificationWithoutPdf';
import { checkTransactionStatus } from 'App/Helpers/checkTransactionStatus';
import { dueForPayout } from 'App/Helpers/utils';
import { convertDateToFormat } from 'App/Helpers/convertDateToFormat';

const randomstring = require("randomstring");
const Env = require("@ioc:Adonis/Core/Env");
const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const TRANSACTION_PREFIX = Env.get("TRANSACTION_PREFIX");

export default class ApprovalsController {
  public async index({ params, request, response }: HttpContextContract) {
    try {
      // const investmentlogsService = new InvestmentLogsServices();
      const investmentsService = new InvestmentsServices();
      const approvalsService = new ApprovalsServices();

      let approvalArray: any[] = [];
      console.log("Approvals params: ", params);
      // const { walletId, investmentId, requestType, approvalStatus, remark } = request.qs();
      console.log("Approvals query: ", request.qs());
      let { limit } = request.qs();
      // if (!limit) throw new Error("Limit query parameter is required for this request.");
      const approval = await approvalsService.getApprovals(request.qs()); // Approval.all();
      let sortedApprovals = approval;
      const totalCount = await approvalsService.getApprovalsCount(request.qs());
      
      // console.log("approval line 40 ===================");
      // console.log(approval);
      if (limit) {
        sortedApprovals = sortedApprovals.slice(0, Number(limit));
      }
      if (sortedApprovals.length < 1) {
        return response.status(200).json({
          status: "OK",
          message: "no approval request matched your search",
          data: null,
          totalCount,
        });
      }

      for (let index = 0; index < sortedApprovals.length; index++) {
        const approval = sortedApprovals[index];
        // console.log("approval line 59 ===================");
        // console.log(approval);

        // console.log("approval line 62 ===================");
        // console.log(approval.$original.investmentId);
        let investment;
        if (approval.$original.investmentId) {
          investment = await investmentsService.getInvestmentByInvestmentId(approval.$original.investmentId);
        }
        // console.log("investment line 75 ===================");
        // console.log(investment);
        // if ((investment == null || investment == undefined) && (linkAccount == null || linkAccount == undefined)) return response.json({ status: "FAILED", data: nullll });
        if (investment) {
          let approvalWithInvestmentDetails = {
            ...approval.$original,
            investmentDetails: investment.$original,
          };
          // console.log("approvalWithInvestmentDetails line 69 ===================");
          // console.log(approvalWithInvestmentDetails);
          approvalArray.push(approvalWithInvestmentDetails);
        }
        // approvalArray.push(approval);
        // console.log("approvalArray line 74 ===================");
        // console.log(approvalArray);
      }

      return response.status(200).json({
        status: "OK",
        data: approvalArray,
        // data: sortedApprovals.map((approval) => approval.$original),
        totalCount,
      });
    } catch (error) {
      console.log("Error line 79", error.messages);
      console.log("Error line 80", error.message);
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      }
      return response.status(500).json({
        status: "FAILED",
        message: error.messages,
        hint: error.message
      });
    }
  }

  public async store({ request, response }: HttpContextContract) {
    try {
      await request.validate(CreateApprovalValidator);
      // const investmentlogsService = new InvestmentLogsServices();
      const investmentsService = new InvestmentsServices();
      const approvalsService = new ApprovalsServices()
      // const remarksService = new RemarksServices();
      // const approvalSchema = schema.create({
      //     walletId: schema.string(),
      //     investmentId: schema.string(),
      //     userId: schema.string(),
      //     requestType: schema.string({ escape: true }, [rules.maxLength(50)]),
      // });
      // const payload: any = await request.validate({ schema: approvalSchema });
      const { walletId, investmentId, userId, requestType, approvalStatus, assignedTo, processedBy, rfiCode, approvedBy,email// remark,
      } = request.body();
      const payload: ApprovalType = {
        walletId: walletId,
        investmentId: investmentId,
        userId: userId,
        requestType: requestType,
        approvalStatus: approvalStatus,
        assignedTo: assignedTo,
        processedBy: processedBy,
        rfiCode: rfiCode,
        approvedBy: approvedBy,
        email: email
      }

      // console.log("Admin remark =================", remark);
      // const approval = await approvalsService.createApproval(payload);
      // const setting = await investmentsService.createInvestment(payload);

      // check if the request is not existing
      let approval;
      // let investmentIsExisting = await Investment.query().where({
      //     wallet_id: payload.walletId,
      //     user_id: payload.userId,
      //     id: payload.investmentId,
      // });
      let investmentIsExisting = await investmentsService.getInvestmentByInvestmentId(payload.investmentId);
      if (investmentIsExisting) {
        // let requestIsExisting = await Approval.query().where({
        //     wallet_id: payload.walletId,
        //     user_id: payload.userId,
        //     investment_id: payload.investmentId,
        // });
        let requestIsExisting = await approvalsService.getApprovalByInvestmentId(payload.investmentId)
        //  Approval.query().where({
        //     wallet_id: payload.walletId,
        //     user_id: payload.userId,
        //     investment_id: payload.investmentId,
        // });

        // console.log("Existing Approval Request details: ", requestIsExisting);
        if (!requestIsExisting) {
          approval = await approvalsService.createApproval(payload);
          // approval = await Approval.create(payload);
          // @ts-ignore
          // approval.status = 'active'
          // await approval.save();
          // console.log("The new approval request:", approval);
          // console.log("A New approval request has been Created.");

          // TODO: Use Remark
          // if (remark) {
          //   for (let index = 0; index < remark.length; index++) {
          //     const currentRemark = remark[index];
          //     let { field, reason } = currentRemark;
          //     let remarksObject = {
          //       investmentId: investmentId,
          //       field,
          //       reason
          //     }
          //     let remarkIsExisting = await remarksService.getRemarkByFieldAndInvestmentId(field, investmentId)
          //     // if it has, update
          //     if (remarkIsExisting) {
          //       let updatedRemark = await remarksService.updateRemark(remarkIsExisting, remarksObject);
          //       console.log("updated Remark object line 178:", updatedRemark);

          //     } else {
          //       // if it does not have create new remark
          //       let newRemark = await remarksService.createRemark(remarksObject);
          //       console.log("new Remark object line 183:", newRemark);

          //       // create new verification timeline
          //     }
          //   }
          // }
          // Save approval new status to Database
          // await approval.save();
          //TODO: Send approval Creation Message to Queue
          // @ts-ignore
          Event.emit("new:approval", {
            id: approval.id,
            extras: approval.requestType,
          });
          return response
            .status(201)
            .json({ status: "OK", data: approval.$original });
        } else {
          //  Update approval request
          approval = requestIsExisting;
          if (approval.requestType === payload.requestType) {
            console.log("No update was made, because the request is similar to the current one.");
            return response
              .status(201)
              .json({ status: "OK", data: approval.$original });
          }
          approval.requestType = payload.requestType;
          approval.approvalStatus = "pending"; //payload.approvalStatus
          // approval.remark = "";
          // TODO: Use Remark
          // if (remark) {
          //   for (let index = 0; index < remark.length; index++) {
          //     const currentRemark = remark[index];
          //     let { field, reason } = currentRemark;
          //     let remarksObject = {
          //       investmentId: investmentId,
          //       field,
          //       reason
          //     }
          //     let remarkIsExisting = await remarksService.getRemarkByFieldAndInvestmentId(field, investmentId)
          //     // if it has, update
          //     if (remarkIsExisting) {
          //       let updatedRemark = await remarksService.updateRemark(remarkIsExisting, remarksObject);
          //       console.log("updated Remark object line 292:", updatedRemark);

          //     } else {
          //       // if it does not have create new remark
          //       let newRemark = await remarksService.createRemark(remarksObject);
          //       console.log("new Remark object line 297:", newRemark);

          //       // create new verification timeline
          //     }
          //   }
          // }

          await approval.save();
          // @ts-ignore
          Event.emit("new:approval", {
            id: approval.id,
            extras: approval.requestType,
          });
          return response
            .status(201)
            .json({ status: "OK", data: approval.$original });
        }
      } else {
        return response.status(404).json({
          status: "FAILED",
          message:
            "No approval data matched your approval request search, please try again.",
          data: null,
        });
      }
    } catch (error) {
      console.error(error);
      // return response.status(404).json({
      //   status: "FAILED",
      //   message: "your approval request was not successful, please try again.",
      // });
      console.log("Error line 256", error.messages);
      console.log("Error line 257", error.message);
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      }
      return response.status(500).json({
        status: "FAILED",
        message: error.messages,
        hint: error.message
      });


    }
  }

  public async update({ request, response, loginUserData }: HttpContextContract) {
    try {
      console.log("Entering update 291 ==================================")
      // const investmentlogsService = new InvestmentLogsServices();
      const investmentsService = new InvestmentsServices();
      await request.validate(UpdateApprovalValidator);
      const approvalsService = new ApprovalsServices()
      const { id, } = request.params();
      // console.log("Approval query: ", request.qs());
      const { approvalStatus,email, assignedTo, processedBy, approvedBy } = request.body();
      const { isRolloverSuspended, isPayoutSuspended, } = request.body();
      debugger
      let { rolloverReactivationDate, payoutReactivationDate, } = request.body();
      rolloverReactivationDate = rolloverReactivationDate ? rolloverReactivationDate : DateTime.now().plus({ months: 6 });
      payoutReactivationDate = payoutReactivationDate ? payoutReactivationDate : DateTime.now().plus({ months: 6 });

      // rolloverReactivationDate = await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY");
      // payoutReactivationDate = await convertDateToFormat(payoutReactivationDate, "DD-MM-YYYY");

      // console.log("rolloverReactivationDate line 302 @ApprovalContoller ", rolloverReactivationDate)
      // console.log("payoutReactivationDate line 303 @ApprovalContoller ", payoutReactivationDate);
      // //debugger
      // remark
      // check if the request is not existing
      let approval;
      let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
      // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
      debugger
      if (!approvalRequestIsExisting) {
        //    return error message to user
        // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
        throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
      }

      let currentApprovalStatus = approvalRequestIsExisting.approvalStatus;
      console.log(" Login User Data line 426 =========================");
      console.log(loginUserData);
     
      const timelineService = new TimelinesServices();
      
      approval = approvalRequestIsExisting; //await approvalsService.getApprovalByApprovalId(id);

      // console.log(" QUERY RESULT: ", approval);
      let walletIdToSearch = approval.walletId
      let userIdToSearch = approval.userId
      let investmentId;
      let record;
      // console.log("investmentId line 458 ===================================", approval.investmentId)
      // console.log("linkAccountId line 459 ===================================", approval.linkAccountId)
      // console.log("tokenId line 460 ===================================", approval.tokenId)
      // console.log("cardId line 461 ===================================", approval.cardId)
      // console.log("accountId line 462 ===================================", approval.accountId)
      if (approval.investmentId != null) {
        investmentId = approval.investmentId;
        record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
        // //debugger
      }
      // console.log(" idToSearch RESULT ===============================: ", idToSearch);
      // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
      // console.log(" record RESULT ===============================: ", record);
      // console.log("check approval record 339 ==================================")
      // //debugger
      if (!approval || record == undefined || !record) {
        return response
          .status(404)
          .json({ status: "FAILED", message: "Not Found,try again.", data: null });
      }
      // console.log(" QUERY RESULT for record: ", record.$original);
      // console.log(" currentApprovalStatus line 354 === ", currentApprovalStatus);
      debugger
      if ((approval && currentApprovalStatus == "pending") || (approval && currentApprovalStatus == "suspend_payout") || (approval && currentApprovalStatus == "suspend_rollover") || (approval && currentApprovalStatus == "rollover") || (approval && currentApprovalStatus == "activate_rollover") || (approval && currentApprovalStatus == "activate_payout")) {
        // console.log("Investment approval Selected for Update line 357:");

        let payload: ApprovalType = {
          walletId: approval.walletId,
          investmentId: approval.investmentId,
          userId: approval.userId,
          requestType: approval.requestType,
          approvalStatus: approvalStatus,
          assignedTo: assignedTo,
          processedBy: processedBy,
          rfiCode: approval.rfiCode,
          approvedBy: approvedBy,
          email: email
          // remark: approval.remark,

        }
        // update the data
       
        approval = await approvalsService.updateApproval(approval, payload);
        // console.log("Approval updated: ", approval);
        let newStatus;
      
        let { id, firstName, currencyCode, lastName, //email,
          rfiCode,userId } = record;
        console.log("Surname: ", lastName)
        const settingsService = new SettingsServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
        // //debugger
        if (!settings) {
          throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
        }
       
        let timelineObject;
        // console.log("Approval.requestType: ===========================================>", approval.requestType)
        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
        // console.log("Approval.approvalStatus: ===========================================>", record.status)
        // isRolloverSuspended = isRolloverSuspended ? isRolloverSuspended : record.isRolloverSuspended;
        // isPayoutSuspended = isPayoutSuspended ? isPayoutSuspended : record.isPayoutSuspended;
        // //debugger
        if (approval.requestType === "start_investment" && approval.approvalStatus === "approved" && record.status === "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment request processing line 511: ===========================================>")
          // newStatus = "submitted";
          newStatus = "investment_approved"; //'pending_account_number_generation';
          record.status = newStatus;
          record.requestType = "start_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";

          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus; // "investment_approved"//approval.approvalStatus;

          // Save the updated record
          // await record.save();
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 424 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 428 =========:", updatedInvestment);
          //debugger


          // console.log("Updated record Status line 431: ", record);
          // Data to send for transfer of fund
          let { amount, lng, lat, investmentRequestReference,
            firstName, lastName,
            // walletId,
            investorFundingWalletId,
            phone,
            email,
            rfiCode,// numberOfAttempts 
          } = record;
          let senderName = `${firstName} ${lastName}`;
          let senderAccountNumber = investorFundingWalletId;//walletId;
          let senderAccountName = senderName;
          let senderPhoneNumber = phone;
          let senderEmail = email;

          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment approved",
            investmentId: investmentId,//id,
            walletId: walletIdToSearch,// walletId,
            userId: userIdToSearch,// userId,
            // @ts-ignore
            message: `${firstName}, your investment request has been approved, please wait while the investment is activated. Thank you.`,
            adminMessage: `${firstName} investment request was approved.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 551:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 553:", newTimeline);
          // update record

          // Send Details to notification service
          // let subject = "AstraPay Investment Approval";
          // let message = `
          //       ${firstName} this is to inform you, that your Investment request, has been approved.

          //       Please wait while the investment is being activated.

          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // // console.log("newNotificationMessage line 567:", newNotificationMessage);
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }
          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "approval";
          let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
          //debugger
          if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessageWithoutPdf);
          }


          // // Data to send for transfer of fund
          // let { amount, lng, lat, investmentRequestReference,
          //   firstName, lastName,
          //   walletId,
          //   phone,
          //   email,
          //   rfiCode } = record;
          // let senderName = `${firstName} ${lastName}`;
          // let senderAccountNumber = walletId;
          // let senderAccountName = senderName;
          // let senderPhoneNumber = phone;
          // let senderEmail = email;
          // check if transaction with same customer ref exist
          let checkTransactionStatusByCustomerRef = await checkTransactionStatus(investmentRequestReference, rfiCode);
          // //debugger
          // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
          //debugger

          // if (!checkTransactionStatusByCustomerRef)
          if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
            // initiate a new  transaction
            // Send to the endpoint for debit of wallet
            let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
              senderName,
              senderAccountNumber,
              senderAccountName,
              senderPhoneNumber,
              senderEmail,
              rfiCode, userId,)
            //debugger
            // console.log("debitUserWalletForInvestment reponse data 527 ==================================", debitUserWalletForInvestment)
            // if successful
            if (debitUserWalletForInvestment && debitUserWalletForInvestment.status == 200) {
              // update the investment details
              record.status = 'active'
              // record.approvalStatus = 'approved'
              record.startDate = DateTime.now() //.toISODate()
              record.payoutDate = DateTime.now().plus({ days: record.duration })
              record.isInvestmentCreated = true
              // console.log("Updated record Status line 537: ", record);

              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 540 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 544 =========:", updatedInvestment);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment activation",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated. Thank you.`,
                adminMessage: `${firstName} investment of ${currencyCode} ${amount} was activated.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 558:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 561:", newTimeline);
              // update record
              // //debugger
              // Send Details to notification service
              let subject = `${rfiCode.toUpperCase()} Investment Activation`;
              let message = `
              ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} has been activated.

              Please check your device.

              Thank you.

              ${rfiCode.toUpperCase()} Investment.`;
              // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              // console.log("newNotificationMessage line 575:", newNotificationMessage);
              // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessage.message !== "Success") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessage);
              // }
              // //debugger

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
              // console.log("newNotificationMessage line 596:", newNotificationMessageWithPdf);
              //debugger
              if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithPdf);
              }

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "activation";
              let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // console.log("newNotificationMessage line 609:", newNotificationMessageWithoutPdf);
              //debugger
              if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
              }

            } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 620 :", currentInvestment);
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
                message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
                // @ts-ignore
                adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} has failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 636:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 639:", newTimeline);
              // update record
              // //debugger
              // Send Details to notification service
              // let subject = "AstraPay Investment Activation Failed";
              // let message = `
              //     ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

              //     Thank you.

              //     AstraPay Investment.`;
              // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              // // console.log("newNotificationMessage line 651:", newNotificationMessage);
              // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessage.message !== "Success") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessage);
              // }

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "activation_failed";
              let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // console.log("newNotificationMessage line 663:", newNotificationMessageWithoutPdf);
              //debugger
              if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
              }


              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 674 =========:", updatedInvestment);
              // console.log("debitUserWalletForInvestment reponse data 675 ==================================", debitUserWalletForInvestment)
              //debugger
              // throw Error(debitUserWalletForInvestment);
              return response
                .status(200)
                .json({
                  status: "OK",//debitUserWalletForInvestment.status,
                  message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                });
            }

          } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
            // update the value for number of attempts
            // get the current investmentRef, split , add one to the current number, update and try again
            //  TODO: Add numberOfAttempts column value
            let getNumberOfAttempt = investmentRequestReference.split("_");
            // console.log("getNumberOfAttempt line 690 =====", getNumberOfAttempt[1]);
            let updatedNumberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
            // console.log(updatedNumberOfAttempts)
            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
            let newPaymentReference = `${uniqueInvestmentRequestReference}_${updatedNumberOfAttempts}`;
            // console.log("Customer Transaction Reference ,@ InvestmentsController line 694 ==================")
            // console.log(newPaymentReference);
            investmentRequestReference = newPaymentReference;
            record.numberOfAttempts = updatedNumberOfAttempts;
            // Send to the endpoint for debit of wallet
            let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
              senderName,
              senderAccountNumber,
              senderAccountName,
              senderPhoneNumber,
              senderEmail,
              rfiCode,userId)
            //debugger
            // console.log("debitUserWalletForInvestment reponse data 706 ==================================", debitUserWalletForInvestment)
            // if successful
            if (debitUserWalletForInvestment && debitUserWalletForInvestment.status == 200) {
              // update the investment details
              record.status = 'active';
              //debugger
              // record.approvalStatus = 'approved'
              record.startDate = DateTime.now() //.toISODate()
              record.payoutDate = DateTime.now().plus({ days: record.duration })
              record.isInvestmentCreated = true
              // console.log("Updated record Status line 715: ", record);

              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 719 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 723 =========:", updatedInvestment);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment activation",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated.`,
                adminMessage: `${firstName} investment of ${currencyCode} ${amount} was activated.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 737:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 740:", newTimeline);
              // update record
              // //debugger
              // Send Details to notification service
              let subject = `${rfiCode.toUpperCase()} Investment Activation`;
              let message = `
      ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} has been activated.

      Please check your device.

      Thank you.

      ${rfiCode.toUpperCase()} Investment.`;
              // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              // console.log("newNotificationMessage line 754:", newNotificationMessage);
              // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessage.message !== "Success") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessage);
              // }
              // //debugger

              // START OF NEW NOTIFICATION WITH CERTIFICATE ATTACHMENT AS PDF
              let recepients = [
                {
                  "email": email,
                  "name": `${firstName} ${lastName} `
                },
                // {
                //   "email": activationNotificationEmail,
                //   "name": `${ rfiName } `
                // },
              ];
              let newNotificationMessageWithPdf = await sendNotificationWithPdf(CERTIFICATE_URL, rfiCode, message, subject, recepients,);
              // console.log("newNotificationMessage line 775:", newNotificationMessageWithPdf);
              //debugger
              if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithPdf);
              }

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "activation";
              let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // console.log("newNotificationMessage line 788:", newNotificationMessageWithoutPdf);
              //debugger
              if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
              }

            } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 655 :", currentInvestment);
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
                message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at: ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.Thank you.`,
                // @ts-ignore
                adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} has failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at: ${DateTime.now()}.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 815:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 818:", newTimeline);
              // update record
              // //debugger
              // Send Details to notification service
              // let subject = "AstraPay Investment Activation Failed";
              // let message = `
              //     ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

              //     Thank you.

              //     AstraPay Investment.`;
              // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              // // console.log("newNotificationMessage line 830:", newNotificationMessage);
              // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessage.message !== "Success") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessage);
              // }

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "activation_failed";
              let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // console.log("newNotificationMessage line 842:", newNotificationMessageWithoutPdf);
              //debugger
              if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
              }


              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 853 =========:", updatedInvestment);
              // console.log("debitUserWalletForInvestment reponse data 854 ==================================", debitUserWalletForInvestment)
              // //debugger
              // throw Error(debitUserWalletForInvestment);
              return response
                .status(200)
                .json({
                  status: "OK",//debitUserWalletForInvestment.status,
                  message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
                });
            }
          }


        } else if (approval.requestType == "start_investment" && approval.approvalStatus == "declined" && record.status === "initiated") { // && record.status == "submitted"
          newStatus = "investment_declined";
          record.status = newStatus;
          record.approvalStatus = approval.approvalStatus;// "investment_declined"; //approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          // Save the updated record
          // await record.save();
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 587 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 590 :", updatedInvestment);

          console.log("Updated record Status line 592: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment request declined",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment request has been declined. Please try again, thank you.`,
            adminMessage: `${firstName} investment request was declined.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 605:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 607:", newTimeline);

          // Send Details to notification service
          // let subject = "AstraPay Investment Rejection";
          // let message = `
          //       ${firstName} this is to inform you, that your investment request, has been declined.

          //       Please check your device, and try again later.

          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 752:", newNotificationMessage);
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }

          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "approval_rejection";
          let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // console.log("newNotificationMessage line 740:", newNotificationMessageWithoutPdf);
          // //debugger
          if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessageWithoutPdf);
          }
        } else if (approval.requestType === "start_investment_rollover" && record.status === "initiated") {
          // get the request by request id
          // update status based on admin action
          // approval.approvalStatus === "approved" &&
          //debugger
          if (approval.approvalStatus === "approved") {
            // update the neccesary field
            // console.log("record ========================================================")
            // console.log(record)
            let selectedInvestmentRequestUpdate = record;
            selectedInvestmentRequestUpdate.approvalStatus = "approved" //approval.approvalStatus;
            // selectedInvestmentRequestUpdate.status = "investment_approved";
            // selectedInvestmentRequestUpdate.remark = approval.remark;
            // update the record
            // TODO: handle remark
            await investmentsService.updateInvestment(record, selectedInvestmentRequestUpdate);
            //  TODO: Debit user wallet to activate the investment
            // Data to send for transfer of fund
            let { amount, //lng, lat, investmentRequestReference,
              firstName, //lastName,
              walletId, userId,
              // phone,
              email,
              // rfiCode,
              currencyCode } = selectedInvestmentRequestUpdate;
            // let senderName = `${firstName} ${lastName}`;
            // let senderAccountNumber = walletId;
            // let senderAccountName = senderName;
            // let senderPhoneNumber = phone;
            // let senderEmail = email;
            // // Send to the endpoint for debit of wallet
            // let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
            //     senderName,
            //     senderAccountNumber,
            //     senderAccountName,
            //     senderPhoneNumber,
            //     senderEmail,
            //     rfiCode,userId,)
            // //debugger

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
            // console.log("Timeline object line 696:", timelineObject);
            await timelineService.createTimeline(timelineObject);

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "approval";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 827:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }


            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 720 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            // console.log(" Current log, line 723 :", updatedInvestment);
            // if successful
            // if (debitUserWalletForInvestment.status == 200) {
            // update the investment details
            selectedInvestmentRequestUpdate.status = 'active'
            selectedInvestmentRequestUpdate.approvalStatus = 'approved'
            selectedInvestmentRequestUpdate.startDate = DateTime.now() //.toISODate()
            selectedInvestmentRequestUpdate.payoutDate = DateTime.now().plus({ days: selectedInvestmentRequestUpdate.duration })
            selectedInvestmentRequestUpdate.isInvestmentCreated = true
            // //debugger

            // Save the updated record
            // await record.save();
            // update record
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 738 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            // updatedInvestment = await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            // console.log(" Current log, line 741 :", updatedInvestment);

            // console.log("Updated record Status line 743: ", record);
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
            // console.log('Timeline object line 755:', timelineObject)
            await timelineService.createTimeline(timelineObject);
            // Send Details to notification service
            let subject = `${rfiCode.toUpperCase()} Investment Rollover Activation`;
            let message = `
                ${firstName} this is to inform you, that the rollover of your Investment of ${currencyCode} ${amount} for the period of ${selectedInvestmentRequestUpdate.duration} days, has been activated on ${selectedInvestmentRequestUpdate.startDate} and it will be mature for payout on ${selectedInvestmentRequestUpdate.payoutDate}.

                Please check your device.

                Thank you.

                ${rfiCode.toUpperCase()} Investment.`;
            // newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 768:", newNotificationMessage);
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
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
            // console.log("newNotificationMessage line 907:", newNotificationMessageWithPdf);
            // //debugger
            if (newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithPdf);
            }

            // Send Notification to admin and others stakeholder
            investment = selectedInvestmentRequestUpdate;
            messageKey = "activation";
            newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 920:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }

            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 923 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);

          } else if (approval.approvalStatus === "declined") {
            // update the neccesary field
            // console.log("record ========================================================")
            // console.log(record)
            let selectedInvestmentRequestUpdate = record;
            selectedInvestmentRequestUpdate.approvalStatus = "declined" //approval.approvalStatus;
            selectedInvestmentRequestUpdate.status = "investment_rollover_declined";
            // selectedInvestmentRequestUpdate.remark = approval.remark;
            // TODO: handle remark
            // update the record
            await investmentsService.updateInvestment(record, selectedInvestmentRequestUpdate);
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
              action: "investment rollover declined",
              investmentId: investmentId,//id,
              walletId: walletId,// walletId,
              userId: userId,// userId,
              // @ts-ignore
              message: `${firstName}, the rollover of your investment of ${currencyCode} ${amount} has been declined by the Admin on : ${await convertDateToFormat(DateTime.now(), "DD-MM-YYYY") } , please try again. Thank you.`,
              adminMessage: `The rollover of investment of ${currencyCode} ${amount} was declined on : ${await convertDateToFormat(DateTime.now(),"DD-MM-YYYY")}`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 296:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 299:", newTimeline);
            // update record
            // //debugger
            // Send Details to notification service
            // let subject = "AstraPay Investment Activation Failed";
            // let message = `
            //     ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

            //     Thank you.

            //     AstraPay Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 995:", newNotificationMessage);
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
            // }

            // Send Notification to admin and others stakeholder
            let investment = selectedInvestmentRequestUpdate;
            let messageKey = "rollover_failed";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1014:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            };
             let creditUserWalletWithPrincipal;
            // Check if the amount is not Zero or less
            if (amount <= 0) {
              creditUserWalletWithPrincipal = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
            // let decPl = 3;
            // Check if the amount is not Zero or less
            // if (amount <= 0) {
            //   // debugger
            //   // // Mark the Transaction as completed
            //   // let amountPaidOut = amount;
            //   // // let decPl = 3;
            //   // amountPaidOut = Number(amountPaidOut.toFixed(decPl));
            //   // // update the investment details
            //   // //@ts-ignore
            //   // record.isInvestmentCompleted = true;
            //   // //@ts-ignore
            //   // record!.investmentCompletionDate = DateTime.now();
            //   // //@ts-ignore
            //   // record!.status = 'completed';
            //   // record.principalPayoutStatus = "completed";
            //   // // record.approvalStatus = approval.approvalStatus;//'payout'
            //   // //@ts-ignore
            //   // record!.isPayoutAuthorized = true;
            //   // //@ts-ignore
            //   // record!.isPayoutSuccessful = true;
            //   // //@ts-ignore
            //   // record!.datePayoutWasDone = DateTime.now();
            //   // // //debugger

            //   // // Save the updated record
            //   // // await record.save();
            //   // // update record
            //   // let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
            //   // // console.log(" Current log, line 608 :", currentInvestment);
            //   // // send for update
            //   // await investmentsService.updateInvestment(currentInvestment, record);
            //   // // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            //   // // console.log(" Current log, line 455 :", updatedInvestment);

            //   // // console.log("Updated record Status line 457: ", record);

            //   // // update timeline
            //   // timelineObject = {
            //   //   id: uuid(),
            //   //   action: "investment payout",
            //   //   investmentId: id,//id,
            //   //   walletId: walletId,// walletId,
            //   //   userId: userId,// userId,
            //   //   // @ts-ignore
            //   //   message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the admin declined approval for the investment rollover. Thank you.`,
            //   //   adminMessage: `The sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment was paid because the admin declined approval for the investment rollover.`,
            //   //   createdAt: DateTime.now(),
            //   //   metadata: ``,
            //   // };
            //   // // console.log("Timeline object line 471:", timelineObject);
            //   // await timelineService.createTimeline(timelineObject);
            //   // // let newTimeline = await timelineService.createTimeline(timelineObject);
            //   // // console.log("new Timeline object line 474:", newTimeline);
            //   // // update record
            //   // // Send Notification to admin and others stakeholder
            //   // let investment = record;
            //   // let messageKey = "payout";
            //   // let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            //   // // console.log("newNotificationMessage line 1108:", newNotificationMessageWithoutPdf);
            //   // // //debugger
            //   // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   //   console.log("Notification sent successfully");
            //   // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   //   console.log("Notification NOT sent successfully");
            //   //   console.log(newNotificationMessageWithoutPdf);
            //   // }
            //   // debugger
            // } else {
              // Credit the user wallet with the amount to be rollover
              // Payout the amount that is to be rollover
               creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
                beneficiaryName,
                beneficiaryAccountNumber,
                beneficiaryAccountName,
                beneficiaryEmail,
                beneficiaryPhoneNumber,
                rfiCode,userId,
                descriptionForPrincipal)
              //debugger
            }
              // if successful

              // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
              if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
                let amountPaidOut = amount;
                let decPl = 3;
                amountPaidOut = Number(amountPaidOut.toFixed(decPl));
                // update the investment details
                //@ts-ignore
                record.isInvestmentCompleted = true;
                //@ts-ignore
                record!.investmentCompletionDate = DateTime.now();
                //@ts-ignore
                record!.status = 'completed';
                record.principalPayoutStatus = "completed";
                // record.approvalStatus = approval.approvalStatus;//'payout'
                //@ts-ignore
                record!.isPayoutAuthorized = true;
                //@ts-ignore
                record!.isPayoutSuccessful = true;
                //@ts-ignore
                record!.datePayoutWasDone = DateTime.now();
                // //debugger

                // Save the updated record
                // await record.save();
                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                // console.log(" Current log, line 608 :", currentInvestment);
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
                  message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid because the admin declined approval for the investment rollover. Thank you.`,
                  adminMessage: `The sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment was paid because the admin declined approval for the investment rollover.`,
                  createdAt: DateTime.now(),
                  metadata: ``,
                };
                // console.log("Timeline object line 471:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 474:", newTimeline);
                // update record

                // Send Details to notification service
                // let subject = "AstraPay Investment Payout";
                // let message = `
                //   ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid because the tenure selected is not available on this type of investment.

                //   Please check your device.

                //   Thank you.

                //   AstraPay Investment.`;
                // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                // // console.log("newNotificationMessage line 1089:", newNotificationMessage);
                // // //debugger
                // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                //   console.log("Notification sent successfully");
                // } else if (newNotificationMessage.message !== "Success") {
                //   console.log("Notification NOT sent successfully");
                //   console.log(newNotificationMessage);
                // }
                // Send Notification to admin and others stakeholder
                let investment = record;
                let messageKey = "payout";
                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                // console.log("newNotificationMessage line 1108:", newNotificationMessageWithoutPdf);
                // //debugger
                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  console.log("Notification sent successfully");
                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  console.log("Notification NOT sent successfully");
                  console.log(newNotificationMessageWithoutPdf);
                }

              } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200) {
                let amountPaidOut = amount;
                let decPl = 3;
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
                // //debugger

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
                  action: "investment rollover and payout failed",
                  investmentId: id,//id,
                  walletId: walletId,// walletId,
                  userId: userId,// userId,
                  // @ts-ignore
                  message: `${firstName}, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed, please be patient as we try again. Thank you.`,
                  adminMessage: `The payout of the sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment failed.`,
                  createdAt: DateTime.now(),
                  metadata: ``,
                };
                // console.log("Timeline object line 1152:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 1155:", newTimeline);
                // update record

                // Send Details to notification service
                // let subject = "AstraPay Investment Rollover and Payout Failed";
                // let message = `
                //   ${firstName} this is to inform you, the payout of the sum of ${currencyCode} ${amountPaidOut} for your matured investment has failed.

                //   Please check your device.

                //   Thank you.

                //   AstraPay Investment.`;
                // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                // // console.log("newNotificationMessage line 1177:", newNotificationMessage);
                // // //debugger
                // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                //   console.log("Notification sent successfully");
                // } else if (newNotificationMessage.message !== "Success") {
                //   console.log("Notification NOT sent successfully");
                //   console.log(newNotificationMessage);
                // }

                // Send Notification to admin and others stakeholder
                let investment = record;
                let messageKey = "payout_and_rollover_failed";
                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                // console.log("newNotificationMessage line 1190:", newNotificationMessageWithoutPdf);
                // //debugger
                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  console.log("Notification sent successfully");
                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  console.log("Notification NOT sent successfully");
                  console.log(newNotificationMessageWithoutPdf);
                }

              }
              // console.log("creditUserWalletForInvestment reponse data 1200 ==================================", debitUserWalletForInvestment)
              // //debugger
              // throw Error(creditUserWalletForInvestment);
              // throw Error(`${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`);
              // return {
              //         status: "FAILED",//creditUserWalletForInvestment.status,
              //         message: `${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`,
              //     };
            

          }
          // update timeline
          // timelineObject = {
          //   id: uuid(),
          //   action: "investment request approval updated",
          //   investmentId: record.id,
          //   userId: record.userId,
          //   walletId: record.walletId,
          //   // @ts-ignore
          //   message: `${record.firstName} investment request approval record has just been updated.`,
          //   createdAt: DateTime.now(),
          //   metadata: `request type : ${record.requestType}`,
          // };
          // // console.log("Timeline object line 1028:", timelineObject);
          // await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1031:", newTimeline);
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "rollover" && record.status === "matured") {
          console.log("Approval for investment payout rollover processing: ===========================================>")

          // newStatus = "rollover";
          // record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus;
          // Data to send for transfer of fund
          // let { amount, lng, lat, id, userId,
          //   firstName, lastName, walletId, phone, email,
          //   rfiCode, interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference, isRolloverActivated,
          //   rolloverType, status } = record;
          debugger
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
            // totalAmountToPayout,
            // end
            interestPayoutRequestReference,
            principalPayoutRequestReference,
          } = record;
          let beneficiaryName = `${firstName} ${lastName}`;
          let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
          let beneficiaryAccountName = beneficiaryName;
          let beneficiaryPhoneNumber = phone;
          let beneficiaryEmail = email;
          // Send to the endpoint for debit of wallet
          let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
          let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
          // NEW CODE START
          //debugger
          // Check if the user set Rollover
          // "rolloverType": "101",
          // "rolloverTarget": 3,
          // "rolloverDone": 0,
          // '100' = 'no rollover',
          //   '101' = 'rollover principal only',
          //   '102' = 'rollover principal with interest',
          //   '103' = 'rollover interest only',
          if ((isRolloverActivated == true && rolloverType !== "100" && status === "matured") || (isRolloverActivated == true && rolloverType !== "100" && status === "active") ||
            (isRolloverActivated == true && rolloverType !== "100" && status === "active")) { //"payout_suspended" "rollover_suspended"
            // || (isRolloverActivated == true && rolloverType !== "100" && status === "matured")
            // if (isRolloverActivated == true && rolloverTarget > 0 && rolloverTarget > rolloverDone && rolloverType !== "100") {
            debugger
            // check type of rollover
            if (rolloverType == "101") {
              //   '101' = 'rollover principal only',
              // payout interest
              // NEW CODE START
              let creditUserWalletWithInterest;
              // check if transaction with same customer ref exist
              let checkTransactionStatusByCustomerRef = await checkTransactionStatus(interestPayoutRequestReference, rfiCode);
              //debugger
              // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
              // if (!checkTransactionStatusByCustomerRef) 
              if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
                //@ts-ignore
                let investmentId = record.id
                // Create Unique payment reference for the customer
                let reference = DateTime.now() + randomstring.generate(4);
                let numberOfAttempts = 1;
                let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                // console.log("Customer Transaction Reference ,@ ApprovalsController line 1822 ==================")
                // console.log(paymentReference);
                // let getNumberOfAttempt = paymentReference.split("/");
                // console.log("getNumberOfAttempt line 1825 =====", getNumberOfAttempt[1]);
                //debugger;
                // @ts-ignore
                record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                record.numberOfAttempts = numberOfAttempts;
                interestPayoutRequestReference = paymentReference;
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                // //debugger
                // console.log(" Current log, line 1832 :", currentInvestment);
                // send for update
                await investmentsService.updateInvestment(currentInvestment, record);
                //  let creditUserWalletWithInterest;
                // Check if the amount is not Zero or less
                if (interestDueOnInvestment <= 0) {
                  creditUserWalletWithInterest = {
                    status: 200,
                    data: { screenStatus: "APPROVED" }
                  }
                  debugger
                } else {
                // // Check if the amount is not Zero or less
                // if (interestDueOnInvestment <= 0) {
                //   let amountPaidOut = interestDueOnInvestment;
                //   // update the investment details
                //   record.isInvestmentCompleted = true;
                //   record.investmentCompletionDate = DateTime.now();
                //   record.status = 'completed';
                //   record.interestPayoutStatus = "completed";
                //   record.approvalStatus = approval.approvalStatus;//'payout'
                //   record.isPayoutAuthorized = true;
                //   record.isPayoutSuccessful = true;
                //   record.datePayoutWasDone = DateTime.now();
                //   // //debugger

                //   // Save the updated record
                //   // await record.save();
                //   // update record
                //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                //   // console.log(" Current log, line 1864 :", currentInvestment);
                //   // send for update
                //   await investmentsService.updateInvestment(currentInvestment, record);
                //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                //   // console.log(" Current log, line 1865 :", updatedInvestment);

                //   // console.log("Updated record Status line 1869: ", record);

                //   // update timeline
                //   timelineObject = {
                //     id: uuid(),
                //     action: "investment payout",
                //     investmentId: investmentId,//id,
                //     walletId: walletIdToSearch,// walletId,
                //     userId: userIdToSearch,// userId,
                //     // @ts-ignore
                //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                //     createdAt: DateTime.now(),
                //     metadata: ``,
                //   };
                //   // console.log("Timeline object line 1883:", timelineObject);
                //   await timelineService.createTimeline(timelineObject);
                //   // let newTimeline = await timelineService.createTimeline(timelineObject);
                //   // console.log("new Timeline object line 1886:", newTimeline);
                //   // update record

                //   // Send Notification to admin and others stakeholder
                //   let investment = record;
                //   let messageKey = "payout";
                //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                //   // console.log("newNotificationMessage line 1893:", newNotificationMessageWithoutPdf);
                //   // //debugger
                //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                //     console.log("Notification sent successfully");
                //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                //     console.log("Notification NOT sent successfully");
                //     console.log(newNotificationMessageWithoutPdf);
                //   }


                // } else {
                  // initiate a new  transaction
                  // Payout Interest
                  creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode,userId,
                    descriptionForInterest);
                  //debugger
                }
                  // if successful
                  // if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
                    let amountPaidOut = interestDueOnInvestment;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.interestPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1864 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1865 :", updatedInvestment);

                    // console.log("Updated record Status line 1869: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1883:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1886:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1893:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

                  }
                
              } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                // update the value for number of attempts
                // get the current investmentRef, split , add one to the current number, update and try again
                let getNumberOfAttempt = interestPayoutRequestReference.split("_");
                // console.log("getNumberOfAttempt line 1908 =====", getNumberOfAttempt[1]);
                let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
                let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                // console.log("Customer Transaction Reference ,@ ApprovalsController line 1912 ==================")
                // console.log(newPaymentReference);
                interestPayoutRequestReference = newPaymentReference;
                record.interestPayoutRequestReference = interestPayoutRequestReference;
                record.numberOfAttempts = numberOfAttempts;

                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                // console.log(" Current log, line 1918 :", currentInvestment);
                // send for update
                await investmentsService.updateInvestment(currentInvestment, record);
                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                // console.log(" Current log, line 1922 :", updatedInvestment);

                // console.log("Updated record Status line 1924: ", record);
                //  let creditUserWalletWithInterest;
                // Check if the amount is not Zero or less
                if (interestDueOnInvestment <= 0) {
                  creditUserWalletWithInterest = {
                    status: 200,
                    data: { screenStatus: "APPROVED" }
                  }
                  debugger
                } else {
                // // Check if the amount is not Zero or less
                // if (interestDueOnInvestment <= 0) {
                //   let amountPaidOut = interestDueOnInvestment;
                //   // update the investment details
                //   record.isInvestmentCompleted = true;
                //   record.investmentCompletionDate = DateTime.now();
                //   record.status = 'completed';
                //   record.interestPayoutStatus = "completed";
                //   record.approvalStatus = approval.approvalStatus;//'payout'
                //   record.isPayoutAuthorized = true;
                //   record.isPayoutSuccessful = true;
                //   record.datePayoutWasDone = DateTime.now();
                //   // //debugger

                //   // Save the updated record
                //   // await record.save();
                //   // update record
                //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                //   // console.log(" Current log, line 1031 :", currentInvestment);
                //   // send for update
                //   await investmentsService.updateInvestment(currentInvestment, record);
                //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                //   // console.log(" Current log, line 1034 :", updatedInvestment);

                //   // console.log("Updated record Status line 537: ", record);

                //   // update timeline
                //   timelineObject = {
                //     id: uuid(),
                //     action: "investment payout",
                //     investmentId: investmentId,//id,
                //     walletId: walletIdToSearch,// walletId,
                //     userId: userIdToSearch,// userId,
                //     // @ts-ignore
                //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                //     createdAt: DateTime.now(),
                //     metadata: ``,
                //   };
                //   // console.log("Timeline object line 1606:", timelineObject);
                //   await timelineService.createTimeline(timelineObject);
                //   // let newTimeline = await timelineService.createTimeline(timelineObject);
                //   // console.log("new Timeline object line 1609:", newTimeline);
                //   // update record

                //   // Send Notification to admin and others stakeholder
                //   let investment = record;
                //   let messageKey = "payout";
                //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                //   // console.log("newNotificationMessage line 1643:", newNotificationMessageWithoutPdf);
                //   // //debugger
                //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                //     console.log("Notification sent successfully");
                //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                //     console.log("Notification NOT sent successfully");
                //     console.log(newNotificationMessageWithoutPdf);
                //   }
                // } else {
                  // Payout interest
                  creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode,userId,
                    descriptionForInterest);
                  debugger
                }
                  // if successful
                  // if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
                    let amountPaidOut = interestDueOnInvestment;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.interestPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1031 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1034 :", updatedInvestment);

                    // console.log("Updated record Status line 537: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1606:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1609:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1643:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

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
                principalPayoutStatus: "pending",
                interestPayoutStatus: "pending",
                penalty: 0,
                verificationRequestAttempts: 0,
                numberOfAttempts: 0,
              };
              await investmentsService.createNewInvestment(newInvestmentPayload, amount)
              // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, amount)
              // console.log("newInvestmentDetails line 2050", newInvestmentDetails)
              // //debugger
            } else if (rolloverType == "102") {
              // Rollover Principal and interest
              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment rollover",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment has been rollover. Thank you.`,
                adminMessage: `The sum of ${currencyCode} ${totalAmountToPayout} for ${firstName} matured investment was rollover.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 1694:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 1697:", newTimeline);

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "rollover";
              let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // console.log("newNotificationMessage line 1731:", newNotificationMessageWithoutPdf);
              // //debugger
              if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                console.log("Notification sent successfully");
              } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                console.log("Notification NOT sent successfully");
                console.log(newNotificationMessageWithoutPdf);
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
                principalPayoutStatus: "pending",
                interestPayoutStatus: "pending",
                penalty: 0,
                verificationRequestAttempts: 0,
                numberOfAttempts: 0,
              };
              await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
              // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
              // console.log("newInvestmentDetails line 2120", newInvestmentDetails)
              // //debugger
            } else if (rolloverType == "103") {
              //   '103' = 'rollover interest only',
              // Payout Principal
              // NEW CODE START
              let creditUserWalletWithPrincipal;
              // check if transaction with same customer ref exist
              let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference, rfiCode);
              //debugger
              // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
              // if (!checkTransactionStatusByCustomerRef) 
              if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
                //@ts-ignore
                let investmentId = record.id
                // Create Unique payment reference for the customer
                let reference = DateTime.now() + randomstring.generate(4);
                let numberOfAttempts = 1;
                let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                // console.log("Customer Transaction Reference ,@ ApprovalsController line 2191 ==================")
                // console.log(paymentReference);
                let getNumberOfAttempt = paymentReference.split("_");
                console.log("getNumberOfAttempt line 2194 =====", getNumberOfAttempt[1]);
                //debugger;
                // @ts-ignore
                record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                record.numberOfAttempts = numberOfAttempts;


                principalPayoutRequestReference = paymentReference;
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                // //debugger
                // console.log(" Current log, line 1443 :", currentInvestment);
                // send for update
                await investmentsService.updateInvestment(currentInvestment, record);
                // let creditUserWalletWithPrincipal;
                // Check if the amount is not Zero or less
                if (amount <= 0) {
                  creditUserWalletWithPrincipal = {
                    status: 200,
                    data: { screenStatus: "APPROVED" }
                  }
                  debugger
                } else {
                // // Check if the amount is not Zero or less
                // if (amount <= 0) {
                //   let amountPaidOut = amount;
                //   // update the investment details
                //   record.isInvestmentCompleted = true;
                //   record.investmentCompletionDate = DateTime.now();
                //   record.status = 'completed';
                //   record.principalPayoutStatus = "completed";
                //   record.approvalStatus = approval.approvalStatus;//'payout'
                //   record.isPayoutAuthorized = true;
                //   record.isPayoutSuccessful = true;
                //   record.datePayoutWasDone = DateTime.now();
                //   // //debugger

                //   // Save the updated record
                //   // await record.save();
                //   // update record
                //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                //   // console.log(" Current log, line 1031 :", currentInvestment);
                //   // send for update
                //   await investmentsService.updateInvestment(currentInvestment, record);
                //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                //   // console.log(" Current log, line 1034 :", updatedInvestment);

                //   // console.log("Updated record Status line 537: ", record);

                //   // update timeline
                //   timelineObject = {
                //     id: uuid(),
                //     action: "investment payout",
                //     investmentId: investmentId,//id,
                //     walletId: walletIdToSearch,// walletId,
                //     userId: userIdToSearch,// userId,
                //     // @ts-ignore
                //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                //     createdAt: DateTime.now(),
                //     metadata: ``,
                //   };
                //   // console.log("Timeline object line 1448:", timelineObject);
                //   await timelineService.createTimeline(timelineObject);
                //   // let newTimeline = await timelineService.createTimeline(timelineObject);
                //   // console.log("new Timeline object line 1451:", newTimeline);
                //   // update record

                //   // Send Notification to admin and others stakeholder
                //   let investment = record;
                //   let messageKey = "payout";
                //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                //   // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                //   // //debugger
                //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                //     console.log("Notification sent successfully");
                //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                //     console.log("Notification NOT sent successfully");
                //     console.log(newNotificationMessageWithoutPdf);
                //   }
                // } else {
                  // initiate a new  transaction
                  // Payout Principal
                  creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode, userId,
                    descriptionForPrincipal);
                  debugger
                }
                  // if successful
                  // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
                    let amountPaidOut = amount;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.principalPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1031 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1034 :", updatedInvestment);

                    // console.log("Updated record Status line 537: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1448:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1451:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

                  }
                

              } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                // update the value for number of attempts
                // get the current investmentRef, split , add one to the current number, update and try again
                let getNumberOfAttempt = principalPayoutRequestReference.split("_");
                // console.log("getNumberOfAttempt line 2283 =====", getNumberOfAttempt[1]);
                let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
                let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                // console.log("Customer Transaction Reference ,@ ApprovalsController line 2287 ==================")
                // console.log(newPaymentReference);
                principalPayoutRequestReference = newPaymentReference;
                record.principalPayoutRequestReference = newPaymentReference;
                record.numberOfAttempts = numberOfAttempts;


                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                // console.log(" Current log, line 1470 :", currentInvestment);
                // send for update
                await investmentsService.updateInvestment(currentInvestment, record);
                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                // console.log(" Current log, line 1474 :", updatedInvestment);
                // console.log("Updated record Status line 1476: ", record);
                let creditUserWalletWithPrincipal;
                // Check if the amount is not Zero or less
                if (amount <= 0) {
                  creditUserWalletWithPrincipal = {
                    status: 200,
                    data: { screenStatus: "APPROVED" }
                  }
                  debugger
                } else {
                // // Check if the amount is not Zero or less
                // if (amount <= 0) {
                //     let amountPaidOut = amount;
                //     // update the investment details
                //     record.isInvestmentCompleted = true;
                //     record.investmentCompletionDate = DateTime.now();
                //     record.status = 'completed';
                //     record.principalPayoutStatus = "completed";
                //     record.approvalStatus = approval.approvalStatus;//'payout'
                //     record.isPayoutAuthorized = true;
                //     record.isPayoutSuccessful = true;
                //     record.datePayoutWasDone = DateTime.now();
                //     // //debugger

                //     // Save the updated record
                //     // await record.save();
                //     // update record
                //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                //     // console.log(" Current log, line 1031 :", currentInvestment);
                //     // send for update
                //     await investmentsService.updateInvestment(currentInvestment, record);
                //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                //     // console.log(" Current log, line 1034 :", updatedInvestment);

                //     // console.log("Updated record Status line 537: ", record);

                //     // update timeline
                //     timelineObject = {
                //       id: uuid(),
                //       action: "investment payout",
                //       investmentId: investmentId,//id,
                //       walletId: walletIdToSearch,// walletId,
                //       userId: userIdToSearch,// userId,
                //       // @ts-ignore
                //       message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                //       adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                //       createdAt: DateTime.now(),
                //       metadata: ``,
                //     };
                //     // console.log("Timeline object line 1448:", timelineObject);
                //     await timelineService.createTimeline(timelineObject);
                //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                //     // console.log("new Timeline object line 1451:", newTimeline);
                //     // update record

                //     // Send Notification to admin and others stakeholder
                //     let investment = record;
                //     let messageKey = "payout";
                //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                //     // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                //     // //debugger
                //     if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                //       console.log("Notification sent successfully");
                //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                //       console.log("Notification NOT sent successfully");
                //       console.log(newNotificationMessageWithoutPdf);
                //     }
                // }else {
                // Payout Principal
                creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                  beneficiaryName,
                  beneficiaryAccountNumber,
                  beneficiaryAccountName,
                  beneficiaryEmail,
                  beneficiaryPhoneNumber,
                  rfiCode, userId,
                  descriptionForPrincipal);
                debugger
                }
                // if successful
                // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
                  let amountPaidOut = amount;
                  // update the investment details
                  record.isInvestmentCompleted = true;
                  record.investmentCompletionDate = DateTime.now();
                  record.status = 'completed';
                  record.principalPayoutStatus = "completed";
                  record.approvalStatus = approval.approvalStatus;//'payout'
                  record.isPayoutAuthorized = true;
                  record.isPayoutSuccessful = true;
                  record.datePayoutWasDone = DateTime.now();
                  // //debugger

                  // Save the updated record
                  // await record.save();
                  // update record
                  let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                  // console.log(" Current log, line 1031 :", currentInvestment);
                  // send for update
                  await investmentsService.updateInvestment(currentInvestment, record);
                  // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  // console.log(" Current log, line 1034 :", updatedInvestment);

                  // console.log("Updated record Status line 537: ", record);

                  // update timeline
                  timelineObject = {
                    id: uuid(),
                    action: "investment payout",
                    investmentId: investmentId,//id,
                    walletId: walletIdToSearch,// walletId,
                    userId: userIdToSearch,// userId,
                    // @ts-ignore
                    message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                    adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                    createdAt: DateTime.now(),
                    metadata: ``,
                  };
                  // console.log("Timeline object line 1448:", timelineObject);
                  await timelineService.createTimeline(timelineObject);
                  // let newTimeline = await timelineService.createTimeline(timelineObject);
                  // console.log("new Timeline object line 1451:", newTimeline);
                  // update record

                  // Send Notification to admin and others stakeholder
                  let investment = record;
                  let messageKey = "payout";
                  let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                  // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                  // //debugger
                  if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    console.log("Notification sent successfully");
                  } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    console.log("Notification NOT sent successfully");
                    console.log(newNotificationMessageWithoutPdf);
                  }

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
                principalPayoutStatus: "pending",
                interestPayoutStatus: "pending",
                penalty: 0,
                verificationRequestAttempts: 0,
                numberOfAttempts: 0,
              }
              await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
              // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
              // console.log("newInvestmentDetails line 2353", newInvestmentDetails)
              // //debugger
            }
          }

        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "approved" && record.status === "matured") { //&& record.status == "submitted"
          // console.log("Approval for investment payout processing: ===========================================>")

          // newStatus = "approved";
          // record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus;
          debugger
          // Data to send for transfer of fund
          let { amount, lng, lat, id, userId,
            firstName, lastName,
            walletId, investorFundingWalletId,
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
          let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference, rfiCode);
          // //debugger
          // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
          // if (!checkTransactionStatusByCustomerRef) 
          if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
            //@ts-ignore
            let investmentId = record.id
            // Create Unique payment reference for the customer
            let reference = DateTime.now() + randomstring.generate(4);
            let numberOfAttempts = 1;
            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
            // console.log("Customer Transaction Reference ,@ ApprovalsController line 1433 ==================")
            // console.log(paymentReference);
            // let getNumberOfAttempt = paymentReference.split("/");
            // console.log("getNumberOfAttempt line 1436 =====", getNumberOfAttempt[1]);
            // //debugger;
            // @ts-ignore
            record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
            principalPayoutRequestReference = paymentReference;
            record.numberOfAttempts = numberOfAttempts;
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // //debugger
            // console.log(" Current log, line 1443 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let creditUserWalletWithPrincipal;
            // Check if the amount is not Zero or less
            if (amount <= 0) {
              creditUserWalletWithPrincipal = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
            // // Check if the amount is not Zero or less
            // if (amount <= 0) {
            //   let amountPaidOut = amount
            //   // update the investment details
            //   record.isInvestmentCompleted = true;
            //   record.investmentCompletionDate = DateTime.now();
            //   record.status = 'completed_with_interest_payout_outstanding';
            //   record.principalPayoutStatus = "completed";
            //   record.approvalStatus = approval.approvalStatus;//'payout'
            //   record.isPayoutAuthorized = true;
            //   record.isPayoutSuccessful = true;
            //   record.datePayoutWasDone = DateTime.now();
            //   // //debugger
            //   // Save the updated record
            //   // await record.save();
            //   // update record
            //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            //   // console.log(" Current log, line 1668 :", currentInvestment);
            //   // send for update
            //   await investmentsService.updateInvestment(currentInvestment, record);
            //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            //   // console.log(" Current log, line 1671 :", updatedInvestment);

            //   // console.log("Updated record Status line 537: ", record);

            //   // update timeline
            //   timelineObject = {
            //     id: uuid(),
            //     action: "investment payout",
            //     investmentId: investmentId,//id,
            //     walletId: walletIdToSearch,// walletId,
            //     userId: userIdToSearch,// userId,
            //     // @ts-ignore
            //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
            //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
            //     createdAt: DateTime.now(),
            //     metadata: ``,
            //   };
            //   // console.log("Timeline object line 551:", timelineObject);
            //   await timelineService.createTimeline(timelineObject);
            //   // let newTimeline = await timelineService.createTimeline(timelineObject);
            //   // console.log("new Timeline object line 553:", newTimeline);
            //   // update record

            //   // Send Notification to admin and others stakeholder
            //   let investment = record;
            //   let messageKey = "payout";
            //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            //   // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
            //   // //debugger
            //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            //   }

            // }else{
            // initiate a new  transaction
            // Payout Principal
            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
              beneficiaryName,
              beneficiaryAccountNumber,
              beneficiaryAccountName,
              beneficiaryEmail,
              beneficiaryPhoneNumber,
              rfiCode, userId,
              descriptionForPrincipal);
            debugger
          }

          } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
            // update the value for number of attempts
            // get the current investmentRef, split , add one to the current number, update and try again
            let getNumberOfAttempt = principalPayoutRequestReference.split("_");
            // console.log("getNumberOfAttempt line 1461 =====", getNumberOfAttempt[1]);
            let numberOfAttempts = record.numberOfAttempts + 1; //Number(getNumberOfAttempt[1]) + 1;
            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
            let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
            // console.log("Customer Transaction Reference ,@ ApprovalsController line 1465 ==================")
            // console.log(newPaymentReference);
            principalPayoutRequestReference = newPaymentReference;
            record.principalPayoutRequestReference = newPaymentReference;
            record.numberOfAttempts = numberOfAttempts;
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
            // console.log(" Current log, line 1470 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1474 :", updatedInvestment);

            // console.log("Updated record Status line 1476: ", record);
                        //  let creditUserWalletWithPrincipal;
            // Check if the amount is not Zero or less
            if (amount <= 0) {
              creditUserWalletWithPrincipal = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
            // // Check if the amount is not Zero or less
            // if (amount <= 0) {
            //   let amountPaidOut = amount;
            //   // update the investment details
            //   record.isInvestmentCompleted = true;
            //   record.investmentCompletionDate = DateTime.now();
            //   record.status = 'completed_with_interest_payout_outstanding';
            //   record.principalPayoutStatus = "completed";
            //   record.approvalStatus = approval.approvalStatus;//'payout'
            //   record.isPayoutAuthorized = true;
            //   record.isPayoutSuccessful = true;
            //   record.datePayoutWasDone = DateTime.now();
            //   // //debugger
            //   // Save the updated record
            //   // await record.save();
            //   // update record
            //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            //   // console.log(" Current log, line 1668 :", currentInvestment);
            //   // send for update
            //   await investmentsService.updateInvestment(currentInvestment, record);
            //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            //   // console.log(" Current log, line 1671 :", updatedInvestment);

            //   // console.log("Updated record Status line 537: ", record);

            //   // update timeline
            //   timelineObject = {
            //     id: uuid(),
            //     action: "investment payout",
            //     investmentId: investmentId,//id,
            //     walletId: walletIdToSearch,// walletId,
            //     userId: userIdToSearch,// userId,
            //     // @ts-ignore
            //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
            //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
            //     createdAt: DateTime.now(),
            //     metadata: ``,
            //   };
            //   // console.log("Timeline object line 551:", timelineObject);
            //   await timelineService.createTimeline(timelineObject);
            //   // let newTimeline = await timelineService.createTimeline(timelineObject);
            //   // console.log("new Timeline object line 553:", newTimeline);
            //   // update record

            //   // Send Notification to admin and others stakeholder
            //   let investment = record;
            //   let messageKey = "payout";
            //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            //   // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
            //   // //debugger
            //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            //   }


            // }else{
            // Payout Principal
            creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
              beneficiaryName,
              beneficiaryAccountNumber,
              beneficiaryAccountName,
              beneficiaryEmail,
              beneficiaryPhoneNumber,
              rfiCode, userId,
              descriptionForPrincipal);
            debugger
          }
          }

          // check if transaction with same customer ref exist
          let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference, rfiCode);
          // if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
          // if (!checkTransactionStatusByCustomerRef02) 
          if ((!checkTransactionStatusByCustomerRef02) || (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS")) {
            //@ts-ignore
            let investmentId = record.id
            // Create Unique payment reference for the customer
            let reference = DateTime.now() + randomstring.generate(4);
            let numberOfAttempts = 1;
            let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
            // console.log("Customer Transaction Reference ,@ ApprovalsController line 1497 ==================")
            // console.log(paymentReference);
            // let getNumberOfAttempt = paymentReference.split("_");
            // console.log("getNumberOfAttempt line 1500 =====", getNumberOfAttempt[1]);
            //debugger;
            // @ts-ignore
            record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
            record.numberOfAttempts = numberOfAttempts;
            interestPayoutRequestReference = paymentReference;
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // //debugger
            // console.log(" Current log, line 1507 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            //  let creditUserWalletWithInterest;
            // Check if the amount is not Zero or less
            if (interestDueOnInvestment <= 0) {
              creditUserWalletWithInterest = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
            // // Check if the amount is not Zero or less
            // if (interestDueOnInvestment <= 0) {
            //   let amountPaidOut = interestDueOnInvestment
            //   // update the investment details
            //   record.isInvestmentCompleted = true;
            //   record.investmentCompletionDate = DateTime.now();
            //   record.status = 'completed_with_principal_payout_outstanding';
            //   record.interestPayoutStatus = "completed";
            //   record.approvalStatus = approval.approvalStatus;//'payout'
            //   record.isPayoutAuthorized = true;
            //   record.isPayoutSuccessful = true;
            //   record.datePayoutWasDone = DateTime.now();
            //   // //debugger

            //   // Save the updated record
            //   // await record.save();
            //   // update record
            //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            //   // console.log(" Current log, line 532 :", currentInvestment);
            //   // send for update
            //   await investmentsService.updateInvestment(currentInvestment, record);
            //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            //   // console.log(" Current log, line 1726 :", updatedInvestment);

            //   // console.log("Updated record Status line 537: ", record);

            //   // update timeline
            //   timelineObject = {
            //     id: uuid(),
            //     action: "investment payout",
            //     investmentId: investmentId,//id,
            //     walletId: walletIdToSearch,// walletId,
            //     userId: userIdToSearch,// userId,
            //     // @ts-ignore
            //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
            //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
            //     createdAt: DateTime.now(),
            //     metadata: ``,
            //   };
            //   // console.log("Timeline object line 551:", timelineObject);
            //   await timelineService.createTimeline(timelineObject);
            //   // let newTimeline = await timelineService.createTimeline(timelineObject);
            //   // console.log("new Timeline object line 553:", newTimeline);
            //   // update record


            //   // Send Notification to admin and others stakeholder
            //   let investment = record;
            //   let messageKey = "payout";
            //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            //   // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
            //   // //debugger
            //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            //   }

            // }else{
            // initiate a new  transaction
            // Payout Interest
            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
              beneficiaryName,
              beneficiaryAccountNumber,
              beneficiaryAccountName,
              beneficiaryEmail,
              beneficiaryPhoneNumber,
              rfiCode, userId,
              descriptionForInterest);
            debugger
          }

          } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
            // update the value for number of attempts
            // get the current investmentRef, split , add one to the current number, update and try again
            let getNumberOfAttempt = principalPayoutRequestReference.split("_");
            // console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
            let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
            let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
            let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
            // console.log("Customer Transaction Reference ,@ ApprovalsController line 1529 ==================")
            // console.log(newPaymentReference);
            interestPayoutRequestReference = newPaymentReference;
            record.interestPayoutRequestReference = newPaymentReference;
            record.numberOfAttempts = numberOfAttempts;
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
            // console.log(" Current log, line 1534 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1538 :", updatedInvestment);

            // console.log("Updated record Status line 1540: ", record);
            //  let creditUserWalletWithInterest;
            // Check if the amount is not Zero or less
            if (interestDueOnInvestment <= 0) {
              creditUserWalletWithInterest = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
            // // Check if the amount is not Zero or less
            // if (interestDueOnInvestment <= 0) {
            //   let amountPaidOut = interestDueOnInvestment
            //   // update the investment details
            //   record.isInvestmentCompleted = true;
            //   record.investmentCompletionDate = DateTime.now();
            //   record.status = 'completed_with_principal_payout_outstanding';
            //   record.interestPayoutStatus = "completed";
            //   record.approvalStatus = approval.approvalStatus;//'payout'
            //   record.isPayoutAuthorized = true;
            //   record.isPayoutSuccessful = true;
            //   record.datePayoutWasDone = DateTime.now();
            //   // //debugger

            //   // Save the updated record
            //   // await record.save();
            //   // update record
            //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            //   // console.log(" Current log, line 532 :", currentInvestment);
            //   // send for update
            //   await investmentsService.updateInvestment(currentInvestment, record);
            //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            //   // console.log(" Current log, line 1726 :", updatedInvestment);

            //   // console.log("Updated record Status line 537: ", record);

            //   // update timeline
            //   timelineObject = {
            //     id: uuid(),
            //     action: "investment payout",
            //     investmentId: investmentId,//id,
            //     walletId: walletIdToSearch,// walletId,
            //     userId: userIdToSearch,// userId,
            //     // @ts-ignore
            //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
            //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
            //     createdAt: DateTime.now(),
            //     metadata: ``,
            //   };
            //   // console.log("Timeline object line 551:", timelineObject);
            //   await timelineService.createTimeline(timelineObject);
            //   // let newTimeline = await timelineService.createTimeline(timelineObject);
            //   // console.log("new Timeline object line 553:", newTimeline);
            //   // update record


            //   // Send Notification to admin and others stakeholder
            //   let investment = record;
            //   let messageKey = "payout";
            //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            //   // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
            //   // //debugger
            //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //     console.log("Notification sent successfully");
            //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //     console.log("Notification NOT sent successfully");
            //     console.log(newNotificationMessageWithoutPdf);
            //   }
            // }else{
            // Payout Interest
            creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
              beneficiaryName,
              beneficiaryAccountNumber,
              beneficiaryAccountName,
              beneficiaryEmail,
              beneficiaryPhoneNumber,
              rfiCode, userId,
              descriptionForInterest);
            debugger
          }
          }

          // NEW CODE END

          // //debugger
          // if successful
          // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest &&  creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
          if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
            let amountPaidOut = amount + interestDueOnInvestment;
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            record.status = 'completed';
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            record.principalPayoutStatus = "completed";
            record.interestPayoutStatus = "completed";
            // //debugger


            // Save the updated record
            // await record.save();
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            // console.log(" Current log, line 532 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 535 :", updatedInvestment);

            // console.log("Updated record Status line 537: ", record);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
              adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 551:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 553:", newTimeline);
            // update record

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1338:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }

            // } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
          } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
            let amountPaidOut = amount
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            record.status = 'completed_with_interest_payout_outstanding';
            record.principalPayoutStatus = "completed";
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // //debugger
            // Save the updated record
            // await record.save();
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            // console.log(" Current log, line 1668 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1671 :", updatedInvestment);

            // console.log("Updated record Status line 537: ", record);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
              adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 551:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 553:", newTimeline);
            // update record

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }

            // } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
          } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
            let amountPaidOut = interestDueOnInvestment;
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            record.status = 'completed_with_principal_payout_outstanding';
            record.interestPayoutStatus = "completed";
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // //debugger

            // Save the updated record
            // await record.save();
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            // console.log(" Current log, line 532 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 1726 :", updatedInvestment);

            // console.log("Updated record Status line 537: ", record);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
              adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 551:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 553:", newTimeline);
            // update record


            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }

          } else {
            throw Error(`Unable to Payout the investment with ID: ${id}, at this time. Please try again later. Thank you.`);
          }
          // } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_rollover" && isRolloverSuspended === false && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_rollover" && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"  
          console.log("Approval for investment rollover activation processing: ===========================================>")

          // newStatus = "submitted";
          // newStatus = "rollover"; //'pending_account_number_generation';
          // record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus; //"rollover"//approval.approvalStatus;
          record.isRolloverSuspended = isRolloverSuspended;
          debugger
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
            // totalAmountToPayout,
            startDate,
            interestPayoutRequestReference,
            principalPayoutRequestReference,
          } = record;
          let beneficiaryName = `${firstName} ${lastName}`;
          let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
          let beneficiaryAccountName = beneficiaryName;
          let beneficiaryPhoneNumber = phone;
          let beneficiaryEmail = email;
          // Send to the endpoint for debit of wallet
          let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
          let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
          let isDueForPayout = await dueForPayout(startDate, duration)
          // console.log('Is due for payout status line 2450:', isDueForPayout)
          if (isDueForPayout) {

            // Check if the user set Rollover
            // "rolloverType": "101",
            // "rolloverTarget": 3,
            // "rolloverDone": 0,
            // '100' = 'no rollover',
            //   '101' = 'rollover principal only',
            //   '102' = 'rollover principal with interest',
            //   '103' = 'rollover interest only',
            if ((isRolloverActivated == true && rolloverType !== "100" && status === "matured") || (isRolloverActivated == true && rolloverType !== "100" && status === "active") ||
              (isRolloverActivated == true && rolloverType !== "100" && status === "active")) { //"payout_suspended" "rollover_suspended"
                // || (isRolloverActivated == true && rolloverType !== "100" && status === "matured")
              // if (isRolloverActivated == true && rolloverTarget > 0 && rolloverTarget > rolloverDone && rolloverType !== "100") {
              // //debugger
              // check type of rollover
              if (rolloverType == "101") {
                //   '101' = 'rollover principal only',
                // payout interest
                // NEW CODE START
                let creditUserWalletWithInterest;
                // check if transaction with same customer ref exist
                let checkTransactionStatusByCustomerRef = await checkTransactionStatus(interestPayoutRequestReference, rfiCode);
                //debugger
                // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                // if (!checkTransactionStatusByCustomerRef) 
                if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
                  //@ts-ignore
                  let investmentId = record.id
                  // Create Unique payment reference for the customer
                  let reference = DateTime.now() + randomstring.generate(4);
                  let numberOfAttempts = 1;
                  let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                  // console.log("Customer Transaction Reference ,@ ApprovalsController line 1822 ==================")
                  // console.log(paymentReference);
                  // let getNumberOfAttempt = paymentReference.split("/");
                  // console.log("getNumberOfAttempt line 1825 =====", getNumberOfAttempt[1]);
                  //debugger;
                  // @ts-ignore
                  record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                  record.numberOfAttempts = numberOfAttempts;
                  interestPayoutRequestReference = paymentReference;
                  let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                  // //debugger
                  // console.log(" Current log, line 1832 :", currentInvestment);
                  // send for update
                  await investmentsService.updateInvestment(currentInvestment, record);
                  //  let creditUserWalletWithInterest;
                  // Check if the amount is not Zero or less
                  if (interestDueOnInvestment <= 0) {
                    creditUserWalletWithInterest = {
                      status: 200,
                      data: { screenStatus: "APPROVED" }
                    }
                    debugger
                  } else {
                  // // Check if the amount is not Zero or less
                  // if (interestDueOnInvestment <= 0) {
                  //     let amountPaidOut = interestDueOnInvestment;
                  //     // update the investment details
                  //     record.isInvestmentCompleted = true;
                  //     record.investmentCompletionDate = DateTime.now();
                  //     record.status = 'completed';
                  //     record.interestPayoutStatus = "completed";
                  //     record.approvalStatus = approval.approvalStatus;//'payout'
                  //     record.isPayoutAuthorized = true;
                  //     record.isPayoutSuccessful = true;
                  //     record.datePayoutWasDone = DateTime.now();
                  //     // //debugger

                  //     // Save the updated record
                  //     // await record.save();
                  //     // update record
                  //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                  //     // console.log(" Current log, line 1864 :", currentInvestment);
                  //     // send for update
                  //     await investmentsService.updateInvestment(currentInvestment, record);
                  //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  //     // console.log(" Current log, line 1865 :", updatedInvestment);

                  //     // console.log("Updated record Status line 1869: ", record);

                  //     // update timeline
                  //     timelineObject = {
                  //       id: uuid(),
                  //       action: "investment payout",
                  //       investmentId: investmentId,//id,
                  //       walletId: walletIdToSearch,// walletId,
                  //       userId: userIdToSearch,// userId,
                  //       // @ts-ignore
                  //       message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                  //       adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                  //       createdAt: DateTime.now(),
                  //       metadata: ``,
                  //     };
                  //     // console.log("Timeline object line 1883:", timelineObject);
                  //     await timelineService.createTimeline(timelineObject);
                  //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                  //     // console.log("new Timeline object line 1886:", newTimeline);
                  //     // update record

                  //     // Send Notification to admin and others stakeholder
                  //     let investment = record;
                  //     let messageKey = "payout";
                  //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                  //     // console.log("newNotificationMessage line 1893:", newNotificationMessageWithoutPdf);
                  //     // //debugger
                  //     if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  //       console.log("Notification sent successfully");
                  //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  //       console.log("Notification NOT sent successfully");
                  //       console.log(newNotificationMessageWithoutPdf);
                  //     }
                  // }else{
                  // initiate a new  transaction
                  // Payout Interest
                  creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode, userId,
                    descriptionForInterest);
                  debugger
                  }
                  // if successful
                  // if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
                    let amountPaidOut = interestDueOnInvestment;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.interestPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1864 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1865 :", updatedInvestment);

                    // console.log("Updated record Status line 1869: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1883:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1886:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1893:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

                  }
                

                } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                  // update the value for number of attempts
                  // get the current investmentRef, split , add one to the current number, update and try again
                  let getNumberOfAttempt = interestPayoutRequestReference.split("_");
                  // console.log("getNumberOfAttempt line 1908 =====", getNumberOfAttempt[1]);
                  let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
                  let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                  let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                  // console.log("Customer Transaction Reference ,@ ApprovalsController line 1912 ==================")
                  // console.log(newPaymentReference);
                  interestPayoutRequestReference = newPaymentReference;
                  record.interestPayoutRequestReference = interestPayoutRequestReference;
                  record.numberOfAttempts = numberOfAttempts;

                  // update record
                  let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                  // console.log(" Current log, line 1918 :", currentInvestment);
                  // send for update
                  await investmentsService.updateInvestment(currentInvestment, record);
                  // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  // console.log(" Current log, line 1922 :", updatedInvestment);
                  // console.log("Updated record Status line 1924: ", record);
                  //  let creditUserWalletWithInterest;
                  // Check if the amount is not Zero or less
                  if (interestDueOnInvestment <= 0) {
                    creditUserWalletWithInterest = {
                      status: 200,
                      data: { screenStatus: "APPROVED" }
                    }
                    debugger
                  } else {
                  // // Check if the amount is not Zero or less
                  // if (interestDueOnInvestment <= 0) {
                  //     let amountPaidOut = interestDueOnInvestment;
                  //     // update the investment details
                  //     record.isInvestmentCompleted = true;
                  //     record.investmentCompletionDate = DateTime.now();
                  //     record.status = 'completed';
                  //     record.interestPayoutStatus = "completed";
                  //     record.approvalStatus = approval.approvalStatus;//'payout'
                  //     record.isPayoutAuthorized = true;
                  //     record.isPayoutSuccessful = true;
                  //     record.datePayoutWasDone = DateTime.now();
                  //     // //debugger

                  //     // Save the updated record
                  //     // await record.save();
                  //     // update record
                  //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                  //     // console.log(" Current log, line 1031 :", currentInvestment);
                  //     // send for update
                  //     await investmentsService.updateInvestment(currentInvestment, record);
                  //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  //     // console.log(" Current log, line 1034 :", updatedInvestment);

                  //     // console.log("Updated record Status line 537: ", record);

                  //     // update timeline
                  //     timelineObject = {
                  //       id: uuid(),
                  //       action: "investment payout",
                  //       investmentId: investmentId,//id,
                  //       walletId: walletIdToSearch,// walletId,
                  //       userId: userIdToSearch,// userId,
                  //       // @ts-ignore
                  //       message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                  //       adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                  //       createdAt: DateTime.now(),
                  //       metadata: ``,
                  //     };
                  //     // console.log("Timeline object line 1606:", timelineObject);
                  //     await timelineService.createTimeline(timelineObject);
                  //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                  //     // console.log("new Timeline object line 1609:", newTimeline);
                  //     // update record

                  //     // Send Notification to admin and others stakeholder
                  //     let investment = record;
                  //     let messageKey = "payout";
                  //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                  //     // console.log("newNotificationMessage line 1643:", newNotificationMessageWithoutPdf);
                  //     // //debugger
                  //     if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  //       console.log("Notification sent successfully");
                  //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  //       console.log("Notification NOT sent successfully");
                  //       console.log(newNotificationMessageWithoutPdf);
                  //     }
                  // }else {
                  // Payout interest
                  creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode, userId,
                    descriptionForInterest);
                  debugger
                  }
                  // if successful
                  // if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
                    let amountPaidOut = interestDueOnInvestment;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.interestPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1031 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1034 :", updatedInvestment);

                    // console.log("Updated record Status line 537: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1606:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1609:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1643:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

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
                  principalPayoutStatus: "pending",
                  interestPayoutStatus: "pending",
                  penalty: 0,
                  verificationRequestAttempts: 0,
                  numberOfAttempts: 0,
                };
                await investmentsService.createNewInvestment(newInvestmentPayload, amount)
                // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, amount)
                // console.log("newInvestmentDetails line 2050", newInvestmentDetails)
                // //debugger
              } else if (rolloverType == "102") {
                // Rollover Principal and interest
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: "investment rollover",
                  investmentId: investmentId,//id,
                  walletId: walletIdToSearch,// walletId,
                  userId: userIdToSearch,// userId,
                  // @ts-ignore
                  message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment has been rollover. Thank you.`,
                  adminMessage: `The sum of ${currencyCode} ${totalAmountToPayout} for ${firstName} matured investment was rollover.`,
                  createdAt: DateTime.now(),
                  metadata: ``,
                };
                // console.log("Timeline object line 1694:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 1697:", newTimeline);

                // Send Notification to admin and others stakeholder
                let investment = record;
                let messageKey = "rollover";
                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                // console.log("newNotificationMessage line 1731:", newNotificationMessageWithoutPdf);
                // //debugger
                if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  console.log("Notification sent successfully");
                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  console.log("Notification NOT sent successfully");
                  console.log(newNotificationMessageWithoutPdf);
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
                  principalPayoutStatus: "pending",
                  interestPayoutStatus: "pending",
                  penalty: 0,
                  verificationRequestAttempts: 0,
                  numberOfAttempts: 0,
                };
                await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
                // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
                // console.log("newInvestmentDetails line 2120", newInvestmentDetails)
                // //debugger
              } else if (rolloverType == "103") {
                //   '103' = 'rollover interest only',
                // Payout Principal
                // NEW CODE START
                let creditUserWalletWithPrincipal;
                // check if transaction with same customer ref exist
                let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference, rfiCode);
                //debugger
                // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
                // if (!checkTransactionStatusByCustomerRef) 
                if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
                  //@ts-ignore
                  let investmentId = record.id
                  // Create Unique payment reference for the customer
                  let reference = DateTime.now() + randomstring.generate(4);
                  let numberOfAttempts = 1;
                  let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
                  // console.log("Customer Transaction Reference ,@ ApprovalsController line 2191 ==================")
                  // console.log(paymentReference);
                  let getNumberOfAttempt = paymentReference.split("_");
                  console.log("getNumberOfAttempt line 2194 =====", getNumberOfAttempt[1]);
                  //debugger;
                  // @ts-ignore
                  record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
                  record.numberOfAttempts = numberOfAttempts;
                  principalPayoutRequestReference = paymentReference;
                  let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                  // //debugger
                  // console.log(" Current log, line 1443 :", currentInvestment);
                  // send for update
                  await investmentsService.updateInvestment(currentInvestment, record);
                              //  let creditUserWalletWithPrincipal;
            // Check if the amount is not Zero or less
            if (amount <= 0) {
              creditUserWalletWithPrincipal = {
                status: 200,
                data: { screenStatus: "APPROVED" }
              }
              debugger
            } else {
                  // // Check if the amount is not Zero or less
                  // if (amount <= 0) {
                  //     let amountPaidOut = amount;
                  //     // update the investment details
                  //     record.isInvestmentCompleted = true;
                  //     record.investmentCompletionDate = DateTime.now();
                  //     record.status = 'completed';
                  //     record.principalPayoutStatus = "completed";
                  //     record.approvalStatus = approval.approvalStatus;//'payout'
                  //     record.isPayoutAuthorized = true;
                  //     record.isPayoutSuccessful = true;
                  //     record.datePayoutWasDone = DateTime.now();
                  //     // //debugger

                  //     // Save the updated record
                  //     // await record.save();
                  //     // update record
                  //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                  //     // console.log(" Current log, line 1031 :", currentInvestment);
                  //     // send for update
                  //     await investmentsService.updateInvestment(currentInvestment, record);
                  //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  //     // console.log(" Current log, line 1034 :", updatedInvestment);

                  //     // console.log("Updated record Status line 537: ", record);

                  //     // update timeline
                  //     timelineObject = {
                  //       id: uuid(),
                  //       action: "investment payout",
                  //       investmentId: investmentId,//id,
                  //       walletId: walletIdToSearch,// walletId,
                  //       userId: userIdToSearch,// userId,
                  //       // @ts-ignore
                  //       message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                  //       adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                  //       createdAt: DateTime.now(),
                  //       metadata: ``,
                  //     };
                  //     // console.log("Timeline object line 1448:", timelineObject);
                  //     await timelineService.createTimeline(timelineObject);
                  //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                  //     // console.log("new Timeline object line 1451:", newTimeline);
                  //     // update record

                  //     // Send Notification to admin and others stakeholder
                  //     let investment = record;
                  //     let messageKey = "payout";
                  //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                  //     // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                  //     // //debugger
                  //     if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  //       console.log("Notification sent successfully");
                  //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  //       console.log("Notification NOT sent successfully");
                  //       console.log(newNotificationMessageWithoutPdf);
                  //     }
                  // }else{
                  // initiate a new  transaction
                  // Payout Principal
                  creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode, userId,
                    descriptionForPrincipal);
                  debugger
                  }
                  // if successful
                  // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
                    let amountPaidOut = amount;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.principalPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1031 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1034 :", updatedInvestment);

                    // console.log("Updated record Status line 537: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1448:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1451:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

                  }
                

                } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
                  // update the value for number of attempts
                  // get the current investmentRef, split , add one to the current number, update and try again
                  let getNumberOfAttempt = principalPayoutRequestReference.split("_");
                  // console.log("getNumberOfAttempt line 2283 =====", getNumberOfAttempt[1]);
                  let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
                  let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
                  let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
                  // console.log("Customer Transaction Reference ,@ ApprovalsController line 2287 ==================")
                  // console.log(newPaymentReference);
                  principalPayoutRequestReference = newPaymentReference;
                  record.principalPayoutRequestReference = newPaymentReference;
                  record.numberOfAttempts = numberOfAttempts;

                  // update record
                  let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
                  // console.log(" Current log, line 1470 :", currentInvestment);
                  // send for update
                  await investmentsService.updateInvestment(currentInvestment, record);
                  // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  // console.log(" Current log, line 1474 :", updatedInvestment);

                  // console.log("Updated record Status line 1476: ", record);
                  // let creditUserWalletWithPrincipal;
                  // Check if the amount is not Zero or less
                  if (amount <= 0) {
                    creditUserWalletWithPrincipal = {
                      status: 200,
                      data: { screenStatus: "APPROVED" }
                    }
                    debugger
                  } else {
                  // // Check if the amount is not Zero or less
                  // if (amount <= 0) {
                  //     let amountPaidOut = amount;
                  //     // update the investment details
                  //     record.isInvestmentCompleted = true;
                  //     record.investmentCompletionDate = DateTime.now();
                  //     record.status = 'completed';
                  //     record.principalPayoutStatus = "completed";
                  //     record.approvalStatus = approval.approvalStatus;//'payout'
                  //     record.isPayoutAuthorized = true;
                  //     record.isPayoutSuccessful = true;
                  //     record.datePayoutWasDone = DateTime.now();
                  //     // //debugger

                  //     // Save the updated record
                  //     // await record.save();
                  //     // update record
                  //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                  //     // console.log(" Current log, line 1031 :", currentInvestment);
                  //     // send for update
                  //     await investmentsService.updateInvestment(currentInvestment, record);
                  //     // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                  //     // console.log(" Current log, line 1034 :", updatedInvestment);

                  //     // console.log("Updated record Status line 537: ", record);

                  //     // update timeline
                  //     timelineObject = {
                  //       id: uuid(),
                  //       action: "investment payout",
                  //       investmentId: investmentId,//id,
                  //       walletId: walletIdToSearch,// walletId,
                  //       userId: userIdToSearch,// userId,
                  //       // @ts-ignore
                  //       message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                  //       adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                  //       createdAt: DateTime.now(),
                  //       metadata: ``,
                  //     };
                  //     // console.log("Timeline object line 1448:", timelineObject);
                  //     await timelineService.createTimeline(timelineObject);
                  //     // let newTimeline = await timelineService.createTimeline(timelineObject);
                  //     // console.log("new Timeline object line 1451:", newTimeline);
                  //     // update record

                  //     // Send Notification to admin and others stakeholder
                  //     let investment = record;
                  //     let messageKey = "payout";
                  //     let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                  //     // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                  //     // //debugger
                  //     if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                  //       console.log("Notification sent successfully");
                  //     } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                  //       console.log("Notification NOT sent successfully");
                  //       console.log(newNotificationMessageWithoutPdf);
                  //     }
                  // }else{
                  // Payout Principal
                  creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                    beneficiaryName,
                    beneficiaryAccountNumber,
                    beneficiaryAccountName,
                    beneficiaryEmail,
                    beneficiaryPhoneNumber,
                    rfiCode, userId,
                    descriptionForPrincipal);
                  debugger
                  }
                  // if successful
                  // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL") {
                  if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED") {
                    let amountPaidOut = amount;
                    // update the investment details
                    record.isInvestmentCompleted = true;
                    record.investmentCompletionDate = DateTime.now();
                    record.status = 'completed';
                    record.principalPayoutStatus = "completed";
                    record.approvalStatus = approval.approvalStatus;//'payout'
                    record.isPayoutAuthorized = true;
                    record.isPayoutSuccessful = true;
                    record.datePayoutWasDone = DateTime.now();
                    // //debugger

                    // Save the updated record
                    // await record.save();
                    // update record
                    let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                    // console.log(" Current log, line 1031 :", currentInvestment);
                    // send for update
                    await investmentsService.updateInvestment(currentInvestment, record);
                    // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                    // console.log(" Current log, line 1034 :", updatedInvestment);

                    // console.log("Updated record Status line 537: ", record);

                    // update timeline
                    timelineObject = {
                      id: uuid(),
                      action: "investment payout",
                      investmentId: investmentId,//id,
                      walletId: walletIdToSearch,// walletId,
                      userId: userIdToSearch,// userId,
                      // @ts-ignore
                      message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                      adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                      createdAt: DateTime.now(),
                      metadata: ``,
                    };
                    // console.log("Timeline object line 1448:", timelineObject);
                    await timelineService.createTimeline(timelineObject);
                    // let newTimeline = await timelineService.createTimeline(timelineObject);
                    // console.log("new Timeline object line 1451:", newTimeline);
                    // update record

                    // Send Notification to admin and others stakeholder
                    let investment = record;
                    let messageKey = "payout";
                    let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
                    // console.log("newNotificationMessage line 1855:", newNotificationMessageWithoutPdf);
                    // //debugger
                    if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                      console.log("Notification sent successfully");
                    } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                      console.log("Notification NOT sent successfully");
                      console.log(newNotificationMessageWithoutPdf);
                    }

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
                  principalPayoutStatus: "pending",
                  interestPayoutStatus: "pending",
                  penalty: 0,
                  verificationRequestAttempts: 0,
                  numberOfAttempts: 0,
                }
                await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
                // let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
                // console.log("newInvestmentDetails line 2353", newInvestmentDetails)
                // //debugger
              }
            }
          } else {
            record.status = "active";
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // //debugger
            // console.log(" Current log, line 3010 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
          }

          // } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_rollover" && isRolloverSuspended === true && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_rollover" && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment rollover suspension processing: ===========================================>")

          // console.log("Timeline object line 2997:", record);
          //debugger
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus; //"rollover"//approval.approvalStatus;
          record.isRolloverSuspended = isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          // TODO: Just commented out on frontend request on 23-06-2023
          // newStatus = "rollover_suspended";
          // record.status = newStatus;
          debugger
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment rollover pending",
            investmentId: investmentId,//id,
            walletId: walletIdToSearch,// walletId,
            userId: userIdToSearch,// userId,
            // @ts-ignore
            message: `${firstName} the rollover of your investment is pending and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }. Thank you.`,
            adminMessage: `The rollover of investment was suspended and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1453:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1935:", newTimeline);
          // update record

          // Send Details to notification service
          // let subject = "AstraPay Investment Rollover Pending";
          // let message = `
          //     ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // // console.log("newNotificationMessage line 1947:", newNotificationMessage);
          // // //debugger
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }
         

          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1455 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          //debugger
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 1459 :", updatedInvestment);
          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "rollover_pending";
          // let newNotificationMessageWithoutPdf = await 
          sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // // console.log("newNotificationMessage line 1959:", newNotificationMessageWithoutPdf);
          // // //debugger
          // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessageWithoutPdf);
          // }

          // } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_payout" && isPayoutSuspended === false && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_payout" && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing suspension: ===========================================>")
          // TODO: Just commented out on frontend request on 04-10-2023
          // newStatus = "payout_activated";
          // record.status = newStatus;
          record.isRolloverSuspended = isRolloverSuspended ? isRolloverSuspended : record.isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          record.isPayoutSuspended = isPayoutSuspended ? isPayoutSuspended : record.isPayoutSuspended;
          record.payoutReactivationDate = payoutReactivationDate;
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = "approved"; //approval.approvalStatus;
          debugger
          // Data to send for transfer of fund
          let { firstName,// email,
            totalAmountToPayout, startDate, duration } = record; // interestDueOnInvestment,

          // console.log("Updated record Status line 1439: ", record);
          // if (isRolloverSuspended === true) {
          //   newStatus = "rollover_suspended";
          //   record.status = newStatus;
          //   // update timeline
          //   timelineObject = {
          //     id: uuid(),
          //     action: "investment rollover pending",
          //     investmentId: investmentId,//id,
          //     walletId: walletIdToSearch,// walletId,
          //     userId: userIdToSearch,// userId,
          //     // @ts-ignore
          //     message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
          //     adminMessage: `The rollover of ${firstName} matured investment is suspended and will be process for rollover on or before ${rolloverReactivationDate}.`,
          //     createdAt: DateTime.now(),
          //     metadata: ``,
          //   };
          //   // console.log("Timeline object line 1453:", timelineObject);
          //   await timelineService.createTimeline(timelineObject);
          //   // let newTimeline = await timelineService.createTimeline(timelineObject);
          //   // console.log("new Timeline object line 1456:", newTimeline);

          //   // Send Notification to admin and others stakeholder
          //   let investment = record;
          //   let messageKey = "rollover_pending";
          //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          //   // console.log("newNotificationMessage line 2039:", newNotificationMessageWithoutPdf);
          //   // //debugger
          //   if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //     console.log("Notification sent successfully");
          //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //     console.log("Notification NOT sent successfully");
          //     console.log(newNotificationMessageWithoutPdf);
          //   }

          // } else if (isRolloverSuspended === false) {
          //   newStatus = "completed";//"matured";//"rollover_activated";//
          //   record.status = newStatus;
          //   // update timeline
          //   timelineObject = {
          //     id: uuid(),
          //     action: "investment rollover activated",
          //     investmentId: investmentId,//id,
          //     walletId: walletIdToSearch,// walletId,
          //     userId: userIdToSearch,// userId,
          //     // @ts-ignore
          //     message: `${firstName} the rollover of your matured investment is activated and will be process for rollover. Thank you.`,
          //     adminMessage: `The rollover of ${firstName} matured investment is activated and will be process for rollover.`,
          //     createdAt: DateTime.now(),
          //     metadata: ``,
          //   };
          //   // console.log("Timeline object line 1959:", timelineObject);
          //   await timelineService.createTimeline(timelineObject);
          //   // let newTimeline = await timelineService.createTimeline(timelineObject);
          //   // console.log("new Timeline object line 1962:", newTimeline);
          //   // update record
          //   // Send Notification to admin and others stakeholder
          //   let investment = record;
          //   let messageKey = "activation";
          //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          //   // console.log("newNotificationMessage line 2090:", newNotificationMessageWithoutPdf);
          //   // //debugger
          //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //     console.log("Notification sent successfully");
          //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //     console.log("Notification NOT sent successfully");
          //     console.log(newNotificationMessageWithoutPdf);
          //   }

          // }

          if (isPayoutSuspended === true) {
            // TODO: Just commented out on frontend request on 04-10-2023
            // newStatus = "payout_suspended";
            // record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your investment will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate, "DD-MM-YYYY") }. Thank you.`,
              adminMessage: `The payout of the sum of ${currencyCode} ${totalAmountToPayout} was suspended and will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate,"DD-MM-YYYY")}.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout_pending";
            // let newNotificationMessageWithoutPdf = await 
            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 2143:", newNotificationMessageWithoutPdf);
            // // //debugger
            // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessageWithoutPdf);
            // }

          } else if (isPayoutSuspended === false) {
            // newStatus = "completed";//"matured"; //"payout_activated";//
            // record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout activation",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your investment has been activated for payment processing. Thank you.`,
              adminMessage: `The sum of ${currencyCode} ${totalAmountToPayout} for ${firstName} matured investment was activated for payment processing.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout_activation";
            // let newNotificationMessageWithoutPdf = await 
            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 2194:", newNotificationMessageWithoutPdf);
            // // //debugger
            // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessageWithoutPdf);
            // }

          }

          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 2200 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 2204 :", updatedInvestment);
          // TODO: Payout Money to Customer Wallet
          // Data to send for transfer of fund
          let { amount, lng, lat, id, userId,
            lastName,
            walletId, investorFundingWalletId,
            phone,
            email,
            interestDueOnInvestment, principalPayoutRequestReference, interestPayoutRequestReference } = record;
          let beneficiaryName = `${firstName} ${lastName}`;
          let beneficiaryAccountNumber = investorFundingWalletId;//walletId;
          let beneficiaryAccountName = beneficiaryName;
          let beneficiaryPhoneNumber = phone;
          let beneficiaryEmail = email;
          // Send to the endpoint for debit of wallet
          let descriptionForPrincipal = `Payout of the principal of ${currencyCode} ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
          let descriptionForInterest = `Payout of the interest of ${currencyCode} ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;
          let isDueForPayout = await dueForPayout(startDate, duration)
          console.log('Is due for payout status line 3277:', isDueForPayout)
          if (isDueForPayout) {
            // NEW CODE START
            let creditUserWalletWithPrincipal;
            let creditUserWalletWithInterest;
            // check if transaction with same customer ref exist
            let checkTransactionStatusByCustomerRef = await checkTransactionStatus(principalPayoutRequestReference, rfiCode);
            //debugger
            // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
            // if (!checkTransactionStatusByCustomerRef) 
            if ((!checkTransactionStatusByCustomerRef) || (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS")) {
              //@ts-ignore
              let investmentId = record.id
              // Create Unique payment reference for the customer
              let reference = DateTime.now() + randomstring.generate(4);
              let numberOfAttempts = 1;
              let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
              // console.log("Customer Transaction Reference ,@ ApprovalsController line 1433 ==================")
              // console.log(paymentReference);
              // let getNumberOfAttempt = paymentReference.split("/");
              // console.log("getNumberOfAttempt line 1436 =====", getNumberOfAttempt[1]);
              //debugger;
              // @ts-ignore
              record.principalPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
              principalPayoutRequestReference = paymentReference;
              record.numberOfAttempts = numberOfAttempts;
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
              // //debugger
              // console.log(" Current log, line 3288 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let creditUserWalletWithPrincipal;
              // Check if the amount is not Zero or less
              if (amount <= 0) {
                creditUserWalletWithPrincipal = {
                  status: 200,
                  data: { screenStatus: "APPROVED" }
                }
                debugger
              } else {
              // // Check if the amount is not Zero or less
              // if (amount <= 0) {
              //   let amountPaidOut = amount
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_interest_payout_outstanding';
              //   record.principalPayoutStatus = "completed";
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   // //debugger
              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 1668 :", currentInvestment);
              //   // send for update
              //   await investmentsService.updateInvestment(currentInvestment, record);
              //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   // console.log(" Current log, line 3490 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId,
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
              //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record

              //   // Send Notification to admin and others stakeholder
              //   let investment = record;
              //   let messageKey = "payout";
              //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              //   // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
              //   // //debugger
              //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessageWithoutPdf);
              //   }
              // }else{
              // initiate a new  transaction
              // Payout Principal
              creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                beneficiaryName,
                beneficiaryAccountNumber,
                beneficiaryAccountName,
                beneficiaryEmail,
                beneficiaryPhoneNumber,
                rfiCode, userId,
                descriptionForPrincipal);
              debugger
            }

            } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
              // update the value for number of attempts
              // get the current investmentRef, split , add one to the current number, update and try again
              let getNumberOfAttempt = principalPayoutRequestReference.split("_");
              // console.log("getNumberOfAttempt line 3307 =====", getNumberOfAttempt[1]);
              let numberOfAttempts = record.numberOfAttempts + 1; //Number(getNumberOfAttempt[1]) + 1;
              let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
              let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
              // console.log("Customer Transaction Reference ,@ ApprovalsController line 3311 ==================")
              // console.log(newPaymentReference);
              principalPayoutRequestReference = newPaymentReference;
              record.principalPayoutRequestReference = newPaymentReference;
              record.numberOfAttempts = numberOfAttempts;
              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
              // console.log(" Current log, line 1470 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 1474 :", updatedInvestment);

              // console.log("Updated record Status line 1476: ", record);
              // let creditUserWalletWithPrincipal;
              // Check if the amount is not Zero or less
              if (amount <= 0) {
                creditUserWalletWithPrincipal = {
                  status: 200,
                  data: { screenStatus: "APPROVED" }
                }
                debugger
              } else {
              // // Check if the amount is not Zero or less
              // if (amount <= 0) {
              //   let amountPaidOut = amount
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_interest_payout_outstanding';
              //   record.principalPayoutStatus = "completed";
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   // //debugger
              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 1668 :", currentInvestment);
              //   // send for update
              //   await investmentsService.updateInvestment(currentInvestment, record);
              //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   // console.log(" Current log, line 3490 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId,
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
              //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record

              //   // Send Notification to admin and others stakeholder
              //   let investment = record;
              //   let messageKey = "payout";
              //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              //   // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
              //   // //debugger
              //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessageWithoutPdf);
              //   }

              // }else{
              // Payout Principal
              creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, principalPayoutRequestReference,
                beneficiaryName,
                beneficiaryAccountNumber,
                beneficiaryAccountName,
                beneficiaryEmail,
                beneficiaryPhoneNumber,
                rfiCode, userId,
                descriptionForPrincipal);
              debugger
            }
            }

            // check if transaction with same customer ref exist
            let checkTransactionStatusByCustomerRef02 = await checkTransactionStatus(interestPayoutRequestReference, rfiCode);
            // if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef02.message);
            // if (!checkTransactionStatusByCustomerRef02) 
            if ((!checkTransactionStatusByCustomerRef02) || (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.status == "FAILED TO GET TRANSACTION STATUS")) {
              //@ts-ignore
              let investmentId = record.id
              // Create Unique payment reference for the customer
              let reference = DateTime.now() + randomstring.generate(4);
              let numberOfAttempts = 1;
              let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
              // console.log("Customer Transaction Reference ,@ ApprovalsController line 1497 ==================")
              // console.log(paymentReference);
              // let getNumberOfAttempt = paymentReference.split("_");
              // console.log("getNumberOfAttempt line 1500 =====", getNumberOfAttempt[1]);
              //debugger;
              // @ts-ignore
              record.interestPayoutRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);
              record.numberOfAttempts = numberOfAttempts;
              interestPayoutRequestReference = paymentReference;
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
              // //debugger
              // console.log(" Current log, line 1507 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              //  let creditUserWalletWithInterest;
              // Check if the amount is not Zero or less
              if (interestDueOnInvestment <= 0) {
                creditUserWalletWithInterest = {
                  status: 200,
                  data: { screenStatus: "APPROVED" }
                }
                debugger
              } else {
              // // Check if the amount is not Zero or less
              // if (interestDueOnInvestment <= 0) {
              //   let amountPaidOut = interestDueOnInvestment
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_principal_payout_outstanding';
              //   record.interestPayoutStatus = "completed";
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   // //debugger

              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 532 :", currentInvestment);
              //   // send for update
              //   await investmentsService.updateInvestment(currentInvestment, record);
              //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   // console.log(" Current log, line 1726 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId,
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
              //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record


              //   // Send Notification to admin and others stakeholder
              //   let investment = record;
              //   let messageKey = "payout";
              //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              //   // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
              //   // //debugger
              //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessageWithoutPdf);
              //   }
              // }else{
              // initiate a new  transaction
              // Payout Interest
              creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                beneficiaryName,
                beneficiaryAccountNumber,
                beneficiaryAccountName,
                beneficiaryEmail,
                beneficiaryPhoneNumber,
                rfiCode, userId,
                descriptionForInterest)
              debugger
            }

            } else if (checkTransactionStatusByCustomerRef02 && checkTransactionStatusByCustomerRef02.data.screenStatus === "FAILED") {
              // update the value for number of attempts
              // get the current investmentRef, split , add one to the current number, update and try again
              let getNumberOfAttempt = principalPayoutRequestReference.split("_");
              // console.log("getNumberOfAttempt line 817 =====", getNumberOfAttempt[1]);
              let numberOfAttempts = record.numberOfAttempts + 1;// Number(getNumberOfAttempt[1]) + 1;
              let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
              let newPaymentReference = `${uniqueInvestmentRequestReference}_${numberOfAttempts}`;
              // console.log("Customer Transaction Reference ,@ ApprovalsController line 1529 ==================")
              // console.log(newPaymentReference);
              interestPayoutRequestReference = newPaymentReference;
              record.interestPayoutRequestReference = newPaymentReference;
              record.numberOfAttempts = numberOfAttempts;
              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, walletId, userId);
              // console.log(" Current log, line 1534 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 1538 :", updatedInvestment);

              // console.log("Updated record Status line 1540: ", record);
              //  let creditUserWalletWithInterest;
              // Check if the amount is not Zero or less
              if (interestDueOnInvestment <= 0) {
                creditUserWalletWithInterest = {
                  status: 200,
                  data: { screenStatus: "APPROVED" }
                }
                debugger
              } else {
              // Check if the amount is not Zero or less
              // if (interestDueOnInvestment <= 0) {
              //   let amountPaidOut = interestDueOnInvestment
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_principal_payout_outstanding';
              //   record.interestPayoutStatus = "completed";
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   // //debugger

              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 532 :", currentInvestment);
              //   // send for update
              //   await investmentsService.updateInvestment(currentInvestment, record);
              //   // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   // console.log(" Current log, line 1726 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId,
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
              //     adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record


              //   // Send Notification to admin and others stakeholder
              //   let investment = record;
              //   let messageKey = "payout";
              //   let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              //   // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
              //   // //debugger
              //   if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessageWithoutPdf);
              //   }
              // } else {
              // Payout Interest
              creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, interestPayoutRequestReference,
                beneficiaryName,
                beneficiaryAccountNumber,
                beneficiaryAccountName,
                beneficiaryEmail,
                beneficiaryPhoneNumber,
                rfiCode, userId,
                descriptionForInterest);
              debugger
              }
            }

            // NEW CODE END

            // //debugger
            // if successful
            // if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest &&  creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
            if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED" && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
              let amountPaidOut = amount + interestDueOnInvestment;
              // update the investment details
              record.isInvestmentCompleted = true;
              record.investmentCompletionDate = DateTime.now();
              record.status = 'completed';
              record.approvalStatus = approval.approvalStatus;//'payout'
              record.isPayoutAuthorized = true;
              record.isPayoutSuccessful = true;
              record.datePayoutWasDone = DateTime.now();
              record.principalPayoutStatus = "completed";
              record.interestPayoutStatus = "completed";
              // //debugger


              // Save the updated record
              // await record.save();
              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 532 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 535 :", updatedInvestment);

              // console.log("Updated record Status line 537: ", record);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment payout",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                adminMessage: `The sum of ${currencyCode} ${amountPaidOut} for ${firstName} matured investment was paid out.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 551:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 553:", newTimeline);
              // update record

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "payout";
              // let newNotificationMessageWithoutPdf = await 
              sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // // console.log("newNotificationMessage line 1338:", newNotificationMessageWithoutPdf);
              // // //debugger
              // if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessageWithoutPdf);
              // }

              // } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "SUCCESSFUL" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithPrincipal.data.screenStatus === "APPROVED" && creditUserWalletWithInterest && creditUserWalletWithInterest.status !== 200) {
              let amountPaidOut = amount
              // update the investment details
              record.isInvestmentCompleted = true;
              record.investmentCompletionDate = DateTime.now();
              record.status = 'completed_with_interest_payout_outstanding';
              record.principalPayoutStatus = "completed";
              record.approvalStatus = approval.approvalStatus;//'payout'
              record.isPayoutAuthorized = true;
              record.isPayoutSuccessful = true;
              record.datePayoutWasDone = DateTime.now();
              // //debugger
              // Save the updated record
              // await record.save();
              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 1668 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 3490 :", updatedInvestment);

              // console.log("Updated record Status line 537: ", record);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment payout",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the principal for your matured investment has been paid out, please check your account. Thank you.`,
                adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the principal for ${firstName} matured investment was paid out.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 551:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 553:", newTimeline);
              // update record

              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "payout";
              // let newNotificationMessageWithoutPdf = await 
              sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // // console.log("newNotificationMessage line 549:", newNotificationMessageWithoutPdf);
              // // //debugger
              // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessageWithoutPdf);
              // }

              // } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "SUCCESSFUL") {
            } else if (creditUserWalletWithPrincipal && creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest && creditUserWalletWithInterest.status == 200 && creditUserWalletWithInterest.data.screenStatus === "APPROVED") {
              let amountPaidOut = interestDueOnInvestment
              // update the investment details
              record.isInvestmentCompleted = true;
              record.investmentCompletionDate = DateTime.now();
              record.status = 'completed_with_principal_payout_outstanding';
              record.interestPayoutStatus = "completed";
              record.approvalStatus = approval.approvalStatus;//'payout'
              record.isPayoutAuthorized = true;
              record.isPayoutSuccessful = true;
              record.datePayoutWasDone = DateTime.now();
              // //debugger

              // Save the updated record
              // await record.save();
              // update record
              let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              // console.log(" Current log, line 532 :", currentInvestment);
              // send for update
              await investmentsService.updateInvestment(currentInvestment, record);
              // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              // console.log(" Current log, line 1726 :", updatedInvestment);

              // console.log("Updated record Status line 537: ", record);

              // update timeline
              timelineObject = {
                id: uuid(),
                action: "investment payout",
                investmentId: investmentId,//id,
                walletId: walletIdToSearch,// walletId,
                userId: userIdToSearch,// userId,
                // @ts-ignore
                message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut}, the interest for your matured investment has been paid out, please check your account. Thank you.`,
                adminMessage: `The sum of ${currencyCode} ${amountPaidOut}, the interest for ${firstName} matured investment was paid out.`,
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 551:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 553:", newTimeline);
              // update record


              // Send Notification to admin and others stakeholder
              let investment = record;
              let messageKey = "payout";
              // let newNotificationMessageWithoutPdf = await 
              sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
              // // console.log("newNotificationMessage line 1484:", newNotificationMessageWithoutPdf);
              // // //debugger
              // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              //   console.log("Notification sent successfully");
              // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              //   console.log("Notification NOT sent successfully");
              //   console.log(newNotificationMessageWithoutPdf);
              // }

            } else {
              throw Error(`Unable to Payout the investment with ID: ${id}, at this time. Please try again later. Thank you.`);
            }
            // End of New Payout code block
          } else {
            record.status = "active";
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // //debugger
            // console.log(" Current log, line 3607 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, record);
          }

          // } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_payout" && isPayoutSuspended === true && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_payout" && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing suspension: ===========================================>")
          // TODO: Just commented out on frontend request on 23-06-2023
          // newStatus = "payout_suspended";
          // record.status = newStatus;
          // record.requestType = "payout_investment";
          record.isRolloverSuspended = isRolloverSuspended ? isRolloverSuspended : record.isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          record.isPayoutSuspended = isPayoutSuspended ? isPayoutSuspended : record.isPayoutSuspended;
          record.payoutReactivationDate = payoutReactivationDate;
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          record.approvalStatus = approval.approvalStatus;
          debugger
          // Data to send for transfer of fund
          let { firstName, // email,
            totalAmountToPayout, } = record; // interestDueOnInvestment,

          // console.log("Updated record Status line 2227: ", record);
          if (isRolloverSuspended === true) {
            // TODO: Just commented out on frontend request on 23-06-2023
            // newStatus = "rollover_suspended";
            // record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your investment is pending and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }. Thank you.`,
              adminMessage: `The rollover of investment is suspended and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 2243:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 2246:", newTimeline);
            // update record

            // Send Details to notification service
            // let subject = "AstraPay Investment Rollover Pending";
            // let message = `
            //   ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

            //     Thank you.

            //     AstraPay Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 2264:", newNotificationMessage);
            // // //debugger
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
            // }
            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "rollover_pending";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 2276:", newNotificationMessageWithoutPdf);
            // //debugger
            if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            }

          }


          if (isPayoutSuspended === true && isRolloverSuspended === true) {
            // TODO: Just commented out on frontend request on 23-06-2023
            // newStatus = "payout_and_rollover_suspended";
            // record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your investment will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate,"DD-MM-YYYY")}. Thank you.`,
              adminMessage: `The payout of the sum of ${currencyCode} ${totalAmountToPayout} was suspended, it will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate,"DD-MM-YYYY")}.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout_pending";
            // let newNotificationMessageWithoutPdf = await 
            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 2382:", newNotificationMessageWithoutPdf);
            // // //debugger
            // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessageWithoutPdf);
            // }

            // Notification for Rollover
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your investment is pending and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }. Thank you.`,
              adminMessage: `The rollover of investment was suspended and will be process for rollover on or before ${await convertDateToFormat(rolloverReactivationDate, "DD-MM-YYYY") }.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1453:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1456:", newTimeline);
            // update record

            // Send Details to notification service
            // subject = "AstraPay Investment Rollover Pending";
            // message = `
            //   ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

            //     Thank you.

            //     AstraPay Investment.`;
            // newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 2412:", newNotificationMessage);
            // // //debugger
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
            // }
            // Send Notification to admin and others stakeholder
            investment = record;
            messageKey = "rollover_pending";
            // newNotificationMessageWithoutPdf = await 
            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 2424:", newNotificationMessageWithoutPdf);
            // // //debugger
            // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessageWithoutPdf);
            // }

          }

          if (isPayoutSuspended === true) {
            // TODO: Just commented out on frontend request on 23-06-2023
            // newStatus = "payout_suspended";
            // record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId,
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your investment will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate,"DD-MM-YYYY")}. Thank you.`,
              adminMessage: `The payout of the sum of ${currencyCode} ${totalAmountToPayout} was suspended and will be process for payment on or before ${await convertDateToFormat(payoutReactivationDate,"DD-MM-YYYY")}.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Notification to admin and others stakeholder
            let investment = record;
            let messageKey = "payout_pending";
            // let newNotificationMessageWithoutPdf = await 
            sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // // console.log("newNotificationMessage line 2329:", newNotificationMessageWithoutPdf);
            // // //debugger
            // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessageWithoutPdf);
            // }

          }

          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1593 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 3452 :", updatedInvestment);


        } else if (approval.requestType == "liquidate_investment" && approval.approvalStatus == "approved" && record.status == "active" && record.investmentType === "fixed") {
          // newStatus = 'liquidated'
          // record.status = newStatus
          record.approvalStatus = approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          debugger
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 2446 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 2449 :", updatedInvestment);

          await investmentsService.liquidateInvestment(investmentId, request.qs(), loginUserData);
          // debugger
          // console.log("Updated record Status line 2451: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment liquidation",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment has been liquidated, thank you.`,
            adminMessage: `${firstName} investment was liquidated.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 2472:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 2475:", newTimeline);
          debugger
          // Send Details to notification service

          // let subject = "AstraPay Investment Liquidation";
          // let message = `
          //       ${firstName} this is to inform you, that your investment request, has been Liquidated.
          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 2485:", newNotificationMessage);
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }
          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "liquidation";
          // //debugger
          // let newNotificationMessageWithoutPdf = await 
          sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // // console.log("newNotificationMessage line 2496:", newNotificationMessageWithoutPdf);
          // // //debugger
          // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessageWithoutPdf);
          // }

        } else if (approval.requestType == "liquidate_investment" && approval.approvalStatus == "declined" && record.status == "active" && record.investmentType === "fixed") {
          // newStatus = 'active'
          // record.status = newStatus
          record.approvalStatus = approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          // Save the updated record
          // await record.save();
          debugger
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1790 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 1793 :", updatedInvestment);

          // console.log("Updated record Status line 1795: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment liquidation declined",
            investmentId: id,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment liquidation has been declined, please check your account,thank you.`,
            adminMessage: `${firstName} investment liquidation was declined.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1481:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1483:", newTimeline);

          // Send Details to notification service
          // let subject = "AstraPay Investment Termination Rejection";
          // let message = `
          //       ${firstName} this is to inform you, that your investment request, termination approval has been declined.

          //       Please check your account.

          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 2552:", newNotificationMessage);
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }
          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "liquidation_rejection";
          // let newNotificationMessageWithoutPdf = await
           sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // // console.log("newNotificationMessage line 2563:", newNotificationMessageWithoutPdf);
          // // //debugger
          // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessageWithoutPdf);
          // }


        } else if (approval.requestType == "start_investment" && approval.approvalStatus == "approved" && record.status == "active" && record.investmentType === "fixed") {
          // newStatus = 'liquidated'
          // record.status = newStatus
          record.approvalStatus = approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvedBy = approvedBy !== undefined ? approvedBy : "automation";
          record.assignedTo = assignedTo !== undefined ? assignedTo : "automation";
          record.processedBy = processedBy !== undefined ? processedBy : "automation";
          debugger
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 2446 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 2449 :", updatedInvestment);

          await investmentsService.liquidateInvestment(investmentId, request.qs(), loginUserData);
          debugger
          // console.log("Updated record Status line 2451: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment liquidation",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment has been liquidated, thank you.`,
            adminMessage: `${firstName} investment was liquidated.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 2472:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 2475:", newTimeline);
          debugger
          // Send Details to notification service

          // let subject = "AstraPay Investment Liquidation";
          // let message = `
          //       ${firstName} this is to inform you, that your investment request, has been Liquidated.
          //       Thank you.

          //       AstraPay Investment.`;
          // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 2485:", newNotificationMessage);
          // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessage.message !== "Success") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessage);
          // }
          // Send Notification to admin and others stakeholder
          let investment = record;
          let messageKey = "liquidation";
          // //debugger
          // let newNotificationMessageWithoutPdf = await 
          sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
          // // console.log("newNotificationMessage line 2496:", newNotificationMessageWithoutPdf);
          // // //debugger
          // if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          //   console.log("Notification sent successfully");
          // } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          //   console.log("Notification NOT sent successfully");
          //   console.log(newNotificationMessageWithoutPdf);
          // }

        } else {
          console.log("Entering no record for update 3590 ==================================")
          debugger
          return response
            .status(404)
            .json({
              status: "FAILED",
              message: "No approval data match your query parameters or this approval has been processed.",
            });
        }
        // Update Investment data
        // console.log(" Updated record line 3962: ", record.$original);
        debugger
        // send to user
        return response
          .status(200)
          .json({
            status: "OK",
            data: approval//.map((inv) => inv.$original),
          });
      } else {
        console.log("Entering update 3948 ==================================")
        debugger
        return response
          .status(404)
          .json({
            status: "FAILED",
            message: "No approval data match your query parameters",
          });
      }
    } catch (error) {
      console.log("Error line 3965", error.messages);
      console.log("Error line 3966", error.code);
      console.log("Error line 3967", error.message);
      // let { status, message,messages,errorCode,errorMessage} = error;
      let { message, messages, } = error;
      debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          // message: error.messages,
          // hint: error.message
          message: messages,
          hint: message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          // message: error.messages,
          // hint: error.message
          message: messages,
          hint: message
        });
      }
      return response.status(500).json({
        status: "FAILED",
        // message: error.messages,
        // hint: error.message
        message: messages,
        hint: message
      });
    }
  }

  public async destroy({ request, response }: HttpContextContract) {
    try {
      const { walletId, investmentId, approvalId } = request.qs();
      console.log("approval query: ", request.qs());

      let approval = await Approval.query().where({
        investment_id: investmentId,
        wallet_id: walletId,
        id: approvalId,
      });
      console.log(" QUERY RESULT: ", approval);

      if (approval.length > 0) {
        approval = await Approval.query()
          .where({ investment_id: investmentId, wallet_id: walletId, id: approvalId })
          .delete();
        console.log("Deleted data:", approval);
        return response
          .status(200)
          .json({ status: "OK", message: "Approval Request Deleted." });
      } else {
        return response
          .status(404)
          .json({ status: "FAILED", message: "Invalid parameters" });
      }
    } catch (error) {
      console.log(error);
      // console.error(error.messages);
      // return response.status(404).json({
      //   status: "FAILED",
      //   message: error.messages.errors,
      // });
      console.log("Error line 4076", error.messages);
      console.log("Error line 4077", error.message);
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      }
      return response.status(500).json({
        status: "FAILED",
        message: error.messages,
        hint: error.message
      });

    }
  }
}


