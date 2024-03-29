/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import Setting from 'App/Models/Setting'
import Payout from 'App/Models/Payout'
import PayoutRecord from 'App/Models/PayoutRecord'
// import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
const Env = require("@ioc:Adonis/Core/Env");
const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
// import PuppeteerServices from 'App/Services/PuppeteerServices'
// import { string } from '@ioc:Adonis/Core/Helpers'
// import Env from '@ioc:Adonis/Core/Env'
// const axios = require('axios').default

const TRANSACTION_PREFIX = Env.get('TRANSACTION_PREFIX')

import {
  // generateRate,
  interestDueOnPayout,
  dueForPayout,
  // payoutDueDate,
  approvalRequest,
  sendPaymentDetails,
  investmentRate,
  createNewInvestment,
  // @ts-ignore
} from 'App/Helpers/utils'

import Approval from 'App/Models/Approval'
import CreateInvestmentValidator from 'App/Validators/CreateInvestmentValidator'
import { InvestmentType } from 'App/Services/types/investment_type'
import InvestmentsServices from 'App/Services/InvestmentsServices'
import TimelinesServices from 'App/Services/TimelinesServices'
import TypesServices from 'App/Services/TypesServices'
import ApprovalsServices from 'App/Services/ApprovalsServices'
import SettingsServices from 'App/Services/SettingsServices'
import { debitUserWallet } from 'App/Helpers/debitUserWallet'
// import { sendNotification } from 'App/Helpers/sendNotification'
import UpdateInvestmentValidator from 'App/Validators/UpdateInvestmentValidator'
import { sendNotificationWithPdf } from 'App/Helpers/sendNotificationWithPdf'
import { sendNotificationWithoutPdf } from 'App/Helpers/sendNotificationWithoutPdf'
import { checkTransactionStatus } from 'App/Helpers/checkTransactionStatus'
// import { generateString } from 'App/Helpers/generateCertificateNumber'
// import Rabbit from '@ioc:Adonis/Addons/Rabbit'
// import { getDecimalPlace } from 'App/Helpers/utils_02'
// import Mail from '@ioc:Adonis/Addons/Mail'
const randomstring = require("randomstring");

export default class InvestmentsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log("investments params: ", params);
    // console.log("investments query: ", request.qs());
    const investmentsService = new InvestmentsServices();

    // console.log("investments query line 48: ", request.qs());
    const investments = await investmentsService.getInvestments(request.qs());
    // console.log("investments query line 50: ", investments);
    let sortedInvestments = investments;
    const totalCount = await investmentsService.getInvestmentsCount(request.qs());
    const totalSum = await investmentsService.getInvestmentsSum(request.qs());
    // debugger
    if (sortedInvestments.length < 1) {
      return response.status(200).json({
        status: "OK",
        message: "No investment request matched your search",
        data: null,
        totalCount,
        totalSum,
      });
    }
    // return recommendation(s)
    // let totalCount = sortedInvestments.length;
    // let newCert = await generateString();
    // console.log("New certificate Number:", newCert)
    return response.status(200).json({
      status: "OK",
      data: sortedInvestments,
      totalCount,
      totalSum,
    });
  }

  public async show({ params, request, response }: HttpContextContract) {
    try {
      console.log('INVESTMENT params: ', params)
      const investmentsService = new InvestmentsServices();
      // console.log("investments query line 108: ", request.qs());
      const investments = await investmentsService.getInvestments(request.qs());
      // console.log("investments query line 110: ", investments);
      let sortedInvestments = investments;

      if (sortedInvestments.length < 1) {
        return response.status(200).json({
          status: "OK",
          message: "No investment request matched your search",
          data: null,
        });
      }
      // return recommendation(s)
      return response.status(200).json({
        status: "OK",
        data: sortedInvestments,
      });
    } catch (error) {
      console.log(error)
      console.log("Error line 164", error.messages);
      console.log("Error line 165", error.message);
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
  public async showByInvestmentId({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    const { investmentId } = request.params()
    try {
      const investmentsService = new InvestmentsServices();
      const investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
      if (!investment) return response.status(404).json({ status: 'FAILED' })
      // update record
      // let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, investment.walletId, investment.userId);
      // console.log(" Current log, line 197 :", currentInvestment);
      // send for update
      //  await investmentsService.updateInvestment(currentInvestment, investment);
      // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
      // console.log(" Current log, line 200 :", updatedInvestment);
      // debugger
      return response.status(200).json({ status: 'OK', data: investment })
    } catch (error) {
      // console.log(error)
      console.log("Error line 205", error.messages);
      console.log("Error line 206", error.message);
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

  public async showByUserId({ params, request, response, }: HttpContextContract) {
    console.log("Investment params line 236: ", params);
    const { userId } = request.params();
    console.log("Investment params userId line 238: ", userId);
    try {
      const investmentsService = new InvestmentsServices();
      // let investments = await investmentsService.getInvestmentsByUserId(userId);
      let investments = await investmentsService.getInvestmentsByUserIdWithQuery(userId, request.qs());
      // console.log("Investments result :", investments);
      if (investments && investments.length > 0) {
        let investmentWithPreloadedData = investments.map((investment) => {
          return investment;
        });
        return response
          .status(200)
          .json({ status: "OK", data: investmentWithPreloadedData });
      } else {
        return response
          .json({ status: "OK", data: null });
      }
    } catch (error) {
      console.log("Error line 218", error.messages);
      console.log("Error line 219", error.message);
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


  public async showPayouts({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    try {
      //   const investment = await Investment.query().where('status', 'payout')
      // .orWhere('id', params.id)
      // .limit()
      const { search, limit, userId, investmentId, requestType, walletId } = request.qs()
      // console.log('PAYOUT query: ', request.qs())
      const payout = await Payout.all()
      let sortedPayouts = payout
      // console.log('PAYOUT Investment line 150: ', payout)
      if (search) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          // console.log(' Sorted :', payout.lastName!.includes(search))
          // @ts-ignore
          return payout.lastName!.startsWith(search)
        })
      }
      if (userId) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.userId === parseInt(userId)
        })
      }
      if (investmentId) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.investmentId === parseInt(investmentId)
        })
      }
      if (walletId) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.walletId === parseInt(walletId)
        })
      }
      if (requestType) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          return payout.requestType === requestType
        })
      }
      if (limit) {
        sortedPayouts = sortedPayouts.slice(0, Number(limit))
      }
      if (sortedPayouts.length < 1) {
        return response.status(200).json({
          status: 'OK',
          message: 'No investment payout matched your search',
          data: null,
        })
      }
      // return payouts
      // sortedPayouts.map((payout)=> {payout.$original}),
      return response.status(200).json({
        status: 'OK',
        data: sortedPayouts.map((payout) => payout.$original),
      })
    } catch (error) {
      console.log(error)
      console.log("Error line 345", error.messages);
      console.log("Error line 346", error.message);
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

  public async feedbacks({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params line 149: ', params)
    const timelineService = new TimelinesServices();
    // const investmentsService = new InvestmentsServices();
    // const { walletId,userId, investmentId, requestType, approvalStatus, getInvestmentDetails } = request.qs()
    const { userId, investmentId, requestType, approvalStatus, getInvestmentDetails } = request.qs()
    // console.log('INVESTMENT query line 151: ', request.qs())
    let investment = await Investment.all()
    let approvals
    // let timeline
    let timelineObject
    if (
      requestType === 'start_investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      // console.log('INVESTMENT ID', investmentId)
      // console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('request_type', requestType)
        .where('user_id', userId)
        .where('investment_id', investmentId)
      // check the approval status
      // console.log('approvals line 163: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      // console.log('approvals line 170: ', approvals[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start_investment
      if (approvals[0].approvalStatus === 'approved') {
        //  investment
        let status = 'initiated';
        try {
          investment = await Investment.query().where({
            id: investmentId,
            user_id: userId,
            request_type: requestType,
            status: status,
          })

          //  investment = await investmentsService.getInvestmentByWalletIdAndInvestmentIdAndStatusAndUserIdAndRequestType(walletId,investmentId,status,userId,requestType);
        } catch (error) {
          console.error(error)
          // return response.json({ status: 'FAILED', message: error.message })
          console.log("Error line 415", error.messages);
          console.log("Error line 416", error.message);
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
        // console.log('INVESTMENT DATA line 305: ', investment)
        if (investment.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message: 'No investment activation approval data matched your query, please try again',
          // })
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message: 'No investment activation approval data matched your query, please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }
        investment[0].approvalStatus = approvals[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status of investment
        // update start date
        investment[0][0].status = 'active'
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        investment[0][0].startDate = DateTime.now().toISO()
        let duration = investment[0][0].duration;  //parseInt(investment.duration)
        investment[0][0].payoutDate = DateTime.now().plus({ days: duration })
        // console.log('The currentDate line 336: ', currentDateMs)
        // console.log('Time investment was started line 337: ', investment[0][0].startDate)
        // console.log('Time investment payout date line 338: ', investment[0][0].payoutDate)
        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment activated',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName}, your investment of ${investment[0].currencyCode} ${investment[0].amount} has been activated.`,
          adminMessage: `${investment[0].firstName}, investment of ${investment[0].currencyCode} ${investment[0].amount} has been activated.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 348:', timelineObject)
        // //  Push the new object to the array
        // // timeline = investment.timeline //JSON.parse(investment.timeline)
        // timeline.push(timelineObject)
        // console.log('Timeline object line 352:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);
        // Save
        await investment[0].save()
        // Send notification
        // console.log('Updated investment Status line 358: ', investment[0])
        // START
        //  const requestUrl = Env.get('CERTIFICATE_URL') + investment.id
        //  await new PuppeteerServices(requestUrl, {
        //    paperFormat: 'a3',
        //    fileName: `${investment.requestType}_${investment.id}`,
        //  })
        //    .printAsPDF(investment)
        //    .catch((error) => console.error(error))
        //  return response.status(200).json({ status: 'OK', data: investment.$original })

        // END
        // const requestUrl = Env.get('CERTIFICATE_URL') //+ investment.id
        // await new PuppeteerServices(requestUrl, {
        //   paperFormat: 'a3',
        //   fileName: `${investment[0].requestType}_${investment[0].id}`,
        // })
        //   .printAsPDF(investment[0])
        //   .catch((error) => console.error(error))
        // console.log('Investment Certificate generated, URL, line 378: ', requestUrl)
        // // save the certicate url
        // investment[0].certificateUrl = requestUrl
        await investment[0].save()
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvals.length > 0 && approvals[0].approvalStatus === 'declined') {
        // investment = await Investment.query()
        //   .where('status', 'initiated')
        //   .where('request_type', requestType)
        //   .where('user_id', userId)
        //   .where('id', investmentId)
        try {
          investment = await Investment.query().where({
            id: investmentId,
            user_id: userId,
            request_type: requestType,
            status: 'initiated',
          })
        } catch (error) {
          console.error(error)
          // return response.json({ status: 'FAILED', message: error.message })
          console.log("Error line 533", error.messages);
          console.log("Error line 534", error.message);
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
        // console.log('The declined investment line 239: ', investment)
        if (investment.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message: 'No investment activation decline data matched your query, please try again',
          // })
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message: 'No investment activation decline data matched your query, please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }

        // investment.status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment declined',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName}, your investment has just been declined.`,
          adminMessage: `${investment[0].firstName}, investment has just been declined.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 429:', timelineObject)
        // //  Push the new object to the array
        // // timeline = investment.timeline
        // timeline.push(timelineObject)
        // console.log('Timeline object line 433:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);
        // Save
        await investment[0].save()

        // send notification
        // console.log(
        //   'INVESTMENT DATA line 443: ',
        //   investment.map((inv) => inv.$original)
        // )

        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvals })
      }
    } else if (
      requestType === 'liquidate_ investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      // console.log('INVESTMENT ID', investmentId)
      // console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('request_type', requestType)
        .where('user_id', userId)
        .where('investment_id', investmentId)
      // check the approval status
      // console.log('approvals line 270: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      // console.log('approvals line 277: ', approvals[0].approvalStatus)
      //  if approved update investment status to liquidated, update startDate,  and start_investment
      if (approvals[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        // console.log('INVESTMENT DATA line 285: ', investment)
        if (investment.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No investment termination approval data matched your query,or the feedback has been applied,or please try again',
          // })
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message:
              'No investment termination approval data matched your query,or the feedback has been applied,or please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }
        investment[0][0].approvalStatus = approvals[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
        investment[0][0].isPayoutAuthorized = true
        investment[0][0].isTerminationAuthorized = true
        investment[0][0].status = 'liquidated'

        // @ts-ignore
        // investment.datePayoutWasDone = DateTime.now().toISO()
        // investment.startDate = DateTime.now().toISO()
        // let duration = parseInt(investment.duration)
        // investment.payoutDate = DateTime.now().plus({ days: duration })
        // console.log('The currentDate line 284: ', currentDateMs)
        // console.log('Time investment was started line 285: ', investment.startDate)
        // console.log('Time investment payout date line 286: ', investment.payoutDate)

        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment liquidated',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName} investment has just been liquidated.`,
          adminMessage: `${investment[0].firstName} investment has just been liquidated.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 529:', timelineObject)
        //  Push the new object to the array
        // timeline = investment.timeline
        // timeline.push(timelineObject)
        // console.log('Timeline object line 533:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);
        // Save
        await investment[0].save()

        // send notification
        // console.log('Updated investment Status line 540: ', investment[0])
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvals.length > 0 && approvals[0].approvalStatus === 'declined') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        // console.log('The declined investment line 323: ', investment)
        if (investment.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No investment termination decline data matched your query,or the feedback has been applied,or please try again',
          // })
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message:
              'No investment termination decline data matched your query,or the feedback has been applied,or please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }

        // investment.status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment termination declined',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName} investment termination has just been declined.`,
          adminMessage: `${investment[0].firstName} investment termination has just been declined.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 583:', timelineObject)
        //  Push the new object to the array
        // timeline = investment.timeline
        // timeline.push(timelineObject)
        // console.log('Timeline object line 587:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);
        // Save
        await investment[0].save()

        // send notification
        // console.log(
        //   'INVESTMENT DATA line 337: ',
        //   investment.map((inv) => inv.$original)
        // )
        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvals.map((inv) => inv.$original) })
      }
    } else if (
      requestType === 'payout_investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      // console.log('INVESTMENT ID', investmentId)
      // console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('requestType', requestType)
        .where('userId', userId)
        .where('investmentId', investmentId)
      // check the approval status
      // console.log('approvals line 353: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment payout request data matched your query, please try again',
        })
      }
      // console.log('approvals line 345: ', approvals[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start_investment
      if (approvals[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        // console.log('INVESTMENT DATA line 368: ', investment)
        if (investment.length < 1) {
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message:
              'No investment data matched your query,or the feedback has been applied,or please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }
        investment[0].approvalStatus = approvals[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
        // update start date
        investment[0].isPayoutAuthorized = true
        // investment[0].isTerminationAuthorized = true
        investment[0].status = 'payout'
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        // investment.startDate = DateTime.now().toISO()
        // let duration = parseInt(investment.duration)

        // investment.payoutDate = DateTime.now().toISO() //DateTime.now().plus({ days: duration })

        // console.log('The currentDate line 372: ', currentDateMs)
        // console.log('Time investment was started line 373: ', investment.startDate)
        // console.log('Time investment payout date line 390: ', investment[0].payoutDate)
        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment payout approved',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName} investment has just been approved for payout.`,
          adminMessage: `${investment[0].firstName} investment has just been approved for payout.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 676:', timelineObject)
        // //  Push the new object to the array
        // // timeline = investment.timeline
        // timeline.push(timelineObject)
        // console.log('Timeline object line 680:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);
        // Save
        await investment[0].save()

        // send notification
        // console.log('Updated investment Status line 687: ', investment)
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvals.length > 0 && approvals[0].approvalStatus === 'declined') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        // console.log('The declined investment line 698: ', investment)
        if (investment.length < 1) {
          // return response.json({
          //   status: 'FAILED',
          //   message:
          //     'No investment payout decline data matched your query, or the feedback has been applied, or please try again',
          // })
          investment = await Investment.query()
            // .where('status', 'active')
            .where('requestType', requestType)
            .where('userId', userId)
            .where('id', investmentId)
          return response.json({
            status: 'OK',
            message:
              'No investment payout decline data matched your query, or the feedback has been applied, or please try again',
            approvaldata: approvals.map((approval) => approval.$original),
            investmentdata: investment.map((investment) => investment.$original),
          })
        }

        // investment.status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment payout declined',
          investmentId: investment[0].id,//id,
          walletId: investment[0].walletId,// walletId,
          userId: investment[0].userId,// userId,
          // @ts-ignore
          message: `${investment[0].firstName} investment payout has just been declined.`,
          adminMessage: `${investment[0].firstName} investment payout has just been declined.`,
          createdAt: DateTime.now(),
          metadata: `amount invested: ${investment[0].amount}, request type : ${investment[0].requestType}`,
        }
        // console.log('Timeline object line 730:', timelineObject)
        // //  Push the new object to the array
        // // timeline = investment.timeline
        // timeline.push(timelineObject)
        // console.log('Timeline object line 734:', timeline)
        // stringify the timeline array
        // investment.timeline = JSON.stringify(timeline)
        await timelineService.createTimeline(timelineObject);

        // await Save
        await investment[0].save()
        // send notification
        // console.log(
        //   'INVESTMENT DATA line 744: ',
        //   investment.map((inv) => inv.$original)
        // )
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else {
        return response.json({ status: 'OK', data: approvals.map((inv) => inv.$original) })
      }
    } else if (investment.length > 0) {
      // check the approval for request
      let approvals = await Approval.all()
      let sortedApproval = approvals
      let sortedInvestment = investment
      if (
        requestType &&
        userId &&
        investmentId &&
        approvalStatus &&
        getInvestmentDetails === 'true'
      ) {
        // console.log('Request Type', requestType)
        sortedInvestment = sortedInvestment.filter((investment) => {
          return (
            investment.requestType === requestType &&
            investment.userId === userId &&
            investment.id === investmentId &&
            investment.approvalStatus === approvalStatus
          )
        })
        // console.log('investment line 514: ', sortedInvestment)
        if (sortedInvestment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment approval request data matched your query, please try again',
          })
        }
        // console.log('approval line 782: ', sortedInvestment)

        return response.json({ status: 'OK', data: sortedInvestment.map((inv) => inv.$original) })
      }
      if (requestType) {
        // console.log('Request Type', requestType)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.requestType === requestType
        })
      }
      if (userId) {
        // console.log('USER ID', userId)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.userId === userId
        })
      }
      if (investmentId) {
        // console.log('INVESTMENT ID', investmentId)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.investmentId === investmentId
        })
      }
      //  approvalStatuss
      if (approvalStatus) {
        // console.log('Request Type', approvalStatus)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.approvalStatus === approvalStatus
        })
      }

      // check the approval status
      // console.log('approval line 813: ', sortedApproval)
      if (sortedApproval.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      // console.log('approval line 820: ', sortedApproval)

      return response.json({ status: 'OK', data: sortedApproval.map((inv) => inv.$original) })
    } else {
      return response.json({ status: 'FAILED', message: 'No data matched your feedback query' })
    }
    // try {
    //   let testAmount = 505000
    //   let testDuration = 180
    //   let testInvestmentType = 'fixed'
    //   let investmentRate = async function (amount, duration, investmentType) {
    //     try {
    //       const response = await axios.get(
    //         `${API_URL}/investments/rates?amount=${amount}&duration=${duration}&investmentType=${investmentType}`
    //       )
    //       console.log('The API response: ', response.data)
    //       if (response.data.status === 'OK' && response.data.data.length > 0) {
    //         return response.data.data[0].interest_rate
    //       } else {
    //         return
    //       }
    //     } catch (error) {
    //       console.error(error)
    // console.log("Error line 750", error.messages);
    // console.log("Error line 751", error.message);
    // if (error.code === 'E_APP_EXCEPTION') {
    //   console.log(error.codeSt)
    //   let statusCode = error.codeSt ? error.codeSt : 500
    //   return response.status(parseInt(statusCode)).json({
    //     status: "FAILED",
    //     message: error.messages,
    //     hint: error.message
    //   });
    // }
    // return response.status(500).json({
    //   status: "FAILED",
    //   message: error.messages,
    //   hint: error.message
    // });

    //     }
    //   }

    //   console.log(
    //     ' The Rate return for RATE: ',
    //     await investmentRate(testAmount, testDuration, testInvestmentType)
    //   )
    //   let rate = await investmentRate(testAmount, testDuration, testInvestmentType)
    //   console.log(' Rate return line 236 : ', rate)
    //   if (rate === undefined  || rate.length < 1) {
    //     return response.status(400).json({
    //       status: 'OK',
    //       message: 'No investment rate matched your search, please try again.',
    //       data: null,
    //     })
    //   }

    //   // const investment = await Investment.query().where('status', 'initiated') // rate
    //   // console.log('INVESTMENT DATA line 169: ', investment)

    //   // const investment = await Investment.query().where('status', 'pending')
    //   // .orWhere('id', params.id)
    //   // .limit()
    //   if (investment && investment.length > 0) {
    //     // console.log('INVESTMENT: ',investment.map((inv) => inv.$extras))
    //     console.log('INVESTMENT DATA line 253: ', investment)
    //     return response
    //       .status(200)
    //       .json({ status: 'OK', data: investment.map((inv) => inv.$original) })
    //   } else {
    //     return response
    //       .status(200)
    //       .json({ status: 'FAILED', message: 'No investment matched your query.' })
    //   }
    // } catch (error) {
    //   console.error(error)
    //  console.log("Error line 750", error.messages);
    //   console.log("Error line 751", error.message);
    //   if (error.code === 'E_APP_EXCEPTION') {
    //     console.log(error.codeSt)
    //     let statusCode = error.codeSt ? error.codeSt : 500
    //     return response.status(parseInt(statusCode)).json({
    //       status: "FAILED",
    //       message: error.messages,
    //       hint: error.message
    //     });
    //   }
    //   return response.status(500).json({
    //     status: "FAILED",
    //     message: error.messages,
    //     hint: error.message
    //   });

    // }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      // const timelineService = new TimelinesServices();
      const investmentsService = new InvestmentsServices();
      // const { investmentId } = request.params()
      const { investmentId } = request.all()
      await request.validate(UpdateInvestmentValidator);
      // const typesService = new TypesServices();
      const {
        walletId, userId,
        lng, lat, phone, email, investorFundingWalletId, rolloverType,
        rolloverTarget, investmentType, tagName, isRolloverActivated, isRolloverSuspended,
        rolloverReactivationDate,
        isPayoutSuspended,
        payoutReactivationDate, principalPayoutStatus,
        interestPayoutStatus } = request.body();

      // debugger
      let investment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId)
      // debugger
      if (investment) {
        // console.log('Investment Selected for Update line 889:', investment.startDate)
        let isDueForPayout
        if (investment.startDate !== null) {
          let startDate = investment.startDate
          let duration = investment.duration
          // let timeline
          // let timelineObject
          // try {
          isDueForPayout = await dueForPayout(startDate, duration)
          // debugger
          // isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
          // console.log('Is due for payout status @ InvestmentsController line 1121 ========= :', isDueForPayout)
          // let newRolloverTarget = request.input('rolloverTarget')
          // let newRolloverType = request.input('rolloverType')
          // Restrict update to timed/fixed deposit only
          if (
            investment &&
            investment.investmentType !== 'debenture' &&
            isDueForPayout === false
            //  && rolloverTarget <= 5
          ) {

            // update timeline
            // timelineObject = {
            //   id: uuid(),
            //   action: 'investment updated',
            //   investmentId: investment.id,//id,
            //   walletId: investment.walletId,// walletId,
            //   userId: investment.userId,// userId,
            //   // @ts-ignore
            //   message: `${investment.firstName} investment has just been updated.`,
            //   adminMessage: `${investment.firstName} investment has just been updated.`,
            //   createdAt: DateTime.now(),
            //   metadata: `amount invested: ${investment.amount}, request type : ${investment.requestType}`,
            // }
            // // console.log('Timeline object line 935:', timelineObject)
            // //  Push the new object to the array
            // await timelineService.createTimeline(timelineObject);
            // update investment record
            investment.rolloverType = rolloverType;
            investment.rolloverTarget = rolloverTarget;
            investment.investmentType = investmentType;
            investment.isRolloverActivated = isRolloverActivated;
            investment.lng = lng;
            investment.lat = lat;
            investment.investorFundingWalletId = investorFundingWalletId;
            // investment.duration = duration;
            investment.tagName = tagName;
            investment.phone = phone;
            investment.email = email;
            investment.isRolloverSuspended = isRolloverSuspended;
            investment.rolloverReactivationDate = rolloverReactivationDate;
            investment.isPayoutSuspended = isPayoutSuspended;
            investment.payoutReactivationDate = payoutReactivationDate;
            investment.principalPayoutStatus = principalPayoutStatus;
            investment.interestPayoutStatus = interestPayoutStatus;
            // Save
            // update record
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 1346 :", currentInvestment);
            // send for update
            let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 1001 :", updatedInvestment);
            // debugger
            // console.log('Update Investment:', investment)
            // send to user
            return response.json({
              status: 'OK', data: updatedInvestment//.map((inv) => inv.$original)
            })

            // return // 422
          } else {
            return response.status(400).json({
              status: 'FAILED',
              data: investment,//.map((inv) => inv.$original),
              message:
                'please check your investment type and try again later.',// and note the rollover target cannot be more than 5 times',
            })
          }

        } else {
          return response.status(422).json({
            status: 'FAILED', message: 'This investment is yet to be activated.', data: investment//.map((inv) => inv.$original)
          })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'FAILED', message: 'No data match your query parameters' })
      }
    } catch (error) {
      // console.error(error)
      // console.error('update investment Error :', error)
      // return response.json({ status: 'FAILED', data: error.message, hint: error.messages })
      console.log("Error line 1080", error.messages);
      console.log("Error line 1081", error.message);
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
    // return // 401
  }

  public async updateByInvestmentId({ request, response }: HttpContextContract) {
    try {
      const timelineService = new TimelinesServices();
      const investmentsService = new InvestmentsServices();
      // let investment = await Investment.query().where({
      //   user_id: request.input('userId'),
      //   id: request.input('investmentId'),
      // })
      const { investmentId } = request.params()
      const { walletId, userId } = request.all()
      let investment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId)
      if (investment) {
        // console.log('Investment Selected for Update line 1260:', investment.startDate)
        let isDueForPayout
        if (investment.startDate !== null) {
          let createdAt = investment.createdAt
          let duration = investment.duration
          // let timeline
          let timelineObject
          try {
            isDueForPayout = await dueForPayout(createdAt, duration)
            // isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
            // console.log('Is due for payout status :', isDueForPayout)
            let newRolloverTarget = request.input('rolloverTarget')
            let newRolloverType = request.input('rolloverType')
            // Restrict update to timed/fixed deposit only
            if (
              investment &&
              investment.investmentType !== 'debenture' &&
              isDueForPayout === false &&
              newRolloverTarget <= 5
            ) {
              // investment.amount = request.input('amount')
              investment.rolloverTarget = newRolloverTarget
              investment.rolloverType = newRolloverType
              // investment.investmentType = request.input('investmentType')
              if (investment) {
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: 'investment rollover target updated',
                  investmentId: investment.id,//id,
                  walletId: investment.walletId,// walletId,
                  userId: investment.userId,// userId,
                  // @ts-ignore
                  message: `${investment.firstName} investment rollover target has just been updated.`,
                  adminMessage: `${investment.firstName} investment rollover target has just been updated.`,
                  createdAt: DateTime.now(),
                  metadata: `amount invested: ${investment.amount}, request type : ${investment.requestType}`,
                }
                // console.log('Timeline object line 1297:', timelineObject)
                //  Push the new object to the array
                await timelineService.createTimeline(timelineObject);
                // Save
                // update record
                let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                // console.log(" Current log, line 1346 :", currentInvestment);
                // send for update
                await investmentsService.updateInvestment(currentInvestment, investment);
                // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
                // console.log(" Current log, line 1349 :", updatedInvestment);

                // console.log('Update Investment:', investment)
                // send to user
                return response.json({

                  status: 'OK', data: investment//.map((inv) => inv.$original)
                })
              }
              return // 422
            } else {
              return response.status(400).json({
                status: 'FAILED',
                data: investment,//.map((inv) => inv.$original),
                message:
                  'please check your investment type, and note the rollover target cannot be more than 5 times',
              })
            }
          } catch (error) {
            console.error('Is due for payout status Error :', error)
            // return response.json({ status: 'FAILED', data: error.message })
            console.log("Error line 1319", error.messages);
            console.log("Error line 1320", error.message);
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
        } else {

          return response.json({
            status: 'FAILED', data: investment//.map((inv) => inv.$original)
          })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'FAILED', message: 'No data match your query parameters' })
      }
    } catch (error) {
      // console.error(error)
      // console.error('update investment by investmentId Error :', error)
      // return response.json({ status: 'FAILED', data: error.message })
      console.log("Error line 1196", error.messages);
      console.log("Error line 1197", error.message);
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
    // return // 401
  }

  public async store({ request, response }: HttpContextContract) {
    try {
      await request.validate(CreateInvestmentValidator);
      const investmentsService = new InvestmentsServices();
      const timelineService = new TimelinesServices();
      const typesService = new TypesServices();
      const { lastName, firstName,
        walletId, userId, investmentTypeId, investmentTypeName, rfiCode, currencyCode,
        lng, lat, rfiRecordId, phone, email, investorFundingWalletId, amount, duration, rolloverType,
        rolloverTarget, investmentType, tagName, isRolloverActivated, principalPayoutStatus, interestPayoutStatus, penalty,
      } = request.body();

      const payload: InvestmentType = {
        lastName: lastName,
        firstName: firstName,
        walletId: walletId,
        userId: userId,
        investmentTypeId: investmentTypeId,
        investmentTypeName: investmentTypeName,
        rfiCode: rfiCode,
        currencyCode: currencyCode,
        lng: lng,
        lat: lat,
        rfiRecordId: rfiRecordId,
        phone: phone,
        email: email,
        investorFundingWalletId: investorFundingWalletId,
        amount: amount,
        duration: duration,
        isRolloverActivated: isRolloverActivated,
        rolloverType: rolloverType,
        rolloverTarget: rolloverTarget,
        investmentType: investmentType,
        tagName: tagName,
        interestRate: 0,
        interestDueOnInvestment: 0,
        totalAmountToPayout: 0,
        principalPayoutStatus: principalPayoutStatus,
        interestPayoutStatus: interestPayoutStatus,
        penalty: penalty,
        verificationRequestAttempts: 0,
        numberOfAttempts: 0,
      }

      let investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);

      let rate;
      // if (investmentTypeDetails) {
      //   let { interestRate, status, lowestAmount, highestAmount, investmentTenures } = investmentTypeDetails;
      //   if (status !== "active") {
      //     return response.status(422).json({
      //       status: 'FAILED',
      //       message: `The investment type you selected is ${status} , please select another one and try again.`,
      //     })
      //   }
      //   if (amount < lowestAmount || amount > highestAmount) {
      //     let message
      //     if (amount < lowestAmount) {
      //       message = `The least amount allowed for this type of investment is ${currencyCode} ${lowestAmount} , please input an amount that is at least ${currencyCode} ${lowestAmount} but less than or equal to ${currencyCode} ${highestAmount} and try again. Thank you.`;
      //     } else if (amount > highestAmount) {
      //       message = `The highest amount allowed for this type of investment is ${currencyCode} ${highestAmount} , please input an amount less than or equal to ${currencyCode} ${highestAmount} but at least ${currencyCode} ${lowestAmount} and try again. Thank you.`;
      //     }

      //     return response.status(422).json({
      //       status: 'FAILED',
      //       message: message,
      //     })
      //   }
      //   let isTenureExisting = investmentTenures.find(o => o.$original.tenure == duration)
      //   // let isTenureExisting = investmentTenures.find(o =>{
      //   //   console.log(' o.$original return line 1349 : ', o.$original.tenure)
      //   //   return o.$original.tenure.toString() == duration.toString();
      //   // })
      //   // console.log(' IsTenureExisting return line 1351 : ', isTenureExisting)
      //   //  debugger
      //   if (isTenureExisting == false || isTenureExisting == undefined) {
      //     // debugger
      //     return response.status(404).json({
      //       status: 'FAILED',
      //       message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`,
      //     })
      //   }
      //   rate = interestRate;
      //   // debugger
      // }
      debugger
      // chatGPT Optimised Code
      if (investmentTypeDetails) {
        let { interestRate, status, lowestAmount, highestAmount, investmentTenures } = investmentTypeDetails;
        if (status !== "active") {
          return response.status(422).json({
            status: 'FAILED',
            message: `The investment type you selected is ${status} , please select another one and try again.`,
          })
        }
        if (amount < lowestAmount || amount > highestAmount) {
          let message
          if (amount < lowestAmount) {
            message = `The least amount allowed for this type of investment is ${currencyCode} ${lowestAmount} , please input an amount that is at least ${currencyCode} ${lowestAmount} but less than or equal to ${currencyCode} ${highestAmount} and try again. Thank you.`;
          } else if (amount > highestAmount) {
            message = `The highest amount allowed for this type of investment is ${currencyCode} ${highestAmount} , please input an amount less than or equal to ${currencyCode} ${highestAmount} but at least ${currencyCode} ${lowestAmount} and try again. Thank you.`;
          }

          return response.status(422).json({
            status: 'FAILED',
            message: message,
          });
        }

        const isTenureExisting = investmentTenures.some((o) => o.$original.tenure == duration);
        if (!isTenureExisting) {
          return response.status(404).json({
            status: 'FAILED',
            message: `The selected investment tenure of ${duration} is not available for this investment type, please select another one and try again.`,
          });
        }
        rate = interestRate;
      }

      // console.log(' Rate return line 1365 : ', rate)
      if (rate === undefined) {
        return response.status(400).json({
          status: 'OK',
          message: 'No investment rate matched your search, please try again.',
          data: null,
        })
      }

      // Get the value of the mode of approval set for this type of investment
      let { isAutomated } = investmentTypeDetails;
      // console.log('Payload line 1373  :', payload)
      // const investment = await Investment.create(payload)

      // @ts-ignore
      payload.isRequestSent = true;
      let investment = await investmentsService.createInvestment(payload);
      // console.log("New investment request line 1380: ", investment);
      // console.log("The new newInvestmentRequest data:", newInvestmentRequest);
      let investmentId = investment.id
      // Create Unique payment reference for the customer
      let reference = DateTime.now() + randomstring.generate(4);
      let numberOfAttempts = 1;
      let paymentReference = `${TRANSACTION_PREFIX}-${reference}-${investmentId}_${numberOfAttempts}`;
      // console.log("Customer Transaction Reference ,@ InvestmentsController line 1488 ==================")
      // console.log(paymentReference);
      // let getNumberOfAttempt = paymentReference.split("-");
      // console.log("getNumberOfAttempt line 1505 =====", getNumberOfAttempt[1]);

      // TODO: Uncomment the code below after adding numberOfAttempts column
      investment.numberOfAttempts = numberOfAttempts;
      debugger;
      // @ts-ignore
      investment.investmentRequestReference = paymentReference; //DateTime.now() + randomstring.generate(4);

      let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
      // debugger
      // console.log(" Current log, line 1649 :", currentInvestment);
      // send for update
      await investmentsService.updateInvestment(currentInvestment, investment);
      // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
      // console.log(" Current log, line 1653 =========:", updatedInvestment);

      // const newInvestment = request.all() as Partial<Investment>
      // const investment = await Investment.create(newInvestment)
      // return response.OK(investment)
      // The code below only work when there is auth
      // await user.related('investments').save(investment)
      // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate
      let decPl = 2;
      let interestRateByDuration = rate * (Number(investment.duration) / 360);
      // console.log(`Interest rate by Investment duration for ${duration} day(s), @ utils line 1338:`, interestRateByDuration)
      // convert to decimal places
      // interestRateByDuration = Number(getDecimalPlace(interestRateByDuration, decPl))
      interestRateByDuration = Number(interestRateByDuration.toFixed(decPl));
      // console.log(`Interest rate by Investment duration for ${duration} day(s), in ${decPl} dp, @ InvestmentController line 1342:`, interestRateByDuration);
      investment.interestRate = interestRateByDuration;
      // investment.rolloverDone = payload.rolloverDone

      // When the Invest has been approved and activated
      // let amount = investment.amount
      let investmentDuration = investment.duration
      let amountDueOnPayout = await interestDueOnPayout(amount, rate, investmentDuration)
      // @ts-ignore
      investment.interestDueOnInvestment = amountDueOnPayout
      // @ts-ignore
      investment.totalAmountToPayout = investment.amount + amountDueOnPayout

      const settingsService = new SettingsServices();
      const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
      debugger
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
        message: `${firstName}, you just initiated an investment.`,
        adminMessage: `${firstName}, just initiated an investment.`,
        createdAt: investment.createdAt,
        metadata: `duration: ${investment.duration}`,
      }
      // console.log('Timeline object line 1578:', timelineObject)
      await timelineService.createTimeline(timelineObject);
      // let newTimeline = await timelineService.createTimeline(timelineObject);
      // console.log('Timeline object line 1581:', newTimeline)

      // stringify the timeline array
      // investment.timeline = JSON.stringify(timeline)
      // await investment.save()

      //  Check if investment activation is automated
      let { isInvestmentAutomated,
        // rfiName,
        // initiationNotificationEmail,
        // activationNotificationEmail,
        // maturityNotificationEmail,
        // payoutNotificationEmail,
        // rolloverNotificationEmail,
        // liquidationNotificationEmail,
      } = settings//.isInvestmentAutomated
      let approvalIsAutomated = isInvestmentAutomated;
      debugger
      if ((approvalIsAutomated === false && isAutomated === false) || (approvalIsAutomated === true && isAutomated === false)) {
        // Send Approval Request to Admin
        // let approval = await approvalRequest(userId, investmentId, requestType)
        // console.log(' Approval request return line 938 : ', approval)
        // if (approval === undefined) {
        //   return response.status(400).json({
        //     status: 'OK',
        //     message: 'investment approval request was not successful, please try again.',
        //     data: null,
        //   })
        // }
        // debugger
        const approvalsService = new ApprovalsServices()
        let approvalObject;

        // TODO: Send to the Admin for approval
        // update approvalObject
        approvalObject = {
          rfiCode: rfiCode,
          walletId: investment.walletId,
          investmentId: investment.id,
          userId: investment.userId,
          requestType: "start_investment",
          approvalStatus: investment.approvalStatus,
          assignedTo: "",//investment.assignedTo,
          processedBy: "",//investment.processedBy,
          // remark: "",
        };
        // console.log("ApprovalRequest objects line 1194:", approvalObject);
        // check if the approval request is not existing
        let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
        debugger
        if (!approvalRequestIsExisting) {
          await approvalsService.createApproval(approvalObject);
          // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
          // console.log("new ApprovalRequest object line 1199:", newApprovalRequest);
          // let payoutApprovalObject;

          // // TODO: Send to the Admin for approval
          // // update payoutApprovalObject
          // payoutApprovalObject = {
          //   rfiCode: rfiCode,
          //   walletId: investment.walletId,
          //   investmentId: investment.id,
          //   userId: investment.userId,
          //   requestType: "payout_investment",
          //   approvalStatus: investment.approvalStatus,
          //   assignedTo: "",//investment.assignedTo,
          //   processedBy: "",//investment.processedBy,
          //   // remark: "",
          // };
          // await approvalsService.createApproval(payoutApprovalObject);
          // debugger
        }

        // update timeline
        timelineObject = {
          id: uuid(),
          action: "investment approval request",
          investmentId: investmentId,//id,
          walletId: walletId,// walletId,
          userId: userId,// userId,
          // @ts-ignore
          message: `${firstName}, your investment request has been sent for approval, please wait while the investment is approved. Thank you.`,
          adminMessage: `${firstName}, investment request was sent for approval.`,
          createdAt: DateTime.now(),
          metadata: ``,
        };
        // console.log("Timeline object line 1647:", timelineObject);
        await timelineService.createTimeline(timelineObject);
        debugger
      } else if ((approvalIsAutomated === true && isAutomated === true)) { // || (approvalIsAutomated === false && isAutomated === true)
        // TODO
        // Send Investment Payload To Transaction Service
        // let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
        // console.log(' Feedback from Transaction service: ', sendToTransactionService)
        // record.approvedBy = approval.approvedBy !== undefined ? approval.approvedBy : "automation"
        // record.assignedTo = approval.assignedTo !== undefined ? approval.assignedTo : "automation"
        investment.status = 'investment_approved';
        investment.approvalStatus = "approved"; //approval.approvalStatus;
        investment.requestType = "start_investment";

        // Data to send for transfer of fund
        let { amount, lng, lat, investmentRequestReference,
          firstName, lastName,
          walletId, userId,
          phone,
          email,
          rfiCode, numberOfAttempts } = investment;
        let senderName = `${firstName} ${lastName}`;
        let senderAccountNumber = walletId;
        let senderAccountName = senderName;
        let senderPhoneNumber = phone;
        let senderEmail = email;
        // update record
        let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
        // debugger
        // console.log(" Current log, line 1649 :", currentInvestment);
        // send for update
        await investmentsService.updateInvestment(currentInvestment, investment);
        // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
        // console.log(" Current log, line 1653 =========:", updatedInvestment);

        // update timeline
        timelineObject = {
          id: uuid(),
          action: "investment approved",
          investmentId: investmentId,//id,
          walletId: walletId,// walletId,
          userId: userId,// userId,
          // @ts-ignore
          message: `${firstName}, your investment request has been approved, please wait while the investment is activated. Thank you.`,
          adminMessage: `${firstName}, investment request was approved.`,
          createdAt: DateTime.now(),
          metadata: ``,
        };
        // console.log("Timeline object line 1667:", timelineObject);
        await timelineService.createTimeline(timelineObject);
        // let newTimeline = await timelineService.createTimeline(timelineObject);
        // console.log("new Timeline object line 1670:", newTimeline);
        // update record

        // Send Details to notification service
        // let subject = "AstraPay Investment Approval";
        // let message = `
        //         ${firstName} this is to inform you, that your Investment request, has been approved.

        //         Please wait while the investment is being activated.

        //         Thank you.

        //         AstraPay Investment.`;
        // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
        // // console.log("newNotificationMessage line 1684:", newNotificationMessage);
        // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
        //   console.log("Notification sent successfully");
        // } else if (newNotificationMessage.message !== "Success") {
        //   console.log("Notification NOT sent successfully");
        //   console.log(newNotificationMessage);
        // }
        // Send Notification to admin and others stakeholder
        let messageKey = "approval";
        let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
        // console.log("newNotificationMessage line 1708:", newNotificationMessageWithoutPdf);
        // debugger
        if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
          console.log("Notification sent successfully");
        } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
          console.log("Notification NOT sent successfully");
          console.log(newNotificationMessageWithoutPdf);
        }

        // check if transaction with same customer ref exist
        let checkTransactionStatusByCustomerRef = await checkTransactionStatus(investmentRequestReference, rfiCode);
        debugger
        // if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.status == "FAILED TO GET TRANSACTION STATUS") throw Error(checkTransactionStatusByCustomerRef.message);
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
          debugger
          // if successful
          // if (debitUserWalletForInvestment && debitUserWalletForInvestment.status === 200 && debitUserWalletForInvestment.data.screenStatus === "SUCCESSFUL" ) {
          if (debitUserWalletForInvestment && debitUserWalletForInvestment.status === 200 && debitUserWalletForInvestment.data.screenStatus === "APPROVED") {
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
            // console.log(" Current log, line 1276 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 1723 :", updatedInvestment);

            // console.log("Updated record Status line 1725: ", record);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment activation",
              investmentId: investmentId,//id,
              walletId: walletId,// walletId,
              userId: userId,// userId,
              // @ts-ignore
              message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated. Thank you.`,
              adminMessage: `${firstName}, investment of ${currencyCode} ${amount} was activated.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1739:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1742:", newTimeline);
            // update record
            // debugger
            // Send Details to notification service
            let subject = `${rfiCode.toUpperCase()} Investment Activation`;
            let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${investment.duration} days, has been activated on ${investment.startDate} and it will be mature for payout on ${investment.payoutDate}.

                                Your certificate is attached.

                Please check your device.

                Thank you.

                ${rfiCode.toUpperCase()} Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 1753:", newNotificationMessage);
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
            // console.log("newNotificationMessage line 1786:", newNotificationMessageWithPdf);
            // debugger
            if (newNotificationMessageWithPdf && newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithPdf);
            }
            // debugger
            // Send Notification to admin and others stakeholder
            // let investment = record;
            let messageKey = "activation";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1791:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            };

            // debugger
            const approvalsService = new ApprovalsServices()
            let approvalObject;

            // TODO: Send to the Admin for approval
            // update approvalObject
            approvalObject = {
              rfiCode: rfiCode,
              walletId: investment.walletId,
              investmentId: investment.id,
              userId: investment.userId,
              requestType: "start_investment",
              approvalStatus: "approved",
              assignedTo:"automation",
              processedBy: "automation",
              // remark: "",
            };
            // console.log("ApprovalRequest objects line 1194:", approvalObject);
            // check if the approval request is not existing
            let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
            debugger
            if (!approvalRequestIsExisting) {
              await approvalsService.createApproval(approvalObject);
              // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
              // console.log("new ApprovalRequest object line 1199:", newApprovalRequest);
              // let payoutApprovalObject;

              // // TODO: Send to the Admin for approval
              // // update payoutApprovalObject
              // payoutApprovalObject = {
              //   rfiCode: rfiCode,
              //   walletId: investment.walletId,
              //   investmentId: investment.id,
              //   userId: investment.userId,
              //   requestType: "payout_investment",
              //   approvalStatus: "pending",
              //   assignedTo: "",//investment.assignedTo,
              //   processedBy: "",//investment.processedBy,
              //   // remark: "",
              // };
              // await approvalsService.createApproval(payoutApprovalObject);
              // debugger
            }


          } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 1802 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment activation failed",
              investmentId: investmentId,//id,
              walletId: walletId,// walletId,
              userId: userId,// userId,
              // @ts-ignore
              message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
              adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} has failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1779:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1842:", newTimeline);
            // update record
            // debugger
            // Send Details to notification service
            // let subject = "AstraPay Investment Activation Failed";
            // let message = `
            //       ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

            //       Thank you.

            //       AstraPay Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 1854:", newNotificationMessage);
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
            // }
            // Send Notification to admin and others stakeholder
            let messageKey = "activation_failed";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1865:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
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

        } else if (checkTransactionStatusByCustomerRef && checkTransactionStatusByCustomerRef.data.screenStatus === "FAILED") {
          // update the value for number of attempts
          // get the current investmentRef, split , add one to the current number, update and try again
          // TODO: Update to accomodate the addition of new column
          let getNumberOfAttempt = investmentRequestReference.split("_");
          // console.log("getNumberOfAttempt line 1915 =====", getNumberOfAttempt[1]);
          let updatedNumberOfAttempts = numberOfAttempts + 1;//  Number(getNumberOfAttempt[1]) + 1;
          let uniqueInvestmentRequestReference = getNumberOfAttempt[0];
          debugger;
          let newPaymentReference = `${uniqueInvestmentRequestReference}-${updatedNumberOfAttempts}`;
          // console.log("Customer Transaction Reference ,@ InvestmentsController line 1919 ==================")
          // console.log(newPaymentReference);
          investmentRequestReference = newPaymentReference;
          investment.numberOfAttempts = updatedNumberOfAttempts;
          debugger
          // Send to the endpoint for debit of wallet
          let debitUserWalletForInvestment = await debitUserWallet(amount, lng, lat, investmentRequestReference,
            senderName,
            senderAccountNumber,
            senderAccountName,
            senderPhoneNumber,
            senderEmail,
            rfiCode, userId,)
          debugger
          // if successful
          if (debitUserWalletForInvestment && debitUserWalletForInvestment.status == 200) {

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
            // console.log(" Current log, line 1276 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);
            // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
            // console.log(" Current log, line 1723 :", updatedInvestment);

            // console.log("Updated record Status line 1725: ", record);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment activation",
              investmentId: investmentId,//id,
              walletId: walletId,// walletId,
              userId: userId,// userId,
              // @ts-ignore
              message: `${firstName}, your investment of ${currencyCode} ${amount} has been activated. Thank you.`,
              adminMessage: `${firstName}, investment of ${currencyCode} ${amount} was activated.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1739:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1742:", newTimeline);
            // update record
            // debugger
            // Send Details to notification service
            let subject = `${rfiCode.toUpperCase()} Investment Activation`;
            let message = `
                ${firstName} this is to inform you, that your Investment of ${currencyCode} ${amount} for the period of ${investment.duration} days, has been activated on ${investment.startDate} and it will be mature for payout on ${investment.payoutDate}.

                                Your certificate is attached.

                Please check your device.

                Thank you.

                ${rfiCode.toUpperCase()} Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 1753:", newNotificationMessage);
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
            // console.log("newNotificationMessage line 1786:", newNotificationMessageWithPdf);
            // debugger
            if (newNotificationMessageWithPdf && newNotificationMessageWithPdf.status == "success" || newNotificationMessageWithPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithPdf);
            }
            // debugger
            // Send Notification to admin and others stakeholder
            // let investment = record;
            let messageKey = "activation";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1791:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
            };

            // debugger
            const approvalsService = new ApprovalsServices()
            let approvalObject;

            // TODO: Send to the Admin for approval
            // update approvalObject
            approvalObject = {
              rfiCode: rfiCode,
              walletId: investment.walletId,
              investmentId: investment.id,
              userId: investment.userId,
              requestType: "start_investment",
              approvalStatus: "approved",
              assignedTo: "automation",//investment.assignedTo,
              processedBy: "automation",//investment.processedBy,
              // remark: "",
            };
            // console.log("ApprovalRequest objects line 1194:", approvalObject);
            // check if the approval request is not existing
            let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentId(investment.id);
            debugger
            if (!approvalRequestIsExisting) {
              await approvalsService.createApproval(approvalObject);
              // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
              // console.log("new ApprovalRequest object line 1199:", newApprovalRequest);
              // let payoutApprovalObject;

              // // TODO: Send to the Admin for approval
              // // update payoutApprovalObject
              // payoutApprovalObject = {
              //   rfiCode: rfiCode,
              //   walletId: investment.walletId,
              //   investmentId: investment.id,
              //   userId: investment.userId,
              //   requestType: "payout_investment",
              //   approvalStatus: "pending",
              //   assignedTo: "",//investment.assignedTo,
              //   processedBy: "",//investment.processedBy,
              //   // remark: "",
              // };
              // await approvalsService.createApproval(payoutApprovalObject);
              // debugger
            }


          } else if (debitUserWalletForInvestment && debitUserWalletForInvestment.status !== 200 || debitUserWalletForInvestment.status == undefined) {
            let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
            // console.log(" Current log, line 1802 :", currentInvestment);
            // send for update
            await investmentsService.updateInvestment(currentInvestment, investment);

            // update timeline
            timelineObject = {
              id: uuid(),
              action: "investment activation failed",
              investmentId: investmentId,//id,
              walletId: walletId,// walletId,
              userId: userId,// userId,
              // @ts-ignore
              message: `${firstName}, the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again. Thank you.`,
              adminMessage: `The activation of ${firstName} investment of ${currencyCode} ${amount} has failed due to inability to debit the wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()}.`,
              createdAt: DateTime.now(),
              metadata: ``,
            };
            // console.log("Timeline object line 1779:", timelineObject);
            await timelineService.createTimeline(timelineObject);
            // let newTimeline = await timelineService.createTimeline(timelineObject);
            // console.log("new Timeline object line 1842:", newTimeline);
            // update record
            // debugger
            // Send Details to notification service
            // let subject = "AstraPay Investment Activation Failed";
            // let message = `
            //       ${firstName} this is to inform you, that the activation of your investment of ${currencyCode} ${amount} has failed due to inability to debit your wallet with ID: ${investorFundingWalletId} as at : ${DateTime.now()} , please ensure your account is funded with at least ${currencyCode} ${amount} as we try again.

            //       Thank you.

            //       AstraPay Investment.`;
            // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
            // // console.log("newNotificationMessage line 1854:", newNotificationMessage);
            // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
            //   console.log("Notification sent successfully");
            // } else if (newNotificationMessage.message !== "Success") {
            //   console.log("Notification NOT sent successfully");
            //   console.log(newNotificationMessage);
            // }
            // Send Notification to admin and others stakeholder
            let messageKey = "activation_failed";
            let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, rfiCode, investment,);
            // console.log("newNotificationMessage line 1865:", newNotificationMessageWithoutPdf);
            // debugger
            if (newNotificationMessageWithoutPdf && newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
              console.log("Notification sent successfully");
            } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
              console.log("Notification NOT sent successfully");
              console.log(newNotificationMessageWithoutPdf);
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
        }

      }

      // Testing
      // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
      // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
      // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
      // console.log('Testing Payout Date: ' + testingPayoutDate)

      // Save update to database
      // await investment.save()
      // update record
      currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
      // console.log(" Current log, line 1774 :", currentInvestment);
      // send for update
      await investmentsService.updateInvestment(currentInvestment, investment);
      // let updatedInvestment = await investmentsService.updateInvestment(currentInvestment, investment);
      // console.log(" Current log, line 1777 :", updatedInvestment);

      let newInvestmentId = investment.id
      // Send to Notification Service
      // @ts-ignore
      let newInvestmentEmail = email
      Event.emit('new:investment', {
        id: newInvestmentId,
        email: newInvestmentEmail,
      })

      // publish to RabbitMQ Queue
      // Ensures the queue exists
      // await Rabbit.assertQueue('my_queue')

      // Sends a message to the queue
      // await Rabbit.sendToQueue('my_queue', { data: investment })
      debugger
      return response.status(201).json({ status: 'OK', data: investment })
    } catch (error) {
      console.error('update investment by investmentId Error line 2186 :', error)
      // return response.json({ status: 'FAILED', data: error.message })
      console.log("Error line 2160", error.messages);
      console.log("Error line 2161", error.message);
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO DEBIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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

  public async approve({ request, response }: HttpContextContract) {
    try {
      // let investment = await Investment.query().where({
      //   user_id: params.id,
      //   id: request.input('investmentId'),
      // })
      const { investmentId, userId } = request.qs()
      console.log('Investment query: ', request.qs())
      let investment = await Investment.query().where({
        user_id: userId,
        id: investmentId,
      })
      // console.log(' Investment QUERY RESULT: ', investment)
      if (investment.length > 0) {
        // console.log('Investment Selected for Update:', investment)
        let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        console.log('Is due for payout status :', isDueForPayout)
        // Restrict update to timed/fixed deposit only
        // if (investment && investment.investmentType !== 'debenture' && isDueForPayout === false)
        if (investment) {
          investment[0].status = request.input('status')
            ? request.input('status')
            : investment[0].status
          let liquidate = request.input('isTerminationAuthorized')
          investment[0].isTerminationAuthorized =
            request.input('isTerminationAuthorized') !== undefined
              ? request.input('isTerminationAuthorized')
              : investment[0].isTerminationAuthorized
          console.log('liquidate :', liquidate)
          let payout = request.input('isPayoutAuthorized')
          investment[0].isPayoutAuthorized =
            request.input('isPayoutAuthorized') !== undefined
              ? request.input('isPayoutAuthorized')
              : investment[0].isPayoutAuthorized
          console.log('payout :', payout)
          if (investment) {
            // send to user
            await investment[0].save()
            // console.log('Update Investment:', investment)
            return response
              .status(200)
              .json({ status: 'OK', data: investment.map((inv) => inv.$original) })
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: investment })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'FAILED', message: 'No data match your query parameters' })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 1834", error.messages);
      console.log("Error line 1835", error.message);
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
    // return // 401
  }

  public async showApprovalRequest({ request, params, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    const {
      userId,
      investmentId,
      isPayoutAuthorized,
      isTerminationAuthorized,
      status,
      payoutDate,
      walletId,
      limit,
    } = request.qs()
    console.log('INVESTMENT query: ', request.qs())

    // try {
    //   const investment = await Investment.all()
    //   // .limit()
    //   let sortedApprovalRequest = investment
    //   if (userId) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.userId === parseInt(userId)
    //     })
    //   }
    //   if (investmentId) {
    //     // @ts-ignore
    //     sortedApprovalRequest = await Investment.query().where('id', investmentId)
    //   }

    //   if (isPayoutAuthorized) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.isPayoutAuthorized.toString() === `${isPayoutAuthorized}`
    //     })
    //   }

    //   if (isTerminationAuthorized) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.isTerminationAuthorized.toString() === `${isTerminationAuthorized}`
    //     })
    //   }

    //   if (payoutDate) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.payoutDate.includes(payoutDate)
    //     })
    //   }
    //   if (status) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.status === `${status}`
    //     })
    //   }

    //   if (walletId) {
    //     sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
    //       // @ts-ignore
    //       return investment.walletId.toString() === `${walletId}`
    //     })
    //   }
    //   if (limit) {
    //     sortedApprovalRequest = sortedApprovalRequest.slice(0, Number(limit))
    //   }
    //   if (sortedApprovalRequest.length < 1) {
    //     return response.status(200).json({
    //       status: 'OK',
    //       message: 'No investment approval request matched your search',
    //       data: null,
    //     })
    //   }
    //   // return rate(s)
    //   return response.status(200).json({
    //     status: 'OK',
    //     data: sortedApprovalRequest.map((inv) => inv.$original),
    //   })
    // } catch (error) {
    //   console.log(error)
    //   console.log("Error line 1750", error.messages);
    //   console.log("Error line 1751", error.message);
    //   if (error.code === 'E_APP_EXCEPTION') {
    //     console.log(error.codeSt)
    //     let statusCode = error.codeSt ? error.codeSt : 500
    //     return response.status(parseInt(statusCode)).json({
    //       status: "FAILED",
    //       message: error.messages,
    //       hint: error.message
    //     });
    //   }
    //   return response.status(500).json({
    //     status: "FAILED",
    //     message: error.messages,
    //     hint: error.message
    //   });

    // }
    try {
      const investment = await Investment.all();
      let sortedApprovalRequest = investment;

      if (userId) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.userId === parseInt(userId);
        });
      }

      if (investmentId) {
        sortedApprovalRequest = await Investment.query().where('id', investmentId);
      }

      if (isPayoutAuthorized !== undefined) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          return investment.isPayoutAuthorized.toString() === `${isPayoutAuthorized}`;
        });
      }

      if (isTerminationAuthorized !== undefined) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          return investment.isTerminationAuthorized.toString() === `${isTerminationAuthorized}`;
        });
      }

      if (payoutDate) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.payoutDate.includes(payoutDate);
        });
      }

      if (status) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          return investment.status === `${status}`;
        });
      }

      if (walletId) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          return investment.walletId.toString() === `${walletId}`;
        });
      }

      if (limit) {
        sortedApprovalRequest = sortedApprovalRequest.slice(0, Number(limit));
      }

      if (sortedApprovalRequest.length < 1) {
        return response.status(200).json({
          status: 'OK',
          message: 'No investment approval request matched your search',
          data: null,
        });
      }

      return response.status(200).json({
        status: 'OK',
        data: sortedApprovalRequest.map((inv) => inv.$original),
      });
    } catch (error) {
      console.log(error);

      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt);
        const statusCode = error.codeSt ? error.codeSt : 500;
        return response.status(parseInt(statusCode)).json({
          status: 'FAILED',
          message: error.messages,
          hint: error.message,
        });
      }

      return response.status(500).json({
        status: 'FAILED',
        message: error.messages,
        hint: error.message,
      });
    }
  }

  public async activateApprovedInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    // try {
    //   // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
    //   const investments = await investmentsService.activateApprovedInvestment(request.qs(), loginUserData)
    //   // debugger

    //   if (investments.length > 0) {
    //     // console.log('Investment data after payout request line 2000:', investments)
    //     // debugger
    //     let investmentArray: any[] = [];
    //     for (let index = 0; index < investments.length; index++) {
    //       let currentInvestment = investments[index];
    //       let { id, wallet_id, user_id } = currentInvestment;
    //       currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
    //       investmentArray.push(currentInvestment);
    //       // debugger
    //     }
    //     return response.status(200).json({
    //       status: 'OK',
    //       data: investmentArray,//.map((inv) => inv.$original),
    //     })
    //     // END

    //   } else {
    //     // debugger
    //     return response.status(404).json({
    //       status: 'OK',
    //       message: 'No investment matched your search',
    //       data: null,
    //     })
    //   }
    // } catch (error) {
    //   console.log(error)
    //   // debugger
    //   console.log("Error line 2052", error.messages);
    //   console.log("Error line 2053", error.message);
    //   // debugger
    //   if (error.code === 'E_APP_EXCEPTION') {
    //     console.log(error.codeSt)
    //     let statusCode = error.codeSt ? error.codeSt : 500
    //     return response.status(parseInt(statusCode)).json({
    //       status: "FAILED",
    //       message: error.messages,
    //       hint: error.message
    //     });
    //   } else if (error.code === 'ETIMEDOUT') {
    //     console.log(error.codeSt)
    //     let statusCode = error.codeSt ? error.codeSt : 504
    //     return response.status(parseInt(statusCode)).json({
    //       status: "FAILED",
    //       message: error.messages,
    //       hint: error.message
    //     });
    //   } else if (error.message === 'FAILED TO DEBIT WALLET, ETIMEDOUT') {
    //     console.log(error.codeSt)
    //     let statusCode = error.codeSt ? error.codeSt : 504
    //     return response.status(parseInt(statusCode)).json({
    //       status: "FAILED",
    //       message: error.messages,
    //       hint: error.message
    //     });
    //   }

    //   return response.status(500).json({
    //     status: "FAILED",
    //     message: error.messages,
    //     hint: error.message
    //   });

    // }

    // REFACTORED
    try {
      const investments = await investmentsService.activateApprovedInvestment(request.qs(), loginUserData);

      if (investments.length > 0) {
        const investmentArray = await Promise.all(
          investments.map(async (investment) => {
            const { id, wallet_id, user_id } = investment;
            const updatedInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
            return updatedInvestment;
          })
        );
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,
        });
      } else {
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        });
      }
    } catch (error) {
      console.log(error);

      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt);
        const statusCode = error.codeSt ? error.codeSt : 500;
        return response.status(parseInt(statusCode)).json({
          status: 'FAILED',
          message: error.messages,
          hint: error.message,
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt);
        const statusCode = error.codeSt ? error.codeSt : 504;
        return response.status(parseInt(statusCode)).json({
          status: 'FAILED',
          message: error.messages,
          hint: error.message,
        });
      } else if (error.message === 'FAILED TO DEBIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt);
        const statusCode = error.codeSt ? error.codeSt : 504;
        return response.status(parseInt(statusCode)).json({
          status: 'FAILED',
          message: error.messages,
          hint: error.message,
        });
      }

      return response.status(500).json({
        status: 'FAILED',
        message: error.messages,
        hint: error.message,
      });
    }
  }

  public async collateMaturedInvestment01({ request, response }: HttpContextContract) {
    try {
      const timelineService = new TimelinesServices();
      const investmentsService = new InvestmentsServices();
      let { investmentId } = request.all()

      let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);

      if (investment && investment.$original.status == "active") {
        let { rfiCode } = investment.$original;
        // @ts-ignore
        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
        // console.log('Is due for payout status :', isDueForPayout)

        // TESTING
        let startDate = DateTime.now().minus({ days: 5 }).toISO()
        let duration = 4
        // console.log('Time investment was started line 1332: ', startDate)
        // let timelineObject
        let isDueForPayout = await dueForPayout(startDate, duration)
        // console.log('Is due for payout status line 1336:', isDueForPayout)
        // let amt = investment.amount
        const settingsService = new SettingsServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
        if (!settings) {
          throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
        }

        // if (isDueForPayout) {
        //   //  START
        //   let payload = investment.$original
        //   // send to Admin for approval
        //   let userId = payload.userId
        //   let investmentId = payload.id
        //   let walletId = payload.walletId
        //   let approvalStatus = payload.approvalStatus
        //   let requestType = 'payout_investment'
        //   // let  approvalStatus = 'approved'

        //   let approvalIsAutomated;// = settings.isTerminationAutomated
        //   // let approvalRequestIsExisting
        //   if (settings.isPayoutAutomated == false || approvalIsAutomated == undefined || approvalIsAutomated == false) {
        //     // approvalRequestIsExisting = await Approval.query().where({
        //     //   investment_id: investmentId,
        //     //   user_id: userId,
        //     //   request_type: requestType,
        //     //   //  approval_status: approvalStatus,
        //     // })

        //     // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
        //     // if (approvalRequestIsExisting.length < 1) {
        //     //   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
        //     //   console.log(' Approval request return line 1369 : ', approvalRequestIsDone)
        //     //   if (approvalRequestIsDone === undefined) {
        //     //     return response.status(400).json({
        //     //       status: 'OK',
        //     //       message: 'payout approval request was not successful, please try again.',
        //     //       data: null,
        //     //     })
        //     //   }
        //     // }
        //     const approvalsService = new ApprovalsServices()
        //     let approvalObject;

        //     // TODO: Send to the Admin for approval
        //     // update approvalObject
        //     approvalObject = {
        //       rfiCode: rfiCode,
        //       walletId: walletId,
        //       investmentId: investmentId,
        //       userId: userId,
        //       requestType: requestType,//"start_investment",
        //       approvalStatus: "pending",//approvalStatus,//"",
        //       assignedTo: "",//investment.assignedTo,
        //       processedBy: "",//investment.processedBy,
        //       // remark: "",
        //     };
        //     // console.log("ApprovalRequest object line 1194:", approvalObject);
        //     // check if the approval request is not existing
        //     let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalStatus);
        //     if (!approvalRequestIsExisting) {
        //       await approvalsService.createApproval(approvalObject);
        //       // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
        //       // console.log("new ApprovalRequest object line 1585:", newApprovalRequest);
        //     }

        //     // investment = await Investment.query().where('id', investmentId)
        //     investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
        //     investment.requestType = requestType
        //     investment.status = "matured"
        //     investment.approvalStatus = 'pending'

        //     // update timeline
        //     timelineObject = {
        //       id: uuid(),
        //       action: 'investment payout initiated',
        //       investmentId: investment.id,//id,
        //       walletId: investment.walletId,// walletId,
        //       userId: investment.userId,// userId,
        //       // @ts-ignore
        //       message: `${investment.firstName},your investment has just been sent for payout processing.`,
        //       adminMessage: `${investment.firstName}, investment was sent for payout processing.`,
        //       createdAt: DateTime.now(),
        //       metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
        //     }
        //     // console.log('Timeline object line 1429:', timelineObject)
        //     //  Push the new object to the array
        //     // timeline = investment.timeline
        //     // timeline.push(timelineObject)
        //     // console.log('Timeline object line 1433:', timeline)
        //     // stringify the timeline array
        //     await timelineService.createTimeline(timelineObject);
        //     // investment.timeline = JSON.stringify(timeline)
        //     // START

        //     // console.log('Updated investment Status line 1379: ', investment)
        //     // console.log('Payout investment data line 1380:', payload)
        //     payload.investmentId = investmentId
        //     payload.requestType = requestType

        //     let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
        //     // send for update
        //     // await investmentsService.updateInvestment(record, investment);
        //     await investmentsService.updateInvestment(record, investment);
        //     // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
        //     // console.log(" Current log, line 1655 :", updatedInvestment);
        //     // debugger
        //   } else if (settings.isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
        //     if (investment.status !== 'paid') {
        //       // update status of investment
        //       investment.requestType = requestType
        //       investment.approvalStatus = 'approved'
        //       investment.status = 'payout'
        //       investment.isPayoutAuthorized = true
        //       investment.isTerminationAuthorized = true
        //       // Save
        //       // await investment.save()
        //       let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
        //       // send for update
        //       await investmentsService.updateInvestment(record, investment);
        //       // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
        //       // console.log(" Current log, line 1672 :", updatedInvestment);
        //     }
        //     // Send notification
        //     // await investment.save()
        //     let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
        //     // send for update
        //     await investmentsService.updateInvestment(record, investment);
        //     // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
        //     // console.log(" Current log, line 1680 :", updatedInvestment);
        //   }

        //   // console.log('Investment data after payout request line 1683:', investment)
        //   return response.status(200).json({
        //     status: 'OK',
        //     data: investment//.map((inv) => inv.$original),
        //   })
        //   // END
        // }
        if (isDueForPayout) {
          const payload = investment.$original;
          const userId = payload.userId;
          const investmentId = payload.id;
          const walletId = payload.walletId;
          const approvalStatus = payload.approvalStatus;
          const requestType = 'payout_investment';

          const settingsService = new SettingsServices();
          const settings = await settingsService.getSettingBySettingRfiCode(rfiCode);

          if (!settings) {
            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`);
          }

          const approvalsService = new ApprovalsServices();
          let approvalObject;

          if (settings.isPayoutAutomated) {
            if (investment.status !== 'paid') {
              investment.requestType = requestType;
              investment.approvalStatus = 'approved';
              investment.status = 'payout';
              investment.isPayoutAuthorized = true;
              investment.isTerminationAuthorized = true;
              const record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
              await investmentsService.updateInvestment(record, investment);
            }
          } else {
            const approvalIsAutomated = settings.isInvestmentAutomated;
            if (approvalIsAutomated === undefined || approvalIsAutomated === false) {
              const approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalStatus);

              if (!approvalRequestIsExisting) {
                approvalObject = {
                  rfiCode: rfiCode,
                  walletId: walletId,
                  investmentId: investmentId,
                  userId: userId,
                  requestType: requestType,
                  approvalStatus: 'pending',
                  assignedTo: investment.assignedTo,
                  processedBy: investment.processedBy,
                };
                await approvalsService.createApproval(approvalObject);
              }

              investment.requestType = requestType;
              investment.status = 'matured';
              investment.approvalStatus = 'pending';
              const record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
              await investmentsService.updateInvestment(record, investment);

              const timelineObject = {
                id: uuid(),
                action: 'investment payout initiated',
                investmentId: investment.id,
                walletId: investment.walletId,
                userId: investment.userId,
                message: `${investment.firstName}, your investment has just been sent for payout processing.`,
                adminMessage: `${investment.firstName}, investment was sent for payout processing.`,
                createdAt: DateTime.now(),
                metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
              };
              await timelineService.createTimeline(timelineObject);
            } else if (approvalIsAutomated === true) {
              if (investment.status !== 'paid') {
                investment.requestType = requestType;
                investment.approvalStatus = 'approved';
                investment.status = 'payout';
                investment.isPayoutAuthorized = true;
                investment.isTerminationAuthorized = true;
                const record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
                await investmentsService.updateInvestment(record, investment);
              }
            }
          }

          const updatedInvestment = await investmentsService.getInvestmentByInvestmentId(investmentId);

          return response.status(200).json({
            status: 'OK',
            data: updatedInvestment.$original,
          });
        }
      } else {
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error);
      const statusCode = error.code === 'E_APP_EXCEPTION' ? error.codeSt || 500 : 500;
      const message = error.messages || error.message;
      const hint = error.message;
      return response.status(statusCode).json({
        status: 'FAILED',
        message,
        hint,
      });
    }

  }

  public async collateAboutToBeMatureInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.collateAboutToBeMatureInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          try {
            let { id, wallet_id, user_id } = currentInvestment;
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
            investmentArray.push(currentInvestment);
          } catch (error) {
            console.error(error);
            // Handle the error here
          }
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error);
      const statusCode = error.code === 'E_APP_EXCEPTION' ? error.codeSt || 500 : 500;
      const message = error.messages || error.message;
      const hint = error.message;
      return response.status(statusCode).json({
        status: 'FAILED',
        message,
        hint,
      });
    }
  }


  public async reactivateSuspendedPayoutInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.reactivateSuspendedPayoutInvestment(request.qs())
      // debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2427", error.messages);
      console.log("Error line 2428", error.message);
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


  public async reactivateSuspendedPayoutInvestmentByInvestmentId({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const { investmentId } = request.body();
      const investments = await investmentsService.reactivateSuspendedPayoutInvestmentByInvestmentId(investmentId, request.qs())
      // debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2427", error.messages);
      console.log("Error line 2428", error.message);
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

  public async reactivateSuspendedRolloverInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.reactivateSuspendedRolloverInvestment(request.qs())
      // debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2517", error.messages);
      console.log("Error line 2518", error.message);
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

  public async reactivateSuspendedRolloverInvestmentByInvestmentId({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const { investmentId } = request.body();
      const investments = await investmentsService.reactivateSuspendedRolloverInvestmentByInvestmentId(investmentId, request.qs())
      // debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2427", error.messages);
      console.log("Error line 2428", error.message);
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

  public async collateMaturedInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.collateMaturedInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2193", error.messages);
      console.log("Error line 2194", error.message);
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

  public async sumOfMaturedInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.sumOfMaturedInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger

        return response.status(200).json({
          status: 'OK',
          data: investments,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2418", error.messages);
      console.log("Error line 2419", error.message);
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

  public async sumOfActivatedInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.sumOfActivatedInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger

        return response.status(200).json({
          status: 'OK',
          data: investments,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 3048", error.messages);
      console.log("Error line 3049", error.message);
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

  // sum_of_paidout_investment
  public async sumOfPaidOutInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.sumOfPaidOutInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger

        return response.status(200).json({
          status: 'OK',
          data: investments,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 3098", error.messages);
      console.log("Error line 3099", error.message);
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

  public async sumOfYetToBePaidoutInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.sumOfYetToBePaidoutInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger

        return response.status(200).json({
          status: 'OK',
          data: investments,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 3148", error.messages);
      console.log("Error line 3149", error.message);
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

  // sum_of_liquidated_investment
  public async sumOfLiquidatedInvestment({ request, response }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      const investments = await investmentsService.sumOfLiquidatedInvestment(request.qs());
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger
      if (investments) {
        // console.log('Investment data after payout request line 2000:', investments)
        // debugger

        return response.status(200).json({
          status: 'OK',
          data: investments,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 3138", error.messages);
      console.log("Error line 3139", error.message);
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

  public async rolloverMaturedInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const investments = await investmentsService.rolloverMaturedInvestment(request.qs(), loginUserData);
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger

      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2386:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 3008", error.messages);
      console.log("Error line 3007", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO DEBIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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


  public async payoutMaturedInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const investments = await investmentsService.payoutMaturedInvestment(request.qs(), loginUserData);
      const totalSum = await investmentsService.getInvestmentsSum(request.qs());
      // debugger

      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2386:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
          totalSum,
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
          totalSum,
        })
      }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 3082", error.messages);
      console.log("Error line 3083", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO CREDIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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


  public async liquidateInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    const settingsService = new SettingsServices();
    const typesService = new TypesServices();
    // const approvalsService = new ApprovalsServices()
    const timelineService = new TimelinesServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const { investmentId } = request.body();
      // error: "TRANSACTION_LIMIT_EXCEEDED"
      // errorCode :  400
      // hint : "Request must be below transaction limit"
      // message : Transaction limit exceeded"
      // console.log("request",request.headers())
      //       request {
      //   host: '192.168.0.105:3333',
      //   connection: 'keep-alive',
      //   'content-length': '55',
      //   accept: 'application/json',
      //   authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIxTmhSZnY2VF9nVnRBaDdrcUxCODRKREVHMzRqSHZudHM0d0IzbEtzZ000In0.eyJleHAiOjE2ODg2NzQwNTMsImlhdCI6MTY4ODYzODA1MywianRpIjoiNjVmZTBmYTktNzc4Zi00Y2NkLTk2N2MtOTJiNTljZDk4M2ZlIiwiaXNzIjoiaHR0cDovLzE0NC4xMjYuMjE3LjI3OjkwOTAvYXV0aC9yZWFsbXMvYXBtZmIiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNWM3M2JjYTEtNmI1My00OGRkLTkwYzMtMjRhMWVjNTlkYjI4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoid2ViLWNsaWVudC1hcHAiLCJzZXNzaW9uX3N0YXRlIjoiYWMzYTljNmUtYjI1Yy00NGY4LTlmNDYtODQxNjA5YmU5NGE2IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiT2xhIE51ZWwiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJoYWJlZWJhYmlsaXR5QGdtYWlsLmNvbSIsImdpdmVuX25hbWUiOiJPbGEiLCJmYW1pbHlfbmFtZSI6Ik51ZWwiLCJlbWFpbCI6ImhhYmVlYmFiaWxpdHlAZ21haWwuY29tIn0.LBluu0qy4A-TxTGF0jplqC2gVA52eACC8RkCLChZMkBUPMDKMjN5i9Nz3XYUiAuzw1F5KVznEdkONIchvBanGxST0yIOjSgZ45eVtxHJX82EbhzynereI1dttofyVIdDNlvBtmEhqKPQqbV06Ua7jcIln4-xbSvXpRE3cvnGYfJu2R0YDHQP5x7zWWNwhye1Qv6Iqf42xIhAXkpIhFZJ7dLLts4T69fnfxI5tztkABuuRG17bjpMPuJbgPaHFCuTZpHvV1RWijlWDcPYTpTeyjvzhJWAJ2UsqlzZaNi9nKTZO09ooG54sRBRT0t9KxVkEtuCvL17m9ctdH7rZ0daqA',
      //   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',    
      //   'content-type': 'application/json',
      //   origin: 'http://localhost:8080',
      //   referer: 'http://localhost:8080/',
      //   'accept-encoding': 'gzip, deflate',
      //   'accept-language': 'en-US,en;q=0.9'
      // }
      debugger
      let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);//investment.$original
      // debugger
      // const { userId, walletId, rfiCode, investmentTypeId } = investment;
      const { userId, walletId, rfiCode, investmentTypeId } = investment;
      const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
      if (!settings) {
        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
      }
      // const { isPayoutAutomated, } = settings;
      const investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);
      const { isAutomated } = investmentTypeDetails;
      console.log("investmentTypeDetails isAutomated  ", isAutomated)
      // debugger
      // send to Admin for approval
      investment.requestType = 'liquidate_investment';
      investment.status = 'liquidation_approved';
      let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
      // send for update
      // await investmentsService.updateInvestment(record, investment);
      await investmentsService.updateInvestment(record, investment);
      // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
      // console.log(" Current log, line 3457 :", updatedInvestment);

      let timelineObject;
      debugger
      // if ((isPayoutAutomated === false && isAutomated === false) || (isPayoutAutomated === true && isAutomated === false)) {
      //   let approvalObject;

      //   // TODO: Send to the Admin for approval
      //   // update approvalObject
      //   approvalObject = {
      //     rfiCode: rfiCode,
      //     walletId: walletId,
      //     investmentId: investmentId,
      //     userId: userId,
      //     requestType: requestType,//"start_investment",
      //     approvalStatus: "pending",//approvalStatus,//"",
      //     assignedTo: "",//investment.assignedTo,
      //     processedBy: "",//investment.processedBy,
      //     // remark: "",
      //   };
      //   // console.log("ApprovalRequest object line 1194:", approvalObject);
      //   // check if the approval request is not existing
      //   // debugger
      //   let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
      //   if (!approvalRequestIsExisting) {
      //     debugger
      //     await approvalsService.createApproval(approvalObject);
      //     // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
      //     // console.log("new ApprovalRequest object line 1585:", newApprovalRequest);
      //   } else {
      //     approvalRequestIsExisting.requestType = approvalObject.requestType;
      //     approvalRequestIsExisting.approvalStatus = approvalObject.approvalStatus;
      //     approvalRequestIsExisting.save()
      //     debugger
      //   }
      //   debugger
      //   // investment = await Investment.query().where('id', investmentId)
      //   // investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
      //   investment.requestType = requestType
      //   // investment.status = "matured"
      //   investment.approvalStatus = 'pending'

      //   // update timeline
      //   timelineObject = {
      //     id: uuid(),
      //     action: 'investment liquidation initiated',
      //     investmentId: investment.id,//id,
      //     walletId: investment.walletId,// walletId,
      //     userId: investment.userId,// userId,
      //     // @ts-ignore
      //     message: `${investment.firstName},your investment has just been sent for liquidation processing.`,
      //     adminMessage: `${investment.firstName}, investment was sent for liquidation processing.`,
      //     createdAt: DateTime.now(),
      //     metadata: ``,
      //   }
      //   // console.log('Timeline object line 1429:', timelineObject)
      //   //  Push the new object to the array
      //   // timeline = investment.timeline
      //   // timeline.push(timelineObject)
      //   // console.log('Timeline object line 1433:', timeline)
      //   // stringify the timeline array
      //   await timelineService.createTimeline(timelineObject);
      //   // investment.timeline = JSON.stringify(timeline)
      //   // START
      //   debugger
      //   // console.log('Updated investment Status line 1379: ', investment)

      //   investment.requestType = requestType;
      //   // debugger
      //   let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
      //   // send for update
      //   // await investmentsService.updateInvestment(record, investment);
      //   await investmentsService.updateInvestment(record, investment);
      //   // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
      //   // console.log(" Current log, line 1655 :", updatedInvestment);
      //   debugger
      //   if (investment) {
      //     // console.log('Investment data after payout request line 2788:', investments)
      //     // debugger
      //     let investmentArray: any[] = [];
      //     // debugger
      //     let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
      //     // debugger
      //     investmentArray.push(currentInvestment);
      //     debugger

      //     return response.status(200).json({
      //       status: 'OK',
      //       data: investmentArray,
      //     })
      //     // END

      //   } else {
      //     // debugger
      //     return response.status(404).json({
      //       status: 'OK',
      //       message: 'No investment matched your search',
      //       data: null,
      //     })
      //   }
      // } else if ((isPayoutAutomated === true && isAutomated === true)) {


      // update timeline
      timelineObject = {
        id: uuid(),
        action: 'investment liquidation initiated',
        investmentId: investment.id,//id,
        walletId: investment.walletId,// walletId,
        userId: investment.userId,// userId,
        // @ts-ignore
        message: `${investment.firstName},your investment has just been sent for liquidation processing.`,
        adminMessage: `${investment.firstName}, investment was sent for liquidation processing.`,
        createdAt: DateTime.now(),
        metadata: ``,
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

      const investments = await investmentsService.liquidateInvestment(investmentId, request.qs(), loginUserData)
      
      debugger
      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2788:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
      // }


      // if (investments.length > 0) {
      //   // console.log('Investment data after payout request line 2788:', investments)
      //   // debugger
      //   let investmentArray: any[] = [];
      //   for (let index = 0; index < investments.length; index++) {
      //     let currentInvestment = investments[index];
      //     let { id, wallet_id, user_id } = currentInvestment;
      //     currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
      //     investmentArray.push(currentInvestment);
      //     debugger
      //   }
      //   return response.status(200).json({
      //     status: 'OK',
      //     data: investmentArray,//.map((inv) => inv.$original),
      //   })
      //   // END

      // } else {
      //   // debugger
      //   return response.status(404).json({
      //     status: 'OK',
      //     message: 'No investment matched your search',
      //     data: null,
      //   })
      // }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 2915", error.messages);
      console.log("Error line 2916", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO CREDIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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

  public async liquidateInvestmentWithSendApprovalToAdmin({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    const settingsService = new SettingsServices();
    const typesService = new TypesServices();
    const approvalsService = new ApprovalsServices()
    const timelineService = new TimelinesServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const { investmentId } = request.body();
      // error: "TRANSACTION_LIMIT_EXCEEDED"
      // errorCode :  400
      // hint : "Request must be below transaction limit"
      // message : Transaction limit exceeded"
      let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);//investment.$original
      // debugger
      const { userId, walletId, rfiCode, investmentTypeId } = investment;
      const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
      if (!settings) {
        throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
      }
      const { isPayoutAutomated, } = settings;
      const investmentTypeDetails = await typesService.getTypeByTypeId(investmentTypeId);
      const { isAutomated } = investmentTypeDetails;
      // debugger
      // send to Admin for approval
      let requestType = 'liquidate_investment';
      let timelineObject;
      debugger
      if ((isPayoutAutomated === false && isAutomated === false) || (isPayoutAutomated === true && isAutomated === false)) {
        let approvalObject;

        // TODO: Send to the Admin for approval
        // update approvalObject
        approvalObject = {
          rfiCode: rfiCode,
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
        // debugger
        let approvalRequestIsExisting = await approvalsService.getApprovalByInvestmentIdAndUserIdAndWalletIdAndRequestTypeAndApprovalStatus(investmentId, userId, walletId, requestType, approvalObject.approvalStatus);
        if (!approvalRequestIsExisting) {
          debugger
          await approvalsService.createApproval(approvalObject);
          // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
          // console.log("new ApprovalRequest object line 1585:", newApprovalRequest);
        } else {
          approvalRequestIsExisting.requestType = approvalObject.requestType;
          approvalRequestIsExisting.approvalStatus = approvalObject.approvalStatus;
          approvalRequestIsExisting.save()
          debugger
        }
        debugger
        // investment = await Investment.query().where('id', investmentId)
        // investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
        investment.requestType = requestType
        // investment.status = "matured"
        investment.approvalStatus = 'pending'

        // update timeline
        timelineObject = {
          id: uuid(),
          action: 'investment liquidation initiated',
          investmentId: investment.id,//id,
          walletId: investment.walletId,// walletId,
          userId: investment.userId,// userId,
          // @ts-ignore
          message: `${investment.firstName},your investment has just been sent for liquidation processing.`,
          adminMessage: `${investment.firstName}, investment was sent for liquidation processing.`,
          createdAt: DateTime.now(),
          metadata: ``,
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
        debugger
        // console.log('Updated investment Status line 1379: ', investment)

        investment.requestType = requestType;
        // debugger
        let record = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
        // send for update
        // await investmentsService.updateInvestment(record, investment);
        await investmentsService.updateInvestment(record, investment);
        // let updatedInvestment = await investmentsService.updateInvestment(record, investment);
        // console.log(" Current log, line 1655 :", updatedInvestment);
        debugger
        if (investment) {
          // console.log('Investment data after payout request line 2788:', investments)
          // debugger
          let investmentArray: any[] = [];
          // debugger
          let currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId);
          // debugger
          investmentArray.push(currentInvestment);
          debugger

          return response.status(200).json({
            status: 'OK',
            data: investmentArray,
          })
          // END

        } else {
          // debugger
          return response.status(404).json({
            status: 'OK',
            message: 'No investment matched your search',
            data: null,
          })
        }
      } else if ((isPayoutAutomated === true && isAutomated === true)) {
        const investments = await investmentsService.liquidateInvestment(investmentId, request.qs(), loginUserData)
        debugger
        if (investments.length > 0) {
          // console.log('Investment data after payout request line 2788:', investments)
          // debugger
          let investmentArray: any[] = [];
          for (let index = 0; index < investments.length; index++) {
            let currentInvestment = investments[index];
            let { id, wallet_id, user_id } = currentInvestment;
            currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
            investmentArray.push(currentInvestment);
            debugger
          }
          return response.status(200).json({
            status: 'OK',
            data: investmentArray,//.map((inv) => inv.$original),
          })
          // END

        } else {
          // debugger
          return response.status(404).json({
            status: 'OK',
            message: 'No investment matched your search',
            data: null,
          })
        }
      }


      // if (investments.length > 0) {
      //   // console.log('Investment data after payout request line 2788:', investments)
      //   // debugger
      //   let investmentArray: any[] = [];
      //   for (let index = 0; index < investments.length; index++) {
      //     let currentInvestment = investments[index];
      //     let { id, wallet_id, user_id } = currentInvestment;
      //     currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
      //     investmentArray.push(currentInvestment);
      //     debugger
      //   }
      //   return response.status(200).json({
      //     status: 'OK',
      //     data: investmentArray,//.map((inv) => inv.$original),
      //   })
      //   // END

      // } else {
      //   // debugger
      //   return response.status(404).json({
      //     status: 'OK',
      //     message: 'No investment matched your search',
      //     data: null,
      //   })
      // }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 2915", error.messages);
      console.log("Error line 2916", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO CREDIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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

  public async retryFailedPayoutOfMaturedInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const investments = await investmentsService.retryFailedPayoutOfMaturedInvestment(request.qs(), loginUserData)
      // debugger

      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2386:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 2672", error.messages);
      console.log("Error line 2673", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO CREDIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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

  public async retryFailedPayoutOfLiquidatedInvestment({ request, response, loginUserData }: HttpContextContract) {
    const investmentsService = new InvestmentsServices();
    try {
      // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
      const investments = await investmentsService.retryFailedPayoutOfLiquidatedInvestment(request.qs(), loginUserData)
      // debugger

      if (investments.length > 0) {
        // console.log('Investment data after payout request line 2386:', investments)
        // debugger
        let investmentArray: any[] = [];
        for (let index = 0; index < investments.length; index++) {
          let currentInvestment = investments[index];
          let { id, wallet_id, user_id } = currentInvestment;
          currentInvestment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(id, wallet_id, user_id);
          investmentArray.push(currentInvestment);
          // debugger
        }
        return response.status(200).json({
          status: 'OK',
          data: investmentArray,//.map((inv) => inv.$original),
        })
        // END

      } else {
        // debugger
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.log(error)
      // debugger
      console.log("Error line 3072", error.messages);
      console.log("Error line 3073", error.message);
      // debugger
      if (error.code === 'E_APP_EXCEPTION') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 500
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.code === 'ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
        return response.status(parseInt(statusCode)).json({
          status: "FAILED",
          message: error.messages,
          hint: error.message
        });
      } else if (error.message === 'FAILED TO CREDIT WALLET, ETIMEDOUT') {
        console.log(error.codeSt)
        let statusCode = error.codeSt ? error.codeSt : 504
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

  public async payout({ request, response }: HttpContextContract) {
    try {
      const timelineService = new TimelinesServices();
      const investmentsService = new InvestmentsServices();
      // @ts-ignore
      // let id = request.input('userId')
      let { userId, investmentId } = request.all()
      // console.log(
      //   'Params for update line 1318: ' + ' userId: ' + userId + ', investmentId: ' + investmentId
      // )
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      // let investment = await Investment.query().where('id', investmentId)
      let investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
      // console.log('Investment Info, line 1322: ', investment)
      // debugger
      if (investment) {
        // console.log('investment search data :', investment.$original)
        let { rfiCode, startDate, duration } = investment.$original;
        // @ts-ignore
        // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
        // console.log('Is due for payout status :', isDueForPayout)

        // TESTING
        // let startDate = DateTime.now().minus({ days: 5 }).toISO()
        // let duration = 4
        // console.log('Time investment was started line 1332: ', startDate)
        let timelineObject
        // let timeline
        let isDueForPayout = await dueForPayout(startDate, duration)
        // console.log('Is due for payout status line 1336:', isDueForPayout)
        // let amt = investment.amount
        const settingsService = new SettingsServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
        if (!settings) {
          throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
        }

        // console.log('Approval setting line 1339:', settings)
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
            //       status: 'OK',
            //       message: 'payout approval request was not successful, please try again.',
            //       data: null,
            //     })
            //   }
            // }
            const approvalsService = new ApprovalsServices()
            let approvalObject;

            // TODO: Send to the Admin for approval
            // update approvalObject
            approvalObject = {
              rfiCode: rfiCode,
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
              await approvalsService.createApproval(approvalObject);
              // let newApprovalRequest = await approvalsService.createApproval(approvalObject);
              // console.log("new ApprovalRequest object line 1585:", newApprovalRequest);
            }

            // investment = await Investment.query().where('id', investmentId)
            investment = await investmentsService.getInvestmentByInvestmentId(investmentId);
            investment.requestType = requestType
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
            if (investment.isRolloverActivated == true && investment.rolloverTarget > 0 && investment.rolloverTarget > investment.rolloverDone && investment.rolloverType !== "100") {
              // check type of rollover

              if (investment.rolloverType == "101") {

              } else if (investment.rolloverType == "102") {

              }
            } else {

            }

            // console.log('Investment payload data line 1399:', payload)
            // console.log(' investment.approvalStatus  line 1400:', investment.approvalStatus)
            // console.log(' investment.status line 1401:', investment.status)

            // END
            investment.status = 'active'
            investment.approvalStatus = 'pending'
            // Save
            await investment.save()
          } else if (settings.isPayoutAutomated == true || approvalIsAutomated !== undefined || approvalIsAutomated === true) {
            if (investment.status !== 'completed') {
              // update status of investment
              investment.requestType = requestType
              investment.approvalStatus = 'approved'
              investment.status = 'payout'
              investment.isPayoutAuthorized = true
              // investment.isTerminationAuthorized = true
              // Save
              await investment.save()
            }
            // Send notification

            // console.log('Updated investment Status line 1315: ', investment)
            // console.log('Payout investment data 1:', payload)
            payload.investmentId = investmentId
            payload.requestType = requestType
            // check if payout request is existing

            // update timeline
            timelineObject = {
              id: uuid(),
              action: 'investment payout approved',
              investmentId: investment.id,//id,
              walletId: investment.walletId,// walletId,
              userId: investment.userId,// userId,
              // @ts-ignore
              message: `${investment.firstName} investment has just been approved for payout.`,
              adminMessage: `${investment.firstName} investment was approved for payout.`,
              createdAt: DateTime.now(),
              metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
            }
            // console.log('Timeline object line 1562:', timelineObject)
            //  Push the new object to the array
            // timeline = investment.timeline
            // timeline.push(timelineObject)
            // console.log('Timeline object line 1566:', timeline)
            await timelineService.createTimeline(timelineObject);
            // Save
            await investment.save()
          }

          // console.log('Investment data after payout request line 1392:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment//.map((inv) => inv.$original),
          })
          // END
        } else {
          //  START
          // if the investment has not matured, i.e liquidated
          let payload = investment.$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'liquidate_investment'
          // let approvalStatus = 'approved'
          // let settings = await Setting.query().where({ tagName: 'default setting' })
          // console.log('Approval setting line 1241:', settings[0])
          let approvalRequestIsExisting
          let approvalIsAutomated //= settings[0].isTerminationAutomated // isPayoutAutomated
          if (approvalIsAutomated == undefined || approvalIsAutomated === false) {
            approvalRequestIsExisting = await Approval.query().where({
              investment_id: investmentId,
              user_id: userId,
              request_type: requestType,
              //  approval_status: approvalStatus,
            })
            // console.log('approvalRequestIsExisting line 1366: ', approvalRequestIsExisting)
            if (approvalRequestIsExisting.length < 1) {
              let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
              // console.log(' Approval request return line 1245 : ', approvalRequestIsDone)
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: 'OK',
                  message: 'termination approval request was not successful, please try again.',
                  data: null,
                })
              }
            }

            investment = await Investment.query().where('id', investmentId)
            investment.requestType = requestType
            payload.investmentId = investmentId
            payload.requestType = requestType
            // check if payout request is existing
            let payout
            let payoutRequestIsExisting = await Payout.query().where({
              investment_id: investmentId,
              user_id: userId,
            })
            // console.log(
            //   'Investment payout Request Is Existing data line 1264:',
            //   payoutRequestIsExisting
            // )
            if (
              payoutRequestIsExisting.length < 1 &&
              investment.approvalStatus === 'approved' &&
              investment.status === 'active'
            ) {
              // console.log('Payout investment data 1:', payload)
              // payload.timeline = JSON.stringify(investment.timeline)
              // console.log('Payout investment data line 1576:', payload)
              payout = await Payout.create(payload)
              payout.status = 'liquidated'
              await payout.save()
              // console.log('Liquidated Payout investment data line 1276:', payout)
            } else if (
              payoutRequestIsExisting.length > 0 &&
              investment.approvalStatus === 'approved' &&
              investment.status === 'active'
            ) {
              // console.log('Payout investment data 1:', payload)
              payout.status = 'liquidated'
              await payout.save()
              // console.log('Liquidated Payout investment data line 1285:', payout)
            }
            investment.status = 'active'
            investment.approvalStatus = 'pending'
            // Save
            await investment.save()
          } else if (approvalIsAutomated === true) {
            let payout
            investment.requestType = requestType
            // Save
            await investment.save()
            payload.investmentId = investmentId
            payload.requestType = requestType
            // check if payout request is existing
            let payoutRequestIsExisting = await Payout.query().where({
              investment_id: investmentId,
              user_id: userId,
            })
            // console.log(
            //   'Investment payout Request Is Existing data line 1304:',
            //   payoutRequestIsExisting
            // )
            if (
              payoutRequestIsExisting.length < 1 &&
              investment.approvalStatus === 'approved' &&
              investment.status === 'active'
            ) {
              // console.log('Payout investment data 1:', payload)
              // payload.timeline = JSON.stringify(investment.timeline)
              // console.log('Investment data line 1618:', payload)

              payout = await Payout.create(payload)
              payout.status = 'liquidated'
              await payout.save()
              // console.log('Liquidated Payout investment data line 1316:', payout)
            } else if (
              payoutRequestIsExisting.length > 0 &&
              investment.approvalStatus === 'approved' &&
              investment.status === 'active'
            ) {
              // console.log('Payout investment data 1:', payload)
              payout.status = 'liquidated'
              await payout.save()
              // console.log('Liquidated Payout investment data line 1325:', payout)
            }

            investment.status = 'liquidated'
            investment.approvalStatus = 'approved'
            investment.isPayoutAuthorized = true
            investment.isTerminationAuthorized = true
            await investment.save()
          }
          // update timeline
          timelineObject = {
            id: uuid(),
            action: 'investment termination initiated',
            investmentId: investment.id,//id,
            walletId: investment.walletId,// walletId,
            userId: investment.userId,// userId,
            // @ts-ignore
            message: `${investment.firstName} investment has just been sent for termination processing.`,
            adminMessage: `${investment.firstName} investment was sent for termination processing.`,
            createdAt: DateTime.now(),
            metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
          }
          // console.log('Timeline object line 1509:', timelineObject)
          //  Push the new object to the array
          // timeline = investment.timeline
          // timeline.push(timelineObject)

          // console.log('Timeline object line 1514:', timeline)
          await timelineService.createTimeline(timelineObject);
          // stringify the timeline array
          // investment.timeline = JSON.stringify(timeline)
          await investment.save()

          // console.log('Liquidated Payout investment data line 1521:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
          // END
        }
      } else {
        return response.status(404).json({
          status: 'OK',
          message: 'No investment matched your search',
          data: null,
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 2408", error.messages);
      console.log("Error line 2409", error.message);
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

  public async processPayment({ request, response }: HttpContextContract) {
    try {
      const timelineService = new TimelinesServices();
      const investmentsService = new InvestmentsServices();
      // @ts-ignore
      let { userId, walletId, investmentId } = request.all()
      // console.log(
      //   'Params for update line 1359: ' + ' userId: ' + userId + ', investmentId: ' + investmentId
      // )
      //  investment = await Investment.query().where({ id: investmentId, user_id: userId })
      let investment = await investmentsService.getInvestmentsByIdAndWalletIdAndUserId(investmentId, walletId, userId)
      if (!investment) throw Error(`Investment record with ID: ${investmentId} does not exist. Please try again. Thank you.`)
      if (investment) {
        let investmentData = investment
        let rolloverType = investment.rolloverType
        let amount = investment.amount
        let duration = investment.duration
        let investmentType = investment.investmentType
        let rolloverTarget = investment.rolloverTarget
        let rolloverDone = investment.rolloverDone
        // let currencyCode = investment.currencyCode
        let isTransactionSentForProcessing
        let payload
        // let payout
        let timelineObject
        // let timeline
        let settings = await Setting.query().where({ tagName: 'default setting' })
        // console.log('Approval setting line 1568:', settings[0])
        // console.log('Investment Info, line 1569: ', investment)
        if (
          (investment &&
            investment.isPayoutAuthorized === true &&
            investment.isTerminationAuthorized === true &&
            investment.requestType === 'payout_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'matured') ||
          (investment &&
            investment.isPayoutAuthorized === true &&
            investment.isTerminationAuthorized === false &&
            investment.requestType === 'payout_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'matured') ||
          (investment &&
            investment.isPayoutAuthorized === true &&
            investment.isTerminationAuthorized === true &&
            investment.requestType === 'payout_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'payout') ||
          (investment &&
            investment.isPayoutAuthorized === true &&
            investment.isTerminationAuthorized === false &&
            investment.requestType === 'payout_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'payout') ||
          (investment &&
            investment.isPayoutAuthorized === false &&
            investment.isTerminationAuthorized === true &&
            investment.requestType === 'liquidate_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'liquidated') ||
          (investment &&
            investment.isPayoutAuthorized === true &&
            investment.isTerminationAuthorized === true &&
            investment.requestType === 'liquidate_investment' &&
            investment.approvalStatus === 'approved' &&
            investment.status === 'liquidated')
        ) {
          // console.log('investment search data line 1596 :', investment.$original)
          // debugger
          // @ts-ignore
          // let isDueForPayout = await dueForPayout(investment.startDate, investment.duration)
          // console.log('Is due for payout status :', isDueForPayout)

          // let payoutIsApproved = true
          // Notify
          if (
            investment.isPayoutAuthorized === true ||
            investment.isTerminationAuthorized === true
          ) {
            // Check Rollover Type
            // let rolloverType = investment.rolloverType
            // let amount = investment.amount
            // let duration = investment.duration
            // let investmentType = investment.investmentType
            // let rolloverTarget = investment.rolloverTarget
            // let rolloverDone = investment.rolloverDone
            // let currencyCode = investment.currencyCode
            // let isTransactionSentForProcessing
            if (rolloverType === '100') {
              // Save the payment data in payout table
              payload = investmentData
              console.log('Payout investment data line 1619:', payload)
              // payout = await Payout.create(payload)
              // payout.status = 'matured'
              // await payout.save()
              // console.log('Matured Payout investment data line 1235:', payout)

              // check if payout request is existing
              // let payoutRequestIsExisting = await Payout.query().where({
              //   investment_id: investmentId,
              //   user_id: userId,
              // })
              // console.log(
              //   'Investment payout Request Is Existing data line 1631:',
              //   payoutRequestIsExisting
              // )

              // if (
              //   payoutRequestIsExisting.length < 1 && investment.approvalStatus != 'pending' &&
              //   investment.status != 'initiated'
              //   // investment.requestType !== 'start_investment' &&

              // ) {
              //   // console.log('Payout investment data line 1781:', payload)
              //   // payload.timeline = JSON.stringify(investment.timeline)
              //   // console.log('Payout investment data line 1783:', payload)

              //   // payout = await Payout.create(payload)
              //   // payout.status = 'payout'
              //   // await payout.save()
              //   // console.log('Matured Payout investment data line 1788:', payout)
              // } else {
              //   payoutRequestIsExisting[0].requestType = 'payout_investment'
              //   payoutRequestIsExisting[0].approvalStatus = 'approved'
              //   payoutRequestIsExisting[0].status = 'payout'
              //   investment.status = 'payout'
              //   // Save
              //   await payoutRequestIsExisting[0].save()
              // }

              // If payment processing is automated
              let paymentProcessingIsAutomated = settings[0].isPayoutAutomated
              if (paymentProcessingIsAutomated === true) {
                //  Proceed to payout the Total Amount due on maturity
                investment.requestType = 'payout payment'
                investment.approvalStatus = 'approved'
                investment.status = 'payout'
                investment.save()
                // Send Payment Details to Transaction Service
                // use try catch
                try {
                  // TODO
                  // Update with the real transaction service endpoint and payload
                  let rate = await sendPaymentDetails(amount, duration, investmentType)
                  console.log(' Rate return line 1669 : ', rate)
                } catch (error) {
                  console.error(error)
                  return response.send({
                    status: 'FAILED',
                    message: 'The transaction was not sent successfully.',
                    error: error.message,
                  })

                }
                // Update with the appropriate endpoint and data
                isTransactionSentForProcessing = true
                if (isTransactionSentForProcessing === false) {
                  return response.send({
                    status: 'FAILED',
                    message: 'The transaction was not sent successfully.',
                    isTransactionInProcess: isTransactionSentForProcessing,
                  })
                }
                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: 'investment payment initiated',
                  investmentId: investment.id,//id,
                  walletId: investment.walletId,// walletId,
                  userId: investment.userId,// userId,
                  // @ts-ignore
                  message: `${investment.firstName} investment has just been sent for payment processing.`,
                  adminMessage: `${investment.firstName} investment was sent for payment processing.`,
                  createdAt: DateTime.now(),
                  metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                }
                // console.log('Timeline object line 1696:', timelineObject)
                //  Push the new object to the array
                // timeline = investment.timeline
                // timeline.push(timelineObject)

                // console.log('Timeline object line 1701:', timeline)

                // stringify the timeline array
                // investment.timeline = JSON.stringify(timeline)
                await timelineService.createTimeline(timelineObject);

                return response.send({
                  status: 'OK',
                  message:
                    'No Rollover was set on this investment, but the transaction was sent successfully for payment processing.',
                  isTransactionInProcess: isTransactionSentForProcessing,
                  data: investment.$original,
                })
              } else {
                let requestType = 'payout payment'
                let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
                // console.log(' Approval request return line 1717 : ', approvalRequestIsDone)
                if (approvalRequestIsDone === undefined) {
                  return response.status(400).json({
                    status: 'OK',
                    message:
                      'payment processing approval request was not successful, please try again.',
                    data: null,
                  })
                }
                // investment = await Investment.query().where('id', investmentId)
                investment.requestType = requestType
                investment.status = 'payout'
                investment.approvalStatus = 'pending'

                // update timeline
                timelineObject = {
                  id: uuid(),
                  action: 'investment termination initiated',
                  investmentId: investment.id,//id,
                  walletId: investment.walletId,// walletId,
                  userId: investment.userId,// userId,
                  // @ts-ignore
                  message: `${investment.firstName} investment has just been sent for termination processing.`,
                  adminMessage: `${investment.firstName} investment was sent for termination processing.`,
                  createdAt: DateTime.now(),
                  metadata: `amount to payout: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
                }
                // console.log('Timeline object line 1740:', timelineObject)
                //  Push the new object to the array
                // timeline = investment.timeline
                // timeline.push(timelineObject)
                // console.log('Timeline object line 1744:', timeline)
                await timelineService.createTimeline(timelineObject);
                // stringify the timeline array
                // investment.timeline = JSON.stringify(timeline)
                // Save


                // TODO
                // Update with the appropriate endpoint and data

                return response.send({
                  status: 'OK',
                  message:
                    'No Rollover was set on this investment, but the transaction was sent successfully for payment processing approval.',
                  isTransactionInProcess: isTransactionSentForProcessing,
                  data: investment.$original,
                })
              }
            } else {
              // If the investment has rollover
              // Check RollOver Target
              /**
               * .enum('rollover_type', ['100' = 'no rollover',
               *  '101' = 'rollover principal only',
               * '102' = 'rollover principal with interest',
               * '103' = 'rollover interest only'])
               */

              // console.log(
              //   'Data for line 1542: ',
              //   rolloverType,
              //   amount,
              //   duration,
              //   investmentType,
              //   rolloverTarget,
              //   rolloverDone
              // )
              //  function for effecting the set rollover
              const effectRollover = async (
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              ) => {
                return new Promise(async (resolve, reject) => {
                  // console.log(
                  //   'Datas line 1562 : ',
                  //   investmentData,
                  //   amount,
                  //   rolloverType,
                  //   rolloverDone,
                  //   rolloverTarget
                  // )
                  if (!investmentData || rolloverTarget < 0) {
                    reject(
                      new Error(
                        'Incomplete parameters , or no rollover target was set, or is less than allowed range'
                      )
                    )
                  }
                  let amountToPayoutNow
                  let amountToBeReinvested
                  let timelineObject
                  // let timeline
                  let rolloverIsSuccessful
                  let settings = await Setting.query().where({ tagName: 'default setting' })
                  // console.log('Approval setting line 2081:', settings[0])
                  if (rolloverDone >= rolloverTarget) {
                    let payload = investmentData
                    let investmentId = payload.id
                    userId = payload.userId
                    let requestType = 'payout_investment'
                    amountToPayoutNow = amount + investmentData.interestDueOnInvestment
                    // Send Investment Initiation Message to Queue
                    payload = investmentData;
                    let isPayoutAutomated = settings[0].isPayoutAutomated
                    if (isPayoutAutomated === false) {
                      try {
                        let approvalRequestIsDone = await approvalRequest(
                          userId,
                          investmentId,
                          requestType
                        )
                        // console.log(' Approval request return line 1672 : ', approvalRequestIsDone)
                        if (approvalRequestIsDone === undefined) {
                          return response.status(400).json({
                            status: 'OK',
                            message:
                              'payment processing approval request was not successful, please try again.',
                            data: null,
                          })
                        }
                      } catch (error) {
                        console.error(error)
                        return response.send({
                          status: 'FAILED',
                          message:
                            'The approval request for this transaction was not sent successfully.',
                          error: error.message,
                        })
                      }

                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: 'investment payment approval initiated',
                        // @ts-ignore
                        investmentId: investmentData.id,//id,
                        // @ts-ignore
                        walletId: investmentData.walletId,// walletId,
                        // @ts-ignore
                        userId: investmentData.userId,// userId,
                        // @ts-ignore
                        message: `${investmentData.firstName} investment has just been sent for payment processing approval.`,
                        adminMessage: `${investmentData.firstName} investment was sent for payment processing approval.`,
                        createdAt: DateTime.now(),
                        // @ts-ignore
                        metadata: `amount to payout: ${investmentData.totalAmountToPayout}, request type : ${investmentData.requestType}`,
                      }
                      // console.log('Timeline object line 2168:', timelineObject)
                      //  Push the new object to the array
                      // timeline = investment.timeline
                      // timeline.push(timelineObject)
                      // console.log('Timeline object line 2173:', timeline)
                      // stringify the timeline array
                      await timelineService.createTimeline(timelineObject);
                      // investment.timeline = JSON.stringify(timeline)


                      return response.send({
                        status: 'OK',
                        message:
                          'Rollover target has been reached or exceeded, and the investment details has been sent to admin for payout approval.',
                        data: investmentData.$original,
                      })
                    } else {
                      try {
                        // TODO
                        // Send Payment details to Transaction Service
                        // Update with the real transaction service endpoint and payload
                        let rate = await sendPaymentDetails(amount, duration, investmentType)
                        console.log(' Rate return line 2190 : ', rate)
                      } catch (error) {
                        console.error(error)
                        return response.send({
                          status: 'FAILED',
                          message: 'The transaction was not sent successfully.',
                          error: error.message,
                        })
                      }
                      isTransactionSentForProcessing = true
                      if (isTransactionSentForProcessing === false) {
                        return response.send({
                          status: 'FAILED',
                          message: 'The transaction was not sent successfully.',
                          isTransactionInProcess: isTransactionSentForProcessing,
                        })
                      }
                      //}
                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: 'investment payout initiated',
                        investmentId: investmentData.id,//id,
                        walletId: investmentData.walletId,// walletId,
                        userId: investmentData.userId,// userId,
                        // @ts-ignore
                        message: `${investmentData.firstName} investment has just been sent for payment processing.`,
                        adminMessage: `${investmentData.firstName} investment was sent for payment processing.`,
                        createdAt: DateTime.now(),
                        metadata: `amount to payout: ${investmentData.totalAmountToPayout}, request type : ${investmentData.requestType}`,
                      }
                      // console.log('Timeline object line 2217:', timelineObject)
                      //  Push the new object to the array
                      // timeline = investment.timeline
                      // timeline.push(timelineObject)
                      // console.log('Timeline object line 2221:', timeline)
                      await timelineService.createTimeline(timelineObject);
                      // stringify the timeline array
                      // investment.timeline = JSON.stringify(timeline)

                      return response.send({
                        status: 'OK',
                        message:
                          'Rollover target has been reached or exceeded, and payout of the sum total of your principal and interest has been initiated.',
                        data: investmentData.$original,
                      })
                    }
                  }
                  // if rolloverDone < rolloverTarget
                  investmentData = investment
                  let payload = investmentData
                  // console.log('Payload line 1969 :', payload)
                  let payloadDuration = investmentData.duration
                  let payloadInvestmentType = investmentData.investmentType
                  // A function for creating new investment
                  // const createInvestment = async (
                  //   payloadAmount,
                  //   payloadDuration,
                  //   payloadInvestmentType,
                  //   investmentData
                  // ) => {
                  //   console.log('Investment data line 1713: ', investmentData)
                  //   console.log('Investment payloadAmount data line 1714: ', payloadAmount)
                  //   console.log('Investment payloadDuration data line 1715: ', payloadDuration)
                  //   console.log(
                  //     'Investment payloadInvestmentType data line 1717: ',
                  //     payloadInvestmentType
                  //   )

                  //   console.log(
                  //     ' The Rate return for RATE line 2274: ',
                  //     await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
                  //   )
                  //   let rate = await investmentRate(
                  //     payloadAmount,
                  //     payloadDuration,
                  //     payloadInvestmentType
                  //   )
                  //   console.log(' Rate return line 2282 : ', rate)
                  //   if (rate === undefined) {
                  //     return response.status(400).json({
                  //       status: 'OK',
                  //       message: 'No investment rate matched your search, please try again.',
                  //       data: null,
                  //     })
                  //   }
                  //   let settings = await Setting.query().where({ tagName: 'default setting' })
                  //   console.log('Approval setting line 2291:', settings[0])
                  //   let payload
                  //   // destructure / extract the needed data from the investment
                  //   let {
                  //     amount,
                  //     rolloverType,
                  //     rolloverTarget,
                  //     rolloverDone,
                  //     investmentType,
                  //     duration,
                  //     userId,
                  //     tagName,
                  //     currencyCode,
                  //     long,
                  //     lat,
                  //     walletHolderDetails,
                  //   } = investmentData
                  //   // copy the investment data to payload
                  //   payload = {
                  //     amount,
                  //     rolloverType,
                  //     rolloverTarget,
                  //     rolloverDone,
                  //     investmentType,
                  //     duration,
                  //     userId,
                  //     tagName,
                  //     currencyCode,
                  //     long,
                  //     lat,
                  //     walletHolderDetails,
                  //   }
                  //   payload.amount = payloadAmount
                  //   //  payload.interestRate = rate
                  //   console.log('PAYLOAD line 2325 :', payload)

                  //   const investment = await Investment.create(payload)
                  //   investment.interestRate = rate

                  //   // When the Invest has been approved and activated
                  //   let investmentAmount = investment.amount
                  //   let investmentDuration = investment.duration
                  //   let amountDueOnPayout = await interestDueOnPayout(
                  //     investmentAmount,
                  //     rate,
                  //     investmentDuration
                  //   )
                  //   // @ts-ignore
                  //   investment.interestDueOnInvestment = amountDueOnPayout
                  //   // @ts-ignore
                  //   investment.totalAmountToPayout = investment.amount + amountDueOnPayout
                  //   // @ts-ignore
                  //   investment.walletId = investment.investorFundingWalletId
                  //   await investment.save()
                  //   console.log('The new Reinvestment, line 2345 :', investment)

                  //   await investment.save()
                  //   let newInvestmentId = investment.id
                  //   // @ts-ignore
                  //   let newInvestmentEmail = investment.email

                  //   // Send Investment Initiation Message to Queue

                  //   // check if Approval is set to Auto, from Setting Controller
                  //   let requestType = 'start_investment'
                  //   let approvalIsAutomated = settings[0].isInvestmentAutomated
                  //   if (approvalIsAutomated === false) {
                  //     // Send Approval Request to Admin
                  //     userId = investment.userId
                  //     let investmentId = investment.id
                  //     // let requestType = 'start_investment'
                  //     let approval = await approvalRequest(userId, investmentId, requestType)
                  //     console.log(' Approval request return line 2362 : ', approval)
                  //     if (approval === undefined) {
                  //       return response.status(400).json({
                  //         status: 'OK',
                  //         message:
                  //           'investment approval request was not successful, please try again.',
                  //         data: null,
                  //       })
                  //     }
                  //     // update timeline
                  //     timelineObject = {
                  //       id: uuid(),
                  //       action: 'investment initiated',
                  //   investmentId: investment.id,//id,
                  // walletId: investment.walletId,// walletId,
                  // userId: investment.userId,// userId,
                  //       // @ts-ignore
                  //       message: `${investment.firstName} investment has just been sent for activation approval.`,
                  //       adminMessage: `${investment.firstName} investment was sent for activation approval.`,
                  //       createdAt: DateTime.now(),
                  //       metadata: `amount invested: ${investment.amount}, request type : ${requestType}`,
                  //     }
                  //     console.log('Timeline object line 2380:', timelineObject)
                  //     //  Push the new object to the array
                  //      console.log('Timeline array line 2382:', investment.timeline)
                  //     //  create a new timeline array
                  //     timeline =  []
                  //     timeline.push(timelineObject)
                  //     console.log('Timeline object line 2384:', timeline)
                  //     // stringify the timeline array
                  //     investment.timeline = JSON.stringify(timeline)
                  //     console.log('Timeline array line 2389:', investment.timeline)
                  //     // Save
                  //     await investment.save()

                  //     // Send to Notification Service
                  //     // New investment initiated
                  //     Event.emit('new:investment', {
                  //       id: newInvestmentId,
                  //       email: newInvestmentEmail,
                  //     })
                  //   } else if (approvalIsAutomated === true) {
                  //     // TODO
                  //     // If Approval is automated
                  //     // Send Investment Payload To Transaction Service and await response
                  //     let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
                  //     console.log(' Feedback from Transaction service: ', sendToTransactionService)
                  //     if (sendToTransactionService === 'OK') {
                  //       // Activate the investment
                  //       investment.requestType = requestType
                  //       investment.status = 'active'
                  //       investment.approvalStatus = 'approved'
                  //       investment.startDate = DateTime.now() //.toISODate()
                  //       investment.payoutDate = DateTime.now().plus({
                  //         days: parseInt(investmentDuration),
                  //       })
                  //       // update timeline
                  //       timelineObject = {
                  //         id: uuid(),
                  //         action: 'investment activated',
                  // investmentId: investment.id,//id,
                  //   walletId: investment.walletId,// walletId,
                  //     userId: investment.userId,// userId,
                  //         // @ts-ignore
                  //         message: `${investment.firstName} investment has just been activated.`,
                  //         adminMessage: `${investment.firstName} investment was activated.`,
                  //         createdAt: DateTime.now(),
                  //         metadata: `amount invested: ${investment.amount}, request type : ${investment.requestType}`,
                  //       }
                  // console.log('Timeline object line 2422:', timelineObject)
                  //       //  Push the new object to the array
                  // timeline = [] //JSON.parse(investment.timeline)
                  // timeline.push(timelineObject)
                  // console.log('Timeline object line 2426:', timeline)
                  // await timelineService.createTimeline(timelineObject);
                  //       // stringify the timeline array
                  //       investment.timeline = JSON.stringify(timeline)
                  //       // Save
                  //       await investment.save()
                  //       const requestUrl = Env.get('CERTIFICATE_URL') //+ investment.id
                  //       await new PuppeteerServices(requestUrl, {
                  //         paperFormat: 'a3',
                  //         fileName: `${investment.requestType}_${investment.id}`,
                  //       })
                  //         .printAsPDF(investment)
                  //         .catch((error) => console.error(error))
                  //       console.log(
                  //         'Investment Certificate generated, URL, line 2439: ',
                  //         requestUrl
                  //       )
                  //       // save the certicate url
                  //       investment.certificateUrl = requestUrl
                  //       await investment.save()
                  //       // Send to Notification Service
                  //       // New Investment Initiated and Activated
                  //       Event.emit('new:investment', {
                  //         id: newInvestmentId,
                  //         email: newInvestmentEmail,
                  //       })
                  //     }
                  //   }
                  //   return response.status(201).json({ status: 'OK', data: investment.$original })
                  //   // END
                  // }
                  // let payout
                  // let newTimeline: any[] = []
                  let rate

                  switch (rolloverType) {
                    case '101':
                      //'101' = 'rollover principal only',
                      amountToBeReinvested = amount
                      payloadDuration = investmentData.duration
                      payloadInvestmentType = investmentData.investmentType
                      amountToPayoutNow = investmentData.interestDueOnInvestment
                      // investment.amount = amountToBeReinvested
                      investmentData.totalAmountToPayout = amountToPayoutNow
                      rolloverDone = rolloverDone + 1
                      investmentData.rolloverTarget = rolloverTarget
                      investmentData.rolloverDone = rolloverDone

                      investmentData = investment
                      // Save the payment data in payout table
                      payload = investmentData
                      // console.log('Matured Payout investment data line 2477:', payload)

                      // send payment details to transction service

                      // Send Notification

                      // console.log(
                      //   ' The Rate return for RATE line 2491: ',
                      //   await investmentRate(
                      //     amountToBeReinvested,
                      //     payloadDuration,
                      //     payloadInvestmentType
                      //   )
                      // )
                      rate = await investmentRate(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType
                      )
                      // console.log(' Rate return line 2503 : ', rate)
                      if (rate === undefined) {
                        //  send the money to the investor wallet
                        // console.log(
                        //   `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was No investment product that matched your request.`
                        // )
                        // update timeline
                        timelineObject = {
                          id: uuid(),
                          action: 'matured investment payout',
                          investmentId: investmentData.id,//id,
                          walletId: investmentData.walletId,// walletId,
                          userId: investmentData.userId,// userId,
                          // @ts-ignore
                          message: `${investmentData.firstName} payment on investment has just been sent.`,
                          adminMessage: `${investmentData.firstName} payment on investment was sent.`,
                          createdAt: DateTime.now(),
                          metadata: `amount invested: ${investmentData.amount},amount paid: ${investmentData.interestDueOnInvestment + investmentData.amount
                            }, request type : ${investmentData.requestType}`,
                        }
                        await timelineService.createTimeline(timelineObject);
                        // console.log('Timeline object line 2518:', timelineObject)
                        //  Push the new object to the array
                        // newTimeline = JSON.parse(investment.timeline)
                        // newTimeline = investment.timeline
                        // newTimeline.push(timelineObject)
                        // console.log('Timeline object line 2522:', newTimeline)
                        // stringify the timeline array
                        // investment.timeline = JSON.stringify(newTimeline)
                        // Save

                        rolloverIsSuccessful = false
                        break

                        // return response.status(400).json({
                        //   status: 'OK',
                        //   message: 'No investment rate matched your search, please try again.',
                        //   data: null,
                        // })
                      }
                      // initiate a new investment
                      var isNewInvestmentCreated = await createNewInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      )
                      // console.log('new investment is created: ', isNewInvestmentCreated)
                      if (isNewInvestmentCreated === undefined) {
                        // send the money to the user
                        // send payment details to transction service
                        // Send Notification
                        rolloverIsSuccessful = false
                        break
                        //  return response.status(404).json({
                        //    status: 'FAILED',
                        //    message: 'reinvestment was not successful, please try again',
                        //    data: [
                        //      amountToBeReinvested,
                        //      payloadDuration,
                        //      payloadInvestmentType,
                        //      investmentData,
                        //    ],
                        //  })
                        // break
                      }
                      // console.log(
                      //   `Principal of ${currencyCode} ${amountToBeReinvested} was Reinvested and the interest of ${currencyCode} ${amountToPayoutNow} was paid`
                      // )
                      // update timeline
                      timelineObject = {
                        id: uuid(),
                        action: 'matured investment payout',
                        investmentId: investmentData.id,//id,
                        walletId: investmentData.walletId,// walletId,
                        userId: investmentData.userId,// userId,
                        // @ts-ignore
                        message: `${investmentData.firstName} payment on investment has just been sent.`,
                        adminMessage: `${investmentData.firstName} payment on investment was sent.`,
                        createdAt: DateTime.now(),
                        metadata: `amount reinvested: ${investmentData.amount},amount paid: ${investmentData.totalAmountToPayout}, request type : ${investmentData.requestType}`,
                      }
                      // console.log('Timeline object line 2554:', timelineObject)

                      await timelineService.createTimeline(timelineObject);

                      rolloverIsSuccessful = true
                      break
                    case '102':
                      // '102' = 'rollover principal plus interest',
                      amountToBeReinvested = amount + investmentData.interestDueOnInvestment
                      payloadDuration = investmentData.duration
                      payloadInvestmentType = investmentData.investmentType
                      //  investment.amount = amountToBeReinvested
                      investmentData.totalAmountToPayout = 0
                      amountToPayoutNow = investmentData.totalAmountToPayout
                      rolloverDone = rolloverDone + 1
                      investmentData.rolloverTarget = rolloverTarget
                      investmentData.rolloverDone = rolloverDone

                      investmentData = investment
                      // Save the payment data in payout table
                      payload = investmentData
                      // send payment details to transction service

                      // Send Notification

                      // console.log(
                      //   ' The Rate return for RATE line 2591: ',
                      //   await investmentRate(
                      //     amountToBeReinvested,
                      //     payloadDuration,
                      //     payloadInvestmentType
                      //   )
                      // )
                      rate = await investmentRate(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType
                      )
                      // console.log(' Rate return line 2603 : ', rate)
                      if (rate === undefined) {
                        //  send the money to the investor wallet
                        // console.log(
                        //   `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was no investment product that matched your request.`
                        // )
                        // update timeline
                        timelineObject = {
                          id: uuid(),
                          action: 'matured investment payout',
                          investmentId: investmentData.id,//id,
                          walletId: investmentData.walletId,// walletId,
                          userId: investmentData.userId,// userId,
                          // @ts-ignore
                          message: `${investmentData.firstName} payment on investment has just been sent.`,
                          adminMessage: `${investmentData.firstName} payment on investment was sent.`,
                          createdAt: DateTime.now(),
                          metadata: `amount paid back to wallet: ${amountToBeReinvested},interest: ${investmentData.totalAmountToPayout}, request type : ${investmentData.requestType}`,
                        }
                        // console.log('Timeline object line 2618:', timelineObject)
                        // //  Push the new object to the array
                        // newTimeline = JSON.parse(investment.timeline)
                        // // newTimeline = investment.timeline
                        // newTimeline.push(timelineObject)
                        // console.log('Timeline object line 2622:', newTimeline)
                        // // stringify the timeline array
                        // investment.timeline = JSON.stringify(newTimeline)
                        await timelineService.createTimeline(timelineObject);

                        rolloverIsSuccessful = false
                        break
                        // return response.status(400).json({
                        //   status: 'OK',
                        //   message: 'No investment rate matched your search, please try again.',
                        //   data: null,
                        // })
                      }

                      // initiate a new investment
                      isNewInvestmentCreated = await createNewInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      )
                      // console.log('new investment is created 2628: ', isNewInvestmentCreated)
                      if (isNewInvestmentCreated === undefined) {
                        // send the money to the user
                        // send payment details to transction service
                        // Send Notification

                        rolloverIsSuccessful = false
                        break
                        // return response.status(404).json({
                        //   status: 'FAILED',
                        //   message: 'reinvestment was not successful, please try again',
                        //   data: [
                        //     amountToBeReinvested,
                        //     payloadDuration,
                        //     payloadInvestmentType,
                        //     investmentData,
                        //   ],
                        // })
                        // break
                      }

                      // console.log(
                      //   `The Sum Total of the Principal and the interest of ${currencyCode} ${amountToBeReinvested} was Reinvested`
                      // )
                      // update timeline

                      timelineObject = {
                        id: uuid(),
                        action: 'matured investment payout',
                        investmentId: investmentData.id,//id,
                        walletId: investmentData.walletId,// walletId,
                        userId: investmentData.userId,// userId,
                        // @ts-ignore
                        message: `${investmentData.firstName} payment for matured investment has just been sent.`,
                        adminMessage: `${investmentData.firstName} payment for matured investment was sent.`,
                        createdAt: DateTime.now(),
                        metadata: `amount paid: ${investmentData.totalAmountToPayout},amount reinvested: ${amountToBeReinvested}, request type : ${investmentData.requestType}`,
                      }
                      // console.log('Timeline object line 2686:', timelineObject)
                      // //  Push the new object to the array
                      // console.log('Timeline object line 2688:', investment.timeline)
                      // newTimeline = JSON.parse(investment.timeline)
                      // console.log('Timeline object line 2690:', newTimeline)
                      // newTimeline.push(timelineObject)
                      // console.log('Timeline object line 2692:', newTimeline)
                      // // stringify the timeline array
                      // investment.timeline = JSON.stringify(newTimeline)
                      await timelineService.createTimeline(timelineObject);

                      rolloverIsSuccessful = true
                      break
                    // case '103':
                    //   // '103' = 'rollover interest only'
                    //   amountToBeReinvested = investment.interestDueOnInvestment
                    //   amountToPayoutNow = amount
                    //   payloadDuration = investment.duration
                    //   payloadInvestmentType = investment.investmentType
                    //   investment.amount = amountToBeReinvested
                    //   investment.totalAmountToPayout = amountToPayoutNow
                    //   rolloverDone = rolloverDone + 1
                    //   investment.rolloverTarget = rolloverTarget
                    //   investment.rolloverDone = rolloverDone
                    //   await investment.save()
                    //   investmentData = investment
                    //   // Save the payment data in payout table
                    //   payload = investmentData
                    //   console.log('Payout investment data line 1941:', payload)
                    //   payout = await Payout.create(payload)
                    //   payout.status = 'payout'
                    //   await payout.save()
                    //   console.log('Matured Payout investment data line 1945:', payout)
                    //   // send payment details to transction service

                    //   // Send Notification

                    //   // initiate a new investment
                    //   investmentCreated = await createInvestment(
                    //     amountToBeReinvested,
                    //     payloadDuration,
                    //     payloadInvestmentType,
                    //     investmentData
                    //   )
                    //   console.log('investmentCreated data line 1990:', investmentCreated)
                    //   if (investmentCreated === undefined) {
                    //     // send the money to the user
                    //     // send payment details to transction service
                    //     // Send Notification
                    // return response.status(404).json({
                    //   status: 'FAILED',
                    //   message: 'reinvestment was not successful, please try again',
                    //   data: [
                    //     amountToBeReinvested,
                    //     payloadDuration,
                    //     payloadInvestmentType,
                    //     investmentData,
                    //   ],
                    // })
                    //   }

                    //   console.log(
                    //     `The Interest of ${currencyCode} ${amountToBeReinvested} was Reinvested and the Principal of ${currencyCode} ${amountToPayoutNow} was paid`
                    //   )
                    //   break
                    default:
                      console.log('Nothing was done on this investment')
                      break
                  }
                  return resolve({
                    payload,
                    amountToBeReinvested,
                    amountToPayoutNow,
                    rolloverDone,
                    rolloverIsSuccessful,
                  })
                })
              }

              let rolloverImplementation = await effectRollover(
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              )
              // console.log(
              //   'testing Rollover Implementation line 2770',
              //   rolloverImplementation
              // )
              await investment.save()
              if (
                // @ts-ignore
                rolloverImplementation?.rolloverIsSuccessful === false ||
                // @ts-ignore
                rolloverImplementation?.rolloverIsSuccessful === undefined
              ) {
                // console.log(
                //   'Investment data after payout for unsuccessful reinvestment, line 2779:',
                //   investment
                // )
                return response.status(400).json({
                  status: 'FAILED',
                  data: investment//.map((inv) => inv.$original),
                })
              }
              // console.log('Investment data after payout line 2785:', investment)
              return response.status(200).json({
                status: 'OK',
                data: investment//.map((inv) => inv.$original),
              })
            }
          } else {
            // if the investment is liquidated
            let payload = investment.$original
            // send to Admin for approval
            // let userId = payload.userId
            let investmentId = payload.id
            let requestType = 'liquidate_investment'
            let approvalForTerminationIsAutomated = false
            if (approvalForTerminationIsAutomated === false) {
              let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
              // console.log(' Approval request return line 2772 : ', approvalRequestIsDone)
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: 'OK',
                  message: 'termination approval request was not successful, please try again.',
                  data: null,
                })
              }
              // console.log('Payout investment data line 2780:', payload)
              // payload.timeline = JSON.stringify(investment.timeline)
              // console.log('Liquidated Payout investment data line 2782:', payload)

              const payout = await Payout.create(payload)
              payout.status = 'liquidated'
              await payout.save()
              // console.log('Liquidated Payout investment data line 2787:', payout)
              //  END
              // investment = await Investment.query().where('id', investmentId)
              payload.requestType = requestType
              payload.status = 'active'
              payload.approvalStatus = 'pending'
              await investment.save()
            } else if (approvalForTerminationIsAutomated === true) {
              // if payout was approved
              // send to transaction service
              //  Proceed to payout the Total Amount due on maturity
              try {
                let rate = await sendPaymentDetails(amount, duration, investmentType)
                console.log(' Rate return line 2800 : ', rate)
              } catch (error) {
                console.error(error)
                return response.send({
                  status: 'FAILED',
                  message: 'The transaction was not sent successfully.',
                  error: error.message,
                })
              }
              isTransactionSentForProcessing = true
              if (isTransactionSentForProcessing === false) {
                return response.send({
                  status: 'FAILED',
                  message: 'The transaction was not sent successfully.',
                  isTransactionInProcess: isTransactionSentForProcessing,
                })
              }

              // if transaction was successfully processed
              // update Date payout was effected due to termination

              // TODO
              // Move the code below to a new function that will check payout approval status and update the transaction
              // START
              // payload.datePayoutWasDone = new Date().toISOString()
              // console.log('Payout investment data line 2825:', payload)
              // payload.timeline = JSON.stringify(investment.timeline)
              // console.log('Liquidated Payout investment data line 2827:', payload)

              // let payout = await Payout.create(payload)
              // payout.status = 'liquidated'
              // await payout.save()
              // console.log('Liquidated Payout investment data line 2832:', payout)
              //  END
              // investment = await Investment.query().where('id', investmentId)
              payload.requestType = requestType
              payload.status = 'liquidated'
              payload.approvalStatus = 'approved'
              await payload.save()
              // console.log('Liquidated Payout investment data line 2839:', payload)
            }
            // update timeline
            timelineObject = {
              id: uuid(),
              action: 'liquidate investment payout',
              investmentId: payload.id,//id,
              walletId: payload.walletId,// walletId,
              userId: payload.userId,// userId,
              // @ts-ignore
              message: `${payload.firstName} payment on investment has just been sent.`,
              adminMessage: `${payload.firstName} payment on investment was sent.`,
              createdAt: DateTime.now(),
              metadata: `amount invested: ${payload.totalAmountToPayout}, request type : ${payload.requestType}`,
            }
            // console.log('Timeline object line 2850:', timelineObject)
            // //  Push the new object to the array
            // // timeline = investment.timeline
            // timeline.push(timelineObject)
            // console.log('Timeline object line 2854:', timeline)
            // stringify the timeline array
            // investment.timeline = JSON.stringify(timeline)
            await timelineService.createTimeline(timelineObject);
            // Save
            await payload.save()
            return response.status(200).json({
              status: 'OK',
              data: investment//.map((inv) => inv.$original),
            })
          }
        } else {
          return response.status(404).json({
            status: 'FAILED',
            message: 'No investment matched your search, or payment has been processed.',
            data: {
              paymentStatus: investment.status,//.map((inv) => inv.$original.status),
              amountPaid: investment.totalAmountToPayout//.map((inv) => inv.$original.totalAmountToPayout),
            },
          })
        }
      } else {
        // console.log('Investment data after search line 2911:', investment)
        return response.status(200).json({
          status: 'FAILED',
          data: investment//.map((inv) => inv.$original),
        })
      }
    } catch (error) {
      console.error(error)
      console.log("Error line 3533", error.messages);
      console.log("Error line 3534", error.message);
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

  public async transactionStatus({ request, response }: HttpContextContract) {
    // const { investmentId } = request.qs()
    console.log('Rate query: ', request.qs())
    const timelineService = new TimelinesServices();
    // @ts-ignore
    let { userId, investmentId, walletId } = request.all()
    let investment = await Investment.query()
      .where({
        id: investmentId,
        user_id: userId,
        wallet_id: walletId,
      })
      .andWhereNot({ status: 'paid' })
      .first()
    // console.log(' QUERY RESULT: ', investment)
    if (investment) {
      // investment = await Investment.query().where({id: investmentId,user_id: userId,})
      let timeline
      let timelineObject
      // Check for Successful Transactions
      let transactionStatus
      // get update from the endpoint with axios
      transactionStatus = 'OK'
      if (transactionStatus !== 'OK') {
        let walletId = investment.walletId
        let investmentId = investment.id
        let totalAmountToPayout = investment.totalAmountToPayout
        // @ts-ignore
        let phone = investment.phone
        console.log('Unsuccessful transaction, line 2903')
        return response.json({
          status: 'FAILED',
          message: 'The transaction was not successful.',
          data: {
            investmentId: investmentId,
            totalAmountToPayout: totalAmountToPayout,
            receiverDetails: {
              walletId: walletId,
              phone: phone,
            },
          },
        })
      }
      // Update Investment status

      let {
        id,
        userId,
        walletId,
        amount,
        duration,
        rolloverType,
        rolloverTarget,
        rolloverDone,
        investmentType,
        tagName,
        currencyCode,
        // walletHolderDetails,
        lng,
        lat,
        interestRate,
        interestDueOnInvestment,
        totalAmountToPayout,
        createdAt,
        startDate,
        payoutDate,
        isPayoutAuthorized,
        isTerminationAuthorized,
        isPayoutSuccessful,
        requestType,
        approvalStatus,
        status,
        // datePayoutWasDone,
      } = investment

      // console.log('Initial status line 2949: ', status)
      // console.log('Initial datePayoutWasDone line 2950: ', datePayoutWasDone)
      let payload = {
        investmentId: id,
        userId,
        walletId,
        amount,
        duration,
        rolloverType,
        rolloverTarget,
        rolloverDone,
        investmentType,
        tagName,
        currencyCode,
        // walletHolderDetails,
        lng,
        lat,
        interestRate,
        interestDueOnInvestment,
        totalAmountPaid: totalAmountToPayout,
        createdAt,
        startDate,
        payoutDate,
        isPayoutAuthorized,
        isTerminationAuthorized,
        isPayoutSuccessful,
        requestType,
        approvalStatus,
        status,
        timeline,
      }
      // get the amount paid and the status of the transaction
      // let amountPaid = 50500
      isPayoutSuccessful = true

      // Save the Transaction to
      // payload[0].totalAmountToPayout = 0
      // payload.totalAmountPaid = amountPaid
      payload.approvalStatus = 'approved'
      payload.status = 'paid'
      payload.isPayoutSuccessful = isPayoutSuccessful
      // @ts-ignore
      // console.log('Payout Payload: ', payload)

      // @ts-ignore
      // let { userId, investmentId, walletId } = request.all()
      let payoutRecord
      payoutRecord = await PayoutRecord.query().where({
        investment_id: payload.investmentId,
        user_id: userId,
        wallet_id: walletId,
        rollover_target: payload.rolloverTarget,
        rollover_done: payload.rolloverDone,
      })
      // console.log(' QUERY RESULT line 3003: ', payoutRecord)
      if (payoutRecord.length > 0) {
        return response.json({
          status: 'OK',
          message: 'Record already exist in the database.',
          data: payoutRecord.map((record) => record.$original),
        })
      }
      // investment.totalAmountToPayout = amountPaid
      investment.isPayoutSuccessful = isPayoutSuccessful
      investment.approvalStatus = 'approved'
      investment.status = 'paid'
      // @ts-ignore
      // investment.datePayoutWasDone = new Date().toISOString()

      // Save the Update
      await investment.save()
      // payload.timeline = JSON.stringify(investment.timeline)
      // console.log('Matured Payout investment data line 3021:', payload)

      payoutRecord = await PayoutRecord.create(payload)
      // update investment status
      // payout.status = 'paid'
      await payoutRecord.save()

      // console.log('Payout Record investment data line 3028:', payoutRecord)
      // @ts-ignore
      investment.datePayoutWasDone = payoutRecord.createdAt

      // Update Payout
      let payout = await Payout.query()
        .where({
          investment_id: payload.investmentId,
          user_id: userId,
          wallet_id: walletId,
          rollover_target: payload.rolloverTarget,
          investment_type: payload.investmentType,
        })
        .first()
      // console.log('Payout investment data line 3040:', payout)
      if (payout) {
        payout.totalAmountToPayout = payoutRecord.totalAmountPaid
        payout.isPayoutAuthorized = payoutRecord.isPayoutAuthorized
        payout.isTerminationAuthorized = payoutRecord.isTerminationAuthorized
        payout.isPayoutSuccessful = payoutRecord.isPayoutSuccessful
        payout.approvalStatus = payoutRecord.approvalStatus
        payout.rolloverDone = payoutRecord.rolloverDone
        payout.datePayoutWasDone = payoutRecord.createdAt
        payout.status = payoutRecord.status
        payout.timeline = payoutRecord.timeline
        // Save the update
        await payout.save()
      }
      // Notify

      // Check RollOver Target

      // update timeline
      timelineObject = {
        id: uuid(),
        action: 'investment payout has been done',
        investmentId: investment.id,//id,
        walletId: investment.walletId,// walletId,
        userId: investment.userId,// userId,
        // @ts-ignore
        message: `${investment.firstName} payment on investment has just been made.`,
        adminMessage: `${investment.firstName} payment on investment was made.`,
        createdAt: DateTime.now(),
        metadata: `amount paid: ${investment.totalAmountToPayout}, request type : ${investment.requestType}`,
      }
      // console.log('Timeline object line 3065:', timelineObject)
      // //  Push the new object to the array
      // // timeline = investment.timeline
      // timeline.push(timelineObject)
      // // stringify the timeline array
      // // investment.timeline = JSON.stringify(timeline)
      // console.log('Timeline object line 3069:', timeline)
      await timelineService.createTimeline(timelineObject);
      // Save
      await investment.save()

      // console.log('data:', investment.$original)
      return response.json({ status: 'OK', data: payoutRecord.$original })
    } else {
      return response
        .status(404)
        .json({ status: 'FAILED', message: 'Invalid parameters, or payment has been effected.' })
    }
  }

  public async destroy({ params, request, response }: HttpContextContract) {
    // const { investmentId } = request.qs()
    console.log('Rate query: ', request.qs())
    let investment = await Investment.query().where({
      id: request.input('investmentId'),
      user_id: params.userId,
    })
    // console.log(' QUERY RESULT: ', investment)
    if (investment.length > 0) {
      investment = await Investment.query()
        .where({
          id: request.input('investmentId'),
          user_id: params.userId,
        })
        .delete()
      // console.log('Deleted data:', investment)
      return response.send('Investment Deleted.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}
