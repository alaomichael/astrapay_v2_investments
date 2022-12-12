import { debitUserWallet } from 'App/Helpers/debitUserWallet';
// import Investment from 'App/Models/Investment'
// import { schema, rules } from '@ioc:Adonis/Core/Validator'
// import {
//   investmentDuration,
//   // @ts-ignore
// } from 'App/Helpers/utils'

// public async update({ request, response }: HttpContextContract) {
//   try {
//     const { investmentId, userId } = request.qs()
//     console.log('Approval query: ', request.qs())

//     let approval = await Approval.query().where({
//       investment_id: investmentId,
//       user_id: userId,
//     })
//     console.log(' QUERY RESULT: ', approval)
//     let investment = await Investment.query().where({
//       id: investmentId,
//       user_id: userId,
//     })
//     if (approval.length < 1 || investment === undefined) {
//       return response.status(404).json({ status: 'FAILED', message: 'Not Found,try again.' })
//     }
//     console.log(' QUERY RESULT for investment: ', investment[0].$original)

//     if (approval.length > 0) {
//       console.log('Investment approval Selected for Update line 160:', approval)
//       if (approval) {
//         approval[0].approvalStatus = request.input('approvalStatus')
//           ? request.input('approvalStatus')
//           : approval[0].approvalStatus
//         approval[0].remark = request.input('remark')
//           ? request.input('remark')
//           : approval[0].remark
//         if (approval) {
//           let newStatus
//           await approval[0].save()
//           console.log('Update Approval Request line 171:', approval)
//           if (
//             approval[0].requestType === 'start_investment' &&
//             approval[0].approvalStatus === 'approved'
//           ) {
//             newStatus = 'initiated'
//             investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             // Save the updated investment
//             await investment[0].save()
//           } else if (
//             approval[0].requestType === 'terminate investment' &&
//             approval[0].approvalStatus === 'approved'
//           ) {
//             // newStatus = 'terminated'
//             // investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             investment[0].isPayoutAuthorized = true
//             investment[0].isTerminationAuthorized = true
//             // Calculate the Total Amount to payout by pro-rata
//             let startDate = investment[0].startDate
//             let currentDate = new Date().toISOString()
//             let daysOfInvestment = await investmentDuration(startDate, currentDate)
//             let expectedDuration = investment[0].duration
//             let expectedInterestOnMaturity = investment[0].interestDueOnInvestment
//             let amountInvested = investment[0].amount
//             if (parseInt(expectedDuration) > daysOfInvestment) {
//               // Pro-rata the Interest Due on Investment
//               let interestDuePerDay = expectedInterestOnMaturity / parseInt(expectedDuration)
//               let newInterestDueToTermination = daysOfInvestment * interestDuePerDay
//               let formerTotalAmountToPayout = investment[0].totalAmountToPayout
//               console.log(
//                 'Former Total Amount Due for payout if Matured is, line 203: ',
//                 formerTotalAmountToPayout
//               )
//               investment[0].totalAmountToPayout = amountInvested + newInterestDueToTermination
//               // Save the updated investment
//               await investment[0].save()
//               let newTotalAmountToPayout = investment[0].totalAmountToPayout
//               console.log(
//                 'Total Amount Due for payout due to Termination, line 211: ',
//                 newTotalAmountToPayout
//               )
//             }
//           } else if (
//             approval[0].requestType === 'payout_investment' &&
//             approval[0].approvalStatus === 'approved'
//           ) {
//             // newStatus = 'payout'
//             // investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             investment[0].isPayoutAuthorized = true
//             investment[0].isTerminationAuthorized = true
//             // Save the updated investment
//             await investment[0].save()
//           } else if (
//             approval[0].requestType === 'start_investment' &&
//             approval[0].approvalStatus === 'declined'
//           ) {
//             newStatus = 'initiated'
//             investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             // Save the updated investment
//             await investment[0].save()
//           } else if (
//             approval[0].requestType === 'terminate investment' &&
//             approval[0].approvalStatus === 'declined'
//           ) {
//             // newStatus = 'active'
//             // investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             investment[0].isPayoutAuthorized = false
//             investment[0].isTerminationAuthorized = false
//             // Save the updated investment
//             await investment[0].save()
//           } else if (
//             approval[0].requestType === 'payout_investment' &&
//             approval[0].approvalStatus === 'declined'
//           ) {
//             // newStatus = 'active'
//             // investment[0].status = newStatus
//             investment[0].approvalStatus = approval[0].approvalStatus
//             investment[0].isPayoutAuthorized = false
//             investment[0].isTerminationAuthorized = false
//             // Save the updated investment
//             await investment[0].save()
//           }
//           // Update Investment data
//           console.log(' Updated investment line 259: ', investment[0].$original)
//           // send to user
//           return response
//             .status(200)
//             .json({ status: 'OK', data: approval.map((inv) => inv.$original) })
//         }
//         return // 422
//       } else {
//         return response.status(304).json({ status: 'FAILED', data: approval })
//       }
//     } else {
//       return response
//         .status(404)
//         .json({ status: 'FAILED', message: 'No data match your query parameters' })
//     }
//   } catch (error) {
//     console.error(error)
//   }
//   // return // 401
// }

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
      console.log("Error line 135", error.messages);
      console.log("Error line 136", error.message);
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
      return response.status(404).json({
        status: "FAILED",
        message: "your approval request was not successful, please try again.",
      });
    }
  }

  public async update({ request, response, loginUserData }: HttpContextContract) {
    try {
      // const investmentlogsService = new InvestmentLogsServices();
      const investmentsService = new InvestmentsServices();
      await request.validate(UpdateApprovalValidator);
      const approvalsService = new ApprovalsServices()
      const { id, } = request.params();
      // console.log("Approval query: ", request.qs());
      const { approvalStatus, assignedTo, processedBy, } = request.body();
      // remark
      // check if the request is not existing
      let approval;
      let approvalRequestIsExisting = await approvalsService.getApprovalByApprovalId(id)
      console.log("Existing Approval Request details: ", approvalRequestIsExisting);
      if (!approvalRequestIsExisting) {
        //    return error message to user
        // throw new Error(`Approval Request with Id: ${id} does not exist, please check and try again.`);
        throw new AppException({ message: `Approval Request with Id: ${id} does not exist, please check and try again.`, codeSt: "404" })
      }
      console.log(" Login User Data line 430 =========================");
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

      console.log(" QUERY RESULT: ", approval);
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

      // debugger
      if (!approval || record == undefined || !record) {
        return response
          .status(404)
          .json({ status: "FAILED", message: "Not Found,try again." });
      }
      // console.log(" QUERY RESULT for record: ", record.$original);

      if (approval) {
        console.log("Investment approval Selected for Update line 481:", approval);
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
        // console.log("Admin remark line 498 ==================== ", approval.remark);
        // console.log("Admin remark line 499 ========*******************=========== ", remark);
        approval = await approvalsService.updateApproval(approval, payload);
        // console.log("Approval updated: ", approval);
        let newStatus;
        await approval.save();
        console.log("Update Approval Request line 504:", approval);
        let { id, firstName, currencyCode, lastName, email } = record;
        console.log("Surname: ", lastName)
        console.log("CurrencyCode: ", currencyCode)
        // debugger
        // let { email } = contactDetails;
        // let email = email;
        let timelineObject;
        // console.log("Approval.requestType: ===========================================>", approval.requestType)
        // console.log("Approval.approvalStatus: ===========================================>", approval.approvalStatus)
        if (approval.requestType === "start_investment" && approval.approvalStatus === "approved") { //&& record.status == "submitted"
          console.log("Approval for investment request processing: ===========================================>")
          // newStatus = "submitted";
          newStatus = "approved"; //'pending_account_number_generation'; 
          record.status = newStatus;
          record.requestType = "start_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = "investment_approved"//approval.approvalStatus;

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
            message: `${firstName}, your investment request has been approved, please wait while the investment is started. Thank you.`,
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

                Please wait while the investment is being started. 

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 567:", newNotificationMessage);
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
          // if successful 
          if (debitUserWalletForInvestment.status == 200) {
            // update the investment details
            record.status = 'active'
            record.approvalStatus = 'approved'
            record.startDate = DateTime.now() //.toISODate()
            record.payoutDate = DateTime.now().plus({ days: record.duration })
            record.isInvestmentCreated = true
                        // console.log("Updated record Status line 537: ", record);

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
          }

          // Save the updated record
          // await record.save();
          // update record
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletIdToSearch, userIdToSearch);
          // console.log(" Current log, line 532 :", currentInvestment);
          // send for update
          let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          console.log(" Current log, line 535 :", updatedInvestment);

        } else if (approval.requestType == "start_investment" && approval.approvalStatus == "declined") { // && record.status == "submitted"
          newStatus = "investment_declined";
          record.status = newStatus;
          record.approvalStatus = "investment_declined"; //approval.approvalStatus;
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
          let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          console.log(" Current log, line 590 :", updatedInvestment);

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
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 605:", timelineObject);
          let newTimeline = await timelineService.createTimeline(timelineObject);
          console.log("new Timeline object line 607:", newTimeline);

          // Send Details to notification service
          let subject = "AstraPay Investment Declined";
          let message = `
                ${firstName} this is to inform you, that your investment request, has been declined.

                Please check your account, and try again later.

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

        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "payout") { //&& record.status == "submitted"
          console.log("Approval for investment payout processing: ===========================================>")
          // newStatus = "submitted";
          newStatus = "approved"; //'pending_account_number_generation'; 
          record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = "investment_approved"//approval.approvalStatus;
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
            debugger
            if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessage.message !== "Success") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessage);
            }
          }
        } else if (approval.requestType === "payout_investment" && approval.approvalStatus === "rollover") { //&& record.status == "submitted"
          console.log("Approval for investment rollover processing: ===========================================>")
          // newStatus = "submitted";
          newStatus = "rollover"; //'pending_account_number_generation'; 
          record.status = newStatus;
          record.requestType = "payout_investment";
          // record.remark = approval.remark;
          // record.isInvestmentApproved = true;
          // TODO: Uncomment to use loginAdminFullName
          // record.processedBy = loginAdminFullName;
          record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
          record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
          record.approvalStatus = "rollover"//approval.approvalStatus;
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
          // let descriptionForPrincipal = `Payout of the principal of ${amount} for ${beneficiaryName} investment with ID: ${id}.`;
          let descriptionForInterest = `Payout of the interest of ${interestDueOnInvestment} for ${beneficiaryName} investment with ID: ${id}.`;

          // Check if the user set Rollover
          // "rolloverType": "101",
          // "rolloverTarget": 3,
          // "rolloverDone": 0,
          // '100' = 'no rollover',
          //   '101' = 'rollover principal only',
          //   '102' = 'rollover principal with interest',
          if ((isRolloverActivated == true && rolloverType !== "100" && status === "matured") || (isRolloverActivated == true && rolloverType !== "100" && status === "matured")) {
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
                debugger

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
                debugger
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
              let newInvestmentDetails = investmentsService.createNewInvestment(newInvestmentPayload, amount)
              console.log("newInvestmentDetails ", newInvestmentDetails)
              debugger
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
              debugger
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
              let newInvestmentDetails = investmentsService.createNewInvestment(newInvestmentPayload, totalAmountToPayout)
            console.log("newInvestmentDetails ", newInvestmentDetails)
            debugger
            }
          }

        } else if (approval.requestType == "terminate_investment" && approval.approvalStatus == "approved" && record.status !== "terminated") {
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
            action: "investment request termination",
            investmentId: investmentId,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment request has been terminated, thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 657:", timelineObject);
          let newTimeline = await timelineService.createTimeline(timelineObject);
          console.log("new Timeline object line 659:", newTimeline);

          // Send Details to notification service

          let subject = "AstraPay Investment Termination";
          let message = `
                ${firstName} this is to inform you, that your investment request, has been terminated.
                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 670:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }
        } else if (approval.requestType == "terminate_investment" && approval.approvalStatus == "declined" && record.status !== "initiated") {
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
          // console.log(" Current log, line 690 :", currentInvestment);
          // send for update
          let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, record);
          console.log(" Current log, line 693 :", updatedInvestment);

          console.log("Updated record Status line 695: ", record);
          // update timeline
          timelineObject = {
            id: uuid(),
            action: "investment termination declined",
            investmentId: id,
            walletId: walletIdToSearch,
            userId: userIdToSearch,
            // @ts-ignore
            message: `${firstName}, your investment request termination has been declined, please check your account,thank you.`,
            createdAt: DateTime.now(),
            metadata: ``,
          };
          // console.log("Timeline object line 1481:", timelineObject);
          let newTimeline = await timelineService.createTimeline(timelineObject);
          console.log("new Timeline object line 1483:", newTimeline);

          // Send Details to notification service
          let subject = "AstraPay Investment Termination Declined";
          let message = `
                ${firstName} this is to inform you, that your investment request, termination approval has been declined.

                Please check your account.

                Thank you.

                AstraPay Investment.`;
          let newNotificationMessage = await sendNotification(email, subject, firstName, message);
          console.log("newNotificationMessage line 1496:", newNotificationMessage);
          if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            console.log("Notification sent successfully");
          } else if (newNotificationMessage.message !== "Success") {
            console.log("Notification NOT sent successfully");
            console.log(newNotificationMessage);
          }

        }
        // Update Investment data
        console.log(" Updated record line 733: ", record.$original);
        // send to user
        return response
          .status(200)
          .json({
            status: "OK",
            data: approval//.map((inv) => inv.$original),
          });
      } else {
        return response
          .status(404)
          .json({
            status: "FAILED",
            message: "No data match your query parameters",
          });
      }
    } catch (error) {
      console.log("Error line 750", error.messages);
      console.log("Error line 751", error.message);
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
      console.error(error.messages);
      return response.status(404).json({
        status: "FAILED",
        message: error.messages.errors,
      });
    }
  }
}


