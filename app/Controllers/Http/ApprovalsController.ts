import { debitUserWallet } from 'App/Helpers/debitUserWallet';
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Approval from "App/Models/Approval";
import Event from "@ioc:Adonis/Core/Event";
import { sendNotification } from "App/Helpers/sendNotification";
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
      console.log("approval line 40 ===================");
      console.log(approval);
      if (limit) {
        sortedApprovals = sortedApprovals.slice(0, Number(limit));
      }
      if (sortedApprovals.length < 1) {
        return response.status(200).json({
          status: "FAILED",
          message: "no approval request matched your search",
          data: [],
        });
      }

      for (let index = 0; index < sortedApprovals.length; index++) {
        const approval = sortedApprovals[index];
        console.log("approval line 59 ===================");
        console.log(approval);

        console.log("approval line 62 ===================");
        console.log(approval.$original.investmentId);
        let investment;
        if (approval.$original.investmentId) {
          investment = await investmentsService.getInvestmentByInvestmentId(approval.$original.investmentId);
        }
        console.log("investment line 75 ===================");
        console.log(investment);
        // if ((investment == null || investment == undefined) && (linkAccount == null || linkAccount == undefined)) return response.json({ status: "FAILED", data: [] });
        if (investment) {
          let approvalWithInvestmentDetails = {
            ...approval.$original,
            investmentDetails: investment.$original,
          };
          console.log("approvalWithInvestmentDetails line 218 ===================");
          console.log(approvalWithInvestmentDetails);
          approvalArray.push(approvalWithInvestmentDetails);
        }
        // approvalArray.push(approval);
        // console.log("approvalArray line 125 ===================");
        // console.log(approvalArray);
      }

      return response.status(200).json({
        status: "OK",
        data: approvalArray,
        // data: sortedApprovals.map((approval) => approval.$original),
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
      const { walletId, investmentId, userId, requestType, approvalStatus, assignedTo, processedBy,// remark,
      } = request.body();
      const payload: ApprovalType = {
        walletId: walletId,
        investmentId: investmentId,
        userId: userId,
        requestType: requestType,
        approvalStatus: approvalStatus,
        assignedTo: assignedTo,
        processedBy: processedBy,
        // remark: remark,
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

        console.log("Existing Approval Request details: ", requestIsExisting);
        if (!requestIsExisting) {
          approval = await approvalsService.createApproval(payload);
          // approval = await Approval.create(payload);
          // @ts-ignore
          // approval.status = 'active'
          // await approval.save();
          console.log("The new approval request:", approval);
          console.log("A New approval request has been Created.");
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
          //       console.log("updated Remark object line 245:", updatedRemark);

          //     } else {
          //       // if it does not have create new remark
          //       let newRemark = await remarksService.createRemark(remarksObject);
          //       console.log("new Remark object line 250:", newRemark);

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
      console.log("Entering update 408 ==================================")
      // const investmentlogsService = new InvestmentLogsServices();
      const investmentsService = new InvestmentsServices();
      await request.validate(UpdateApprovalValidator);
      const approvalsService = new ApprovalsServices()
      const { id, } = request.params();
      // console.log("Approval query: ", request.qs());
      const { approvalStatus, assignedTo, processedBy, isRolloverSuspended,
        rolloverReactivationDate, isPayoutSuspended, payoutReactivationDate, } = request.body();
      // remark
      // check if the request is not existing
      let approval;
      let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
      // console.log("Existing Approval Request details: ", approvalRequestIsExisting);
      if (!approvalRequestIsExisting) {
        //    return error message to user
        // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
        throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
      }
      console.log(" Login User Data line 426 =========================");
      console.log(loginUserData);
      // TODO: Uncomment to use LoginUserData
      // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
      // console.log(" Login User Data line 435 =========================");
      // console.log(loginUserData);
      // console.log(" Login User Roles line 437 =========================");
      // console.log(loginUserData.roles);
      // let { roles, biodata } = loginUserData;

      // console.log("Admin roles , line 441 ==================")
      // console.log(roles)
      // // @ts-ignore
      // let { fullName } = biodata;
      // let loginAdminFullName = fullName;
      // console.log("Login Admin FullName, line 446 ==================")
      // console.log(loginAdminFullName)

      const timelineService = new TimelinesServices();
      // const { investmentId, walletId, userId } = request.qs();
      approval = approvalRequestIsExisting //await approvalsService.getApprovalByApprovalId(id);

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
        // debugger
      }
      // console.log(" idToSearch RESULT ===============================: ", idToSearch);
      // let record = await investmentsService.getInvestmentByInvestmentId(approval.investmentId);
      // console.log(" record RESULT ===============================: ", record);
      console.log("check approval record 339 ==================================")
      // debugger
      if (!approval || record == undefined || !record) {
        return response
          .status(404)
          .json({ status: "FAILED", message: "Not Found,try again." });
      }
      // console.log(" QUERY RESULT for record: ", record.$original);
      // debugger
      if (approval) {
        console.log("Investment approval Selected for Update line 477:");

        let payload: ApprovalType = {
          walletId: approval.walletId,
          investmentId: approval.investmentId,
          userId: approval.userId,
          requestType: approval.requestType,
          approvalStatus: approvalStatus,
          assignedTo: assignedTo,
          processedBy: processedBy,
          // remark: approval.remark,

        }
        // update the data
        // TODO: Uncomment to use loginAdminFullName
        // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
        // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
        // payload.remark = remark !== undefined ? remark : approval.remark;
        // console.log("Admin remark line 367 ==================== ", approval.remark);
        // console.log("Admin remark line 368 ========*******************=========== ", remark);
        approval = await approvalsService.updateApproval(approval, payload);
        // console.log("Approval updated: ", approval);
        let newStatus;
        // await approval.save();
        // console.log("Update Approval Request line 373:", approval);
        let { id, firstName, currencyCode, lastName, email } = record;
        console.log("Surname: ", lastName)

        // console.log("CurrencyCode: ", currencyCode)
        // debugger
        // let { email } = contactDetails;
        // let email = email;
        let timelineObject;
        // console.log("Approval.requestType: ===========================================>", approval.requestType)
        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
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
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";
          record.approvalStatus = approval.approvalStatus; // "investment_approved"//approval.approvalStatus;

          // Save the updated record
          // await record.save();
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 696 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 535 =========:", updatedInvestment);


          // console.log("Updated record Status line 537: ", record);
          // Data to send for transfer of fund
          let { amount, lng, lat, investmentRequestReference,
            firstName, lastName,
            walletId,
            phone,
            email,
            rfiCode } = record;
          let senderName = `${firstName} ${lastName}`;
          let senderAccountNumber = walletId;
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
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 551:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 553:", newTimeline);
          // update record

          // Send Details to notification service
          let subject = "AstraPay Investment Approval";
          let message = `
                ${firstName} this is to inform you, that your Investment request, has been approved.

                Please wait while the investment is being activated. 

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 567:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
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
          // Send to the endpoint for debit of wallet
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
            console.log("newNotificationMessage line 633:", newNotificationMessage);
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
            // debugger
          } else if (debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
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
              message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again. Thank you.`,
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
            let subject = "AstraPay Investment Activation Failed";
            let message = `
                ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 569:", newNotificationMessage);
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }

            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            // console.log(" Current log, line 535 =========:", updatedInvestment);
            // console.log("debitUserWalletForInvestment reponse data 579 ==================================", debitUserWalletForInvestment)
            // debugger
            // throw Error(debitUserWalletForInvestment);
            return response
              .status(504)
              .json({
                status: "FAILED",//debitUserWalletForInvestment.status,
                message: `${debitUserWalletForInvestment.status}, ${debitUserWalletForInvestment.errorCode}`,
              });
          }
        } else if (approval.requestType == "start_investment" && approval.approvalStatus == "rejected" && record.status === "initiated") { // && record.status == "submitted"
          newStatus = "investment_rejected";
          record.status = newStatus;
          record.approvalStatus = approval.approvalStatus;// "investment_declined"; //approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
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
            action: "investment request rejection",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment request has been rejected. Please try again, thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 605:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 607:", newTimeline);

          // Send Details to notification service
          let subject = "AstraPay Investment Rejection";
          let message = `
                ${firstName} this is to inform you, that your investment request, has been rejected.

                Please check your device, and try again later.

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 620:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }

        } else if (approval.requestType === "start_investment_rollover" && record.status === "initiated") {
          // get the request by request id
          // update status based on admin action

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
            //     rfiCode)
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
            // console.log("Timeline object line 696:", timelineObject);
            await timelineService.createTimeline(timelineObject);

            // Send Details to notification service
            let subject = "AstraPay Investment Rollover Approval";
            let message = `
                ${firstName} this is to inform you, that your Investment rollover request, has been approved.

                Please wait while the investment is being activated. 

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 710:", newNotificationMessage);
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }

            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 720 :", currentInvestment);
            // send for update
            let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            // console.log(" Current log, line 723 :", updatedInvestment);
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
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 738 :", currentInvestment);
            // send for update
            updatedInvestment = await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);
            console.log(" Current log, line 741 :", updatedInvestment);

            // console.log("Updated record Status line 743: ", record);
            timelineObject = {
              id: uuid(),
              investmentId: investmentId,
              userId: userId,
              walletId: walletId,
              action: 'investment rollover activated',
              // @ts-ignore
              message: `${firstName} investment rollover has just been activated.`,
              createdAt: selectedInvestmentRequestUpdate.startDate,
              metadata: `duration: ${selectedInvestmentRequestUpdate.duration}, payout date : ${selectedInvestmentRequestUpdate.payoutDate}`,
            }
            // console.log('Timeline object line 755:', timelineObject)
            await timelineService.createTimeline(timelineObject);
            // Send Details to notification service
            subject = "AstraPay Investment Rollover Activation";
            message = `
                ${firstName} this is to inform you, that the rollover of your Investment of ${currencyCode} ${amount} for the period of ${selectedInvestmentRequestUpdate.duration} days, has been activated on ${selectedInvestmentRequestUpdate.startDate} and it will be mature for payout on ${selectedInvestmentRequestUpdate.payoutDate}.

                Please check your device. 

                Thank you.

                AstraPay Investment.`;
            newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 768:", newNotificationMessage);
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }

            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 777 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, selectedInvestmentRequestUpdate);

          } else if (approval.approvalStatus === "rejected") {
            // update the neccesary field
            // console.log("record ========================================================")
            // console.log(record)
            let selectedInvestmentRequestUpdate = record;
            selectedInvestmentRequestUpdate.approvalStatus = "rejected" //approval.approvalStatus;
            selectedInvestmentRequestUpdate.status = "investment_rollover_rejected";
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
            // console.log("Timeline object line 296:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 299:", newTimeline);
            // update record
            // debugger
            // Send Details to notification service
            let subject = "AstraPay Investment Activation Failed";
            let message = `
                ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${walletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${amount} as we try again.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 565:", newNotificationMessage);
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
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
            if (creditUserWalletWithPrincipal.status == 200) {
              let amountPaidOut = amount;
              let decPl = 2;
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
              let decPl = 2;
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
                createdAt: DateTime.now(),
                metadata: ``,
              };
              // console.log("Timeline object line 537:", timelineObject);
              await timelineService.createTimeline(timelineObject);
              // let newTimeline = await timelineService.createTimeline(timelineObject);
              // console.log("new Timeline object line 540:", newTimeline);
              // update record

              // Send Details to notification service
              let subject = "AstraPay Investment Rollover and Payout Failed";
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
            // console.log("creditUserWalletForInvestment reponse data 321 ==================================", debitUserWalletForInvestment)
            // debugger
            // throw Error(creditUserWalletForInvestment);
            // throw Error(`${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`);
            // return {
            //         status: "FAILED",//creditUserWalletForInvestment.status,
            //         message: `${creditUserWalletForInvestment.status}, ${creditUserWalletForInvestment.errorCode}`,
            //     };

          }
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment request approval updated",
            investmentId: record.id,
            userId: record.userId,
            walletId: record.walletId,
            // @ts-ignore
            message: `${record.firstName} investment request approval record has just been updated.`,
            createdAt: DateTime.now(),
            metadata: `request type : ${record.requestType}`,
          };
          // console.log("Timeline object line 1028:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1031:", newTimeline);
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "approved" && record.status === "matured") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing: ===========================================>")
          // newStatus = "submitted";
          newStatus = "approved"; //'pending_account_number_generation'; 
          record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation";
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation";
          record.approvalStatus = approval.approvalStatus;
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
          let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
            beneficiaryName,
            beneficiaryAccountNumber,
            beneficiaryAccountName,
            beneficiaryEmail,
            beneficiaryPhoneNumber,
            rfiCode,
            descriptionForPrincipal)
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
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // debugger


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
          } else if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithInterest.status !== 200) {
            let amountPaidOut = amount
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            record.status = 'completed_with_interest_payout_outstanding';
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // debugger
            // Save the updated record
            // await record.save();
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            // console.log(" Current log, line 532 :", currentInvestment);
            // send for update
            let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            console.log(" Current log, line 535 :", updatedInvestment);

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
            console.log("newNotificationMessage line 567:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          } else if (creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest.status == 200) {
            let amountPaidOut = interestDueOnInvestment
            // update the investment details
            record.isInvestmentCompleted = true;
            record.investmentCompletionDate = DateTime.now();
            record.status = 'completed_with_principal_payout_outstanding';
            record.approvalStatus = approval.approvalStatus;//'payout'
            record.isPayoutAuthorized = true;
            record.isPayoutSuccessful = true;
            record.datePayoutWasDone = DateTime.now();
            // debugger


            // Save the updated record
            // await record.save();
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
            // console.log(" Current log, line 532 :", currentInvestment);
            // send for update
            let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
            console.log(" Current log, line 535 :", updatedInvestment);

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
            console.log("newNotificationMessage line 567:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          } else {
            throw Error();
          }
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_rollover" && isRolloverSuspended === false && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment rollover processing: ===========================================>")
          // newStatus = "submitted";
          // newStatus = "rollover"; //'pending_account_number_generation'; 
          // record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = approval.approvalStatus; //"rollover"//approval.approvalStatus;
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
            status
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
          if ((isRolloverActivated == true && rolloverType !== "100" && status === "matured")) { // || (isRolloverActivated == true && rolloverType !== "100" && status === "matured")
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
                record.approvalStatus = approval.approvalStatus;//'payout'
                record.isPayoutAuthorized = true;
                record.isPayoutSuccessful = true;
                record.datePayoutWasDone = DateTime.now();
                // debugger

                // Save the updated record
                // await record.save();
                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
                // console.log(" Current log, line 1031 :", currentInvestment);
                // send for update
                let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
                console.log(" Current log, line 1034 :", updatedInvestment);

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
                  createdAt: DateTime.now(),
                  metadata: ``,
                };
                // console.log("Timeline object line 996:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 559993:", newTimeline);
                // update record

                // Send Details to notification service
                let subject = "AstraPay Investment Payout";
                let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

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
              }
              let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, amount)
              console.log("newInvestmentDetails ", newInvestmentDetails)
              // debugger
            } else if (rolloverType == "102") {
              //   '102' = 'rollover principal with interest',
              // create newInvestment


              // let creditUserWalletWithPrincipal = await creditUserWallet(amount, lng, lat, id,
              //   beneficiaryName,
              //   beneficiaryAccountNumber,
              //   beneficiaryAccountName,
              //   beneficiaryEmail,
              //   beneficiaryPhoneNumber,
              //   rfiCode,
              //   descriptionForPrincipal)
              // let creditUserWalletWithInterest = await creditUserWallet(interestDueOnInvestment, lng, lat, id,
              //   beneficiaryName,
              //   beneficiaryAccountNumber,
              //   beneficiaryAccountName,
              //   beneficiaryEmail,
              //   beneficiaryPhoneNumber,
              //   rfiCode,
              //   descriptionForInterest)
              // debugger
              // // if successful 
              // if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithInterest.status == 200) {
              //   let amountPaidOut = amount + interestDueOnInvestment;
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed';
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   debugger


              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 532 :", currentInvestment);
              //   // send for update
              //   let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   console.log(" Current log, line 535 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId, 
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record

              //   // Send Details to notification service
              //   let subject = "AstraPay Investment Payout";
              //   let message = `
              //   ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

              //   Please check your account. 

              //   Thank you.

              //   AstraPay Investment.`;
              //   let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              //   console.log("newNotificationMessage line 567:", newNotificationMessage);
              //   debugger
              //   if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessage.message !== "Success") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessage);
              //   }
              // } else if (creditUserWalletWithPrincipal.status == 200 && creditUserWalletWithInterest.status !== 200) {
              //   let amountPaidOut = amount
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_interest_payout_outstanding';
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   debugger
              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 532 :", currentInvestment);
              //   // send for update
              //   let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   console.log(" Current log, line 535 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId, 
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record

              //   // Send Details to notification service
              //   let subject = "AstraPay Investment Payout";
              //   let message = `
              //   ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

              //   Please check your account. 

              //   Thank you.

              //   AstraPay Investment.`;
              //   let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              //   console.log("newNotificationMessage line 567:", newNotificationMessage);
              //   debugger
              //   if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessage.message !== "Success") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessage);
              //   }
              // } else if (creditUserWalletWithPrincipal.status !== 200 && creditUserWalletWithInterest.status == 200) {
              //   let amountPaidOut = interestDueOnInvestment
              //   // update the investment details
              //   record.isInvestmentCompleted = true;
              //   record.investmentCompletionDate = DateTime.now();
              //   record.status = 'completed_with_principal_payout_outstanding';
              //   record.approvalStatus = approval.approvalStatus;//'payout'
              //   record.isPayoutAuthorized = true;
              //   record.isPayoutSuccessful = true;
              //   record.datePayoutWasDone = DateTime.now();
              //   debugger


              //   // Save the updated record
              //   // await record.save();
              //   // update record
              //   let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
              //   // console.log(" Current log, line 532 :", currentInvestment);
              //   // send for update
              //   let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
              //   console.log(" Current log, line 535 :", updatedInvestment);

              //   // console.log("Updated record Status line 537: ", record);

              //   // update timeline
              //   timelineObject = {
              //     id: uuid(),
              //     action: "investment payout",
              //     investmentId: investmentId,//id,
              //     walletId: walletIdToSearch,// walletId, 
              //     userId: userIdToSearch,// userId,
              //     // @ts-ignore
              //     message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
              //     createdAt: DateTime.now(),
              //     metadata: ``,
              //   };
              //   // console.log("Timeline object line 551:", timelineObject);
              //   await timelineService.createTimeline(timelineObject);
              //   // let newTimeline = await timelineService.createTimeline(timelineObject);
              //   // console.log("new Timeline object line 553:", newTimeline);
              //   // update record

              //   // Send Details to notification service
              //   let subject = "AstraPay Investment Payout";
              //   let message = `
              //   ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

              //   Please check your account. 

              //   Thank you.

              //   AstraPay Investment.`;
              //   let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              //   console.log("newNotificationMessage line 567:", newNotificationMessage);
              //   debugger
              //   if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              //     console.log("Notification sent successfully");
              //   } else if (newNotificationMessage.message !== "Success") {
              //     console.log("Notification NOT sent successfully");
              //     console.log(newNotificationMessage);
              //   }
              // }

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
              // console.log("new Timeline object line 559993:", newTimeline);
              // update record

              // Send Details to notification service
              let subject = "AstraPay Investment Rollover";
              let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${totalAmountToPayout} for your matured Investment, has been rollover.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
              let newNotificationMessage = await sendNotification(email, subject, firstName, message);
              console.log("newNotificationMessage line 1291:", newNotificationMessage);
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
                principalPayoutStatus: "pending",
                interestPayoutStatus: "pending",
              }
              let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
              console.log("newInvestmentDetails ", newInvestmentDetails)
              // debugger
            } else if (rolloverType == "103") {
              //   '101' = 'rollover principal only',
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
                record.approvalStatus = approval.approvalStatus;//'payout'
                record.isPayoutAuthorized = true;
                record.isPayoutSuccessful = true;
                record.datePayoutWasDone = DateTime.now();
                // debugger

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
                  message: `${firstName}, the sum of ${currencyCode} ${amountPaidOut} for your matured investment has been paid out, please check your account. Thank you.`,
                  createdAt: DateTime.now(),
                  metadata: ``,
                };
                // console.log("Timeline object line 1448:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 1451:", newTimeline);
                // update record

                // Send Details to notification service
                let subject = "AstraPay Investment Payout";
                let message = `
                ${firstName} this is to inform you, that the sum of ${currencyCode} ${amountPaidOut} for your matured Investment, has been paid.

                Please check your account. 

                Thank you.

                AstraPay Investment.`;
                let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                console.log("newNotificationMessage line 1465:", newNotificationMessage);
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
                principalPayoutStatus: "pending",
                interestPayoutStatus: "pending",
              }
              let newInvestmentDetails = await investmentsService.createNewInvestment(newInvestmentPayload, interestDueOnInvestment)
              console.log("newInvestmentDetails ", newInvestmentDetails)
              // debugger
            }
          }

        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_rollover" && isRolloverSuspended === true && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment rollover processing: ===========================================>")
          // newStatus = "submitted";
          // newStatus = "rollover"; //'pending_account_number_generation'; 
          // record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = approval.approvalStatus; //"rollover"//approval.approvalStatus;
          record.isRolloverSuspended = isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          newStatus = "rollover_suspended";
          record.status = newStatus;
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment rollover pending",
            investmentId: investmentId,//id,
            walletId: walletIdToSearch,// walletId, 
            userId: userIdToSearch,// userId,
            // @ts-ignore
            message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1453:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1456:", newTimeline);
          // update record

          // Send Details to notification service
          let subject = "AstraPay Investment Rollover Pending";
          let message = `
              ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          // console.log("newNotificationMessage line 1468:", newNotificationMessage);
          // debugger
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1455 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 1459 :", updatedInvestment);

        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "activate_payout" && isPayoutSuspended === false && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing suspension: ===========================================>")
          newStatus = "matured";
          // newStatus = "payout_suspended"; //'pending_account_number_generation'; 
          record.status = newStatus;
          record.requestType = "payout_investment";
          record.isRolloverSuspended = isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          record.isPayoutSuspended = isPayoutSuspended;
          record.payoutReactivationDate = payoutReactivationDate;
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = "approved"; //approval.approvalStatus;
          // Data to send for transfer of fund
          let { firstName, email, totalAmountToPayout, } = record; // interestDueOnInvestment,

          // console.log("Updated record Status line 1439: ", record);
          if (isRolloverSuspended === true) {
            newStatus = "rollover_suspended";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1453:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1456:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Rollover Pending";
            let message = `
              ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1468:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          } else if (isRolloverSuspended === false) {
            newStatus = "matured";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover activated",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your matured investment is activated and will be process for rollover. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1959:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1962:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Rollover Activated";
            let message = `
              ${firstName} the rollover of your matured investment is activated and will be process for rollover.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1468:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          }

          if (isPayoutSuspended === true) {
            newStatus = "payout_suspended";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Payout Pending";
            let message = `
               ${firstName},this is to inform you that the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1506:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          } else if (isPayoutSuspended === false) {
            newStatus = "matured";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout activation",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment has been activated for payment processing. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Payout Activation";
            let message = `
               ${firstName},this is to inform you that the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment has been activated for payment processing.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1506:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          }

          // if (isPayoutSuspended === true && isRolloverSuspended === true) {
          //   newStatus = "payout_and_rollover_suspended";
          //   record.status = newStatus;
          //   // update timeline
          //   timelineObject = {
          //     id: uuid(),
          //     action: "investment payout pending",
          //     investmentId: investmentId,//id,
          //     walletId: walletIdToSearch,// walletId, 
          //     userId: userIdToSearch,// userId,
          //     // @ts-ignore
          //     message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}. Thank you.`,
          //     createdAt: DateTime.now(),
          //     metadata: ``,
          //   };
          //   // console.log("Timeline object line 1491:", timelineObject);
          //   await timelineService.createTimeline(timelineObject);
          //   // let newTimeline = await timelineService.createTimeline(timelineObject);
          //   // console.log("new Timeline object line 1494:", newTimeline);
          //   // update record

          //   // Send Details to notification service
          //   let subject = "AstraPay Investment Payout Pending";
          //   let message = `
          //      ${firstName},this is to inform you that the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}.

          //       Thank you.

          //       AstraPay Investment.`;
          //   let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          //   // console.log("newNotificationMessage line 1506:", newNotificationMessage);
          //   // debugger
          //   if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //     console.log("Notification sent successfully");
          //   } else if (newNotificationMessage.message !== "Success") {
          //     console.log("Notification NOT sent successfully");
          //     console.log(newNotificationMessage);
          //   }

          //   // Notification for Rollover
          //   // update timeline
          //   timelineObject = {
          //     id: uuid(),
          //     action: "investment rollover pending",
          //     investmentId: investmentId,//id,
          //     walletId: walletIdToSearch,// walletId, 
          //     userId: userIdToSearch,// userId,
          //     // @ts-ignore
          //     message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
          //     createdAt: DateTime.now(),
          //     metadata: ``,
          //   };
          //   // console.log("Timeline object line 1453:", timelineObject);
          //   await timelineService.createTimeline(timelineObject);
          //   // let newTimeline = await timelineService.createTimeline(timelineObject);
          //   // console.log("new Timeline object line 1456:", newTimeline);
          //   // update record

          //   // Send Details to notification service
          //   subject = "AstraPay Investment Rollover Pending";
          //   message = `
          //     ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

          //       Thank you.

          //       AstraPay Investment.`;
          //   newNotificationMessage = await sendNotification(email, subject, firstName, message);
          //   // console.log("newNotificationMessage line 1468:", newNotificationMessage);
          //   // debugger
          //   if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
          //     console.log("Notification sent successfully");
          //   } else if (newNotificationMessage.message !== "Success") {
          //     console.log("Notification NOT sent successfully");
          //     console.log(newNotificationMessage);
          //   }

          // }
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1593 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 1597 :", updatedInvestment);

        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "suspend_payout" && isPayoutSuspended === true && record.status !== "completed" && record.status !== "initiated") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing suspension: ===========================================>")
          // newStatus = "submitted";
          // newStatus = "payout_suspended"; //'pending_account_number_generation'; 
          // record.status = newStatus;
          record.requestType = "payout_investment";
          record.isRolloverSuspended = isRolloverSuspended;
          record.rolloverReactivationDate = rolloverReactivationDate;
          record.isPayoutSuspended = isPayoutSuspended;
          record.payoutReactivationDate = payoutReactivationDate;
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = approval.approvalStatus;
          // Data to send for transfer of fund
          let { firstName, email, totalAmountToPayout, } = record; // interestDueOnInvestment,

          // console.log("Updated record Status line 1439: ", record);
          if (isRolloverSuspended === true) {
            newStatus = "rollover_suspended";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1453:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1456:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Rollover Pending";
            let message = `
              ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1468:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          }

          if (isPayoutSuspended === true) {
            newStatus = "payout_suspended";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Payout Pending";
            let message = `
               ${firstName},this is to inform you that the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1506:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          }

          if (isPayoutSuspended === true && isRolloverSuspended === true) {
            newStatus = "payout_and_rollover_suspended";
            record.status = newStatus;
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment payout pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName}, the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1491:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1494:", newTimeline);
            // update record

            // Send Details to notification service
            let subject = "AstraPay Investment Payout Pending";
            let message = `
               ${firstName},this is to inform you that the sum of ${currencyCode} ${totalAmountToPayout} for your matured investment will be process for payment on or before ${payoutReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1506:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }

            // Notification for Rollover
            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment rollover pending",
              investmentId: investmentId,//id,
              walletId: walletIdToSearch,// walletId, 
              userId: userIdToSearch,// userId,
              // @ts-ignore
              message: `${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}. Thank you.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1453:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1456:", newTimeline);
            // update record

            // Send Details to notification service
            subject = "AstraPay Investment Rollover Pending";
            message = `
              ${firstName} the rollover of your matured investment is pending and will be process for rollover on or before ${rolloverReactivationDate}.

                Thank you.

                AstraPay Investment.`;
            newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // console.log("newNotificationMessage line 1468:", newNotificationMessage);
            // debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }

          }
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1593 :", currentInvestment);
          // send for update
          await investmentsService.updateInvestment(currentInvestment, record);
          // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          // console.log(" Current log, line 1597 :", updatedInvestment);

        } else if (approval.requestType == "terminate_investment" && approval.approvalStatus == "approved" && record.status == "active" && record.investmentType === "fixed") {
          newStatus = 'terminated'
          record.status = newStatus
          record.approvalStatus = approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1346 :", currentInvestment);
          // send for update
          let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          console.log(" Current log, line 1349 :", updatedInvestment);

          // console.log("Updated record Status line 1351: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment liquidation",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment has been liquidated, thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1727:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1729:", newTimeline);

          // Send Details to notification service

          let subject = "AstraPay Investment Liquidation";
          let message = `
                ${firstName} this is to inform you, that your investment request, has been Liquidated.
                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 1738:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }
        } else if (approval.requestType == "terminate_investment" && approval.approvalStatus == "rejected" && record.status == "active" && record.investmentType === "fixed") {
          // newStatus = 'active'
          // record.status = newStatus
          record.approvalStatus = approval.approvalStatus;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          // record.remark = approval.remark;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          // Save the updated record
          // await record.save();
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 1790 :", currentInvestment);
          // send for update
          let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          console.log(" Current log, line 1793 :", updatedInvestment);

          // console.log("Updated record Status line 1795: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment termination rejected",
            investmentId: id,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment termination has been rejected, please check your account,thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1481:", timelineObject);
          await timelineService.createTimeline(timelineObject);
          // let newTimeline = await timelineService.createTimeline(timelineObject);
          // console.log("new Timeline object line 1483:", newTimeline);

          // Send Details to notification service
          let subject = "AstraPay Investment Termination Rejection";
          let message = `
                ${firstName} this is to inform you, that your investment request, termination approval has been rejected.

                Please check your account.

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 1791:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }

        } else {
          console.log("Entering no record for update 1730 ==================================")
          return response
            .status(404)
            .json({
              status: "FAILED",
              message: "No approval data match your query parameters",
            });
        }
        // Update Investment data
        // console.log(" Updated record line 733: ", record.$original);
        // send to user
        return response
          .status(200)
          .json({
            status: "OK",
            data: approval//.map((inv) => inv.$original),
          });
      } else {
        console.log("Entering update 1748 ==================================")
        debugger
        return response
          .status(404)
          .json({
            status: "FAILED",
            message: "No approval data match your query parameters",
          });
      }
    } catch (error) {
      console.log("Error line 1750", error.messages);
      console.log("Error line 1751", error.code);
      console.log("Error line 1752", error.message);
      // let { status, message,messages,errorCode,errorMessage} = error;
      let { message, messages, } = error;
      // debugger
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
      console.log("Error line 1796", error.messages);
      console.log("Error line 1797", error.message);
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


