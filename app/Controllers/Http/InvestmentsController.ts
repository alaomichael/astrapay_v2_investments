/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import Payout from 'App/Models/Payout'
import PayoutRecord from 'App/Models/PayoutRecord'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import { DateTime } from 'luxon'
// import { string } from '@ioc:Adonis/Core/Helpers'
// import Env from '@ioc:Adonis/Core/Env'
// const axios = require('axios').default

// const API_URL = Env.get('API_URL')
import {
  // generateRate,
  interestDueOnPayout,
  dueForPayout,
  // payoutDueDate,
  approvalRequest,
  sendPaymentDetails,
  investmentRate,
  // @ts-ignore
} from 'App/Helpers/utils'

import Approval from 'App/Models/Approval'
export default class InvestmentsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    const { search, limit, requestType } = request.qs()
    console.log('INVESTMENT query: ', request.qs())
    const count = await Investment.query().where('currency_code', 'NGN').getCount()
    console.log('INVESTMENT count: ', count)
    // const investment = await Investment.query().offset(0).limit(1)
    const investment = await Investment.all()
    // let newArray = investment.map((investment) => {return investment.$original})
    let sortedInvestments = investment.map((investment) => {
      return investment.$original
    })
    // console.log('INVESTMENT newArray sorting: ', newArray)
    console.log('INVESTMENT before sorting: ', sortedInvestments)
    if (search) {
      sortedInvestments = sortedInvestments.filter((investment) => {
        // @ts-ignore
        // console.log(' Sorted :', investment.walletHolderDetails.lastName!.startsWith(search))
        // @ts-ignore
        return investment.walletHolderDetails.lastName!.startsWith(search)
      })
    }
    if (requestType) {
      sortedInvestments = sortedInvestments.filter((investment) => {
        // @ts-ignore
        // console.log(' Sorted :', investment.walletHolderDetails.lastName!.startsWith(search))
        // @ts-ignore
        return investment.requestType.startsWith(requestType)
      })
    }
    if (limit) {
      sortedInvestments = sortedInvestments.slice(0, Number(limit))
    }
    if (sortedInvestments.length < 1) {
      return response.status(200).json({
        status: 'fail',
        message: 'no investment matched your search',
        data: [],
      })
    }
    // console.log('INVESTMENT MAPPING: ',investment.map((inv) => inv.$extras))
    // console.log('INVESTMENT based on sorting & limit: ', sortedInvestments)
    // @ts-ignore
    Event.emit('list:investments', {
      id: investment[0].id,
      // @ts-ignore
      email: investment[0].walletHolderDetails.email,
    })
    // return investment
    console.log(' SORTED INVESTMENT line 78' + (await sortedInvestments))
    return response.status(200).json(sortedInvestments)
  }

  public async show({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    const { limit } = request.qs()
    console.log('INVESTMENT query: ', request.qs())
    // post will always be of type Post
    // const investment1 = await Investment.query()
    //   .where('id', 1)
    //   .firstOr(() => new Investment())
    // console.log('INVESTMENT 1 query: ', investment1)

    // post can be of type Post or string
    // const investment2 = await Investment.query()
    //   .where('id', 1)
    //   .firstOr(() => 'working')
    // console.log('INVESTMENT 2 query: ', investment2)

    // use a fallback query!
    // const investment3 = await Investment.query()
    //   .where('id', 1)
    //   .firstOr(() => Investment.query().where('id', 2).first())
    // console.log('INVESTMENT 3 query: ', investment3)
    // console.log('INVESTMENT query params: ', request.ctx)
    try {
      let investment = await Investment.query().where('user_id', params.userId)
      // .orWhere('id', params.id)
      // .limit()
      let newArray = investment.map((investment) => {
        return investment.$original
      })
      if (newArray.length > 0) {
        console.log('INVESTMENT DATA unconverted: ', investment)
        if (limit) {
          newArray = newArray.slice(0, Number(limit))
        }
        return response.status(200).json({ status: 'OK', data: newArray })
      } else {
        return response.status(200).json({
          status: 'fail',
          message: 'no investment matched your search',
          data: [],
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async showPayouts({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    try {
      //   const investment = await Investment.query().where('status', 'payout')
      // .orWhere('id', params.id)
      // .limit()
      const { search, limit, userId, investmentId, requestType, walletId } = request.qs()
      console.log('PAYOUT query: ', request.qs())
      const payout = await Payout.all()
      let sortedPayouts = payout
      console.log('PAYOUT Investment line 150: ', payout)
      if (search) {
        sortedPayouts = sortedPayouts.filter((payout) => {
          // @ts-ignore
          // console.log(' Sorted :', payout.walletHolderDetails.lastName!.includes(search))
          // @ts-ignore
          return payout.walletHolderDetails.lastName!.startsWith(search)
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
          status: 'FAILED',
          message: 'no investment payout matched your search',
          data: [],
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
    }
  }

  public async feedbacks({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params line 149: ', params)
    const { userId, investmentId, requestType, approvalStatus, getInvestmentDetails } = request.qs()
    console.log('INVESTMENT query line 151: ', request.qs())
    let investment = await Investment.all()
    let approvals
    if (
      requestType === 'start investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('request_type', requestType)
        .where('user_id', userId)
        .where('investment_id', investmentId)
      // check the approval status
      console.log('approvals line 163: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      console.log('approvals line 170: ', approvals[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start investment
      if (approvals[0].approvalStatus === 'approved') {
        // .where('status', 'initiated')
        // investment = await Investment.query()
        //   .where('requestType', requestType)
        //   .where('user_id', userId)
        //   .where('id', investmentId)

        //  investment
        try {
          investment = await Investment.query().where({
            id: investmentId,
            user_id: userId,
            request_type: requestType,
            status: 'initiated',
          })
        } catch (error) {
          console.error(error)
          return response.json({ status: 'FAILED', message: error.message })
        }
        console.log('INVESTMENT DATA line 178: ', investment)
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
        investment[0].status = 'active'
        let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        investment[0].startDate = DateTime.now().toISO()
        let duration = parseInt(investment[0].duration)
        investment[0].payoutDate = DateTime.now().plus({ days: duration })
        console.log('The currentDate line 195: ', currentDateMs)
        console.log('Time investment was started line 196: ', investment[0].startDate)
        console.log('Time investment payout date line 197: ', investment[0].payoutDate)
        // Save
        await investment[0].save()
        // Send notification
        console.log('Updated investment Status line 201: ', investment)
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
          return response.json({ status: 'FAILED', message: error.message })
        }
        console.log('The declined investment line 239: ', investment)
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

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 253: ',
          investment.map((inv) => inv.$original)
        )

        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvals })
      }
    } else if (
      requestType === 'terminate investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('request_type', requestType)
        .where('user_id', userId)
        .where('investment_id', investmentId)
      // check the approval status
      console.log('approvals line 270: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      console.log('approvals line 277: ', approvals[0].approvalStatus)
      //  if approved update investment status to terminated, update startDate,  and start investment
      if (approvals[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('INVESTMENT DATA line 285: ', investment)
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
        investment[0].approvalStatus = approvals[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
        investment[0].isPayoutAuthorized = true
        investment[0].isTerminationAuthorized = true
        investment[0].status = 'terminated'

        // @ts-ignore
        // investment[0].datePayoutWasDone = DateTime.now().toISO()
        // investment[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(investment[0].duration)
        // investment[0].payoutDate = DateTime.now().plus({ days: duration })
        // console.log('The currentDate line 284: ', currentDateMs)
        // console.log('Time investment was started line 285: ', investment[0].startDate)
        // console.log('Time investment payout date line 286: ', investment[0].payoutDate)

        // Save
        await investment[0].save()
        // send notification
        console.log('Updated investment Status line 312: ', investment)
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
        console.log('The declined investment line 323: ', investment)
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

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 337: ',
          investment.map((inv) => inv.$original)
        )
        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvals.map((inv) => inv.$original) })
      }
    } else if (
      requestType === 'payout investment' &&
      userId &&
      investmentId &&
      !approvalStatus &&
      !getInvestmentDetails
    ) {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvals = await Approval.query()
        .where('requestType', requestType)
        .where('userId', userId)
        .where('investmentId', investmentId)
      // check the approval status
      console.log('approvals line 353: ', approvals)
      if (approvals.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment payout request data matched your query, please try again',
        })
      }
      console.log('approvals line 345: ', approvals[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start investment
      if (approvals[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('INVESTMENT DATA line 368: ', investment)
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
        investment[0].isTerminationAuthorized = true
        investment[0].status = 'payout'
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        // investment[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(investment[0].duration)

        // investment[0].payoutDate = DateTime.now().toISO() //DateTime.now().plus({ days: duration })

        // console.log('The currentDate line 372: ', currentDateMs)
        // console.log('Time investment was started line 373: ', investment[0].startDate)
        console.log('Time investment payout date line 390: ', investment[0].payoutDate)
        // Save
        await investment[0].save()
        // send notification
        console.log('Updated investment Status line 394: ', investment)
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
        console.log('The declined investment line 405: ', investment)
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

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvals[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 419: ',
          investment.map((inv) => inv.$original)
        )
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
        console.log('Request Type', requestType)
        sortedInvestment = sortedInvestment.filter((investment) => {
          return (
            investment.requestType === requestType &&
            investment.userId === parseInt(userId) &&
            investment.id === parseInt(investmentId) &&
            investment.approvalStatus === approvalStatus
          )
        })
        console.log('investment line 514: ', sortedInvestment)
        if (sortedInvestment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment approval request data matched your query, please try again',
          })
        }
        console.log('approval line 521: ', sortedInvestment)

        return response.json({ status: 'OK', data: sortedInvestment.map((inv) => inv.$original) })
      }
      if (requestType) {
        console.log('Request Type', requestType)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.requestType === requestType
        })
      }
      if (userId) {
        console.log('USER ID', userId)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.userId === parseInt(userId)
        })
      }
      if (investmentId) {
        console.log('INVESTMENT ID', investmentId)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.investmentId === parseInt(investmentId)
        })
      }
      //  approvalStatuss
      if (approvalStatus) {
        console.log('Request Type', approvalStatus)
        sortedApproval = sortedApproval.filter((approval) => {
          return approval.approvalStatus === approvalStatus
        })
      }

      // check the approval status
      console.log('approval line 552: ', sortedApproval)
      if (sortedApproval.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      console.log('approval line 559: ', sortedApproval)

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
    //     }
    //   }

    //   console.log(
    //     ' The Rate return for RATE: ',
    //     await investmentRate(testAmount, testDuration, testInvestmentType)
    //   )
    //   let rate = await investmentRate(testAmount, testDuration, testInvestmentType)
    //   console.log(' Rate return line 236 : ', rate)
    //   if (rate === undefined) {
    //     return response.status(400).json({
    //       status: 'fail',
    //       message: 'no investment rate matched your search, please try again.',
    //       data: [],
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
    //       .json({ status: 'fail', message: 'no investment matched your query.' })
    //   }
    // } catch (error) {
    //   console.error(error)
    // }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      let investment = await Investment.query().where({
        user_id: request.input('userId'),
        id: request.input('investmentId'),
      })
      if (investment.length > 0) {
        console.log('Investment Selected for Update line 272:', investment[0].startDate)
        let isDueForPayout
        if (investment[0].startDate !== null) {
          let createdAt = investment[0].createdAt
          let duration = investment[0].duration
          try {
            isDueForPayout = await dueForPayout(createdAt, duration)
            // isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
            console.log('Is due for payout status :', isDueForPayout)
            // Restrict update to timed/fixed deposit only
            if (
              investment &&
              investment[0].investmentType !== 'debenture' &&
              isDueForPayout === false
            ) {
              // investment[0].amount = request.input('amount')
              investment[0].rolloverTarget = request.input('rolloverTarget')
              investment[0].rolloverType = request.input('rolloverType')
              // investment[0].investmentType = request.input('investmentType')

              if (investment) {
                // send to user
                await investment[0].save()
                console.log('Update Investment:', investment)
                return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
              }
              return // 422
            }
          } catch (error) {
            console.error('Is due for payout status Error :', error)
            return response.json({ status: 'fail', data: error.message })
          }
        } else {
          return response.json({ status: 'fail', data: investment.map((inv) => inv.$original) })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'fail', message: 'No data match your query parameters' })
      }
    } catch (error) {
      console.error(error)
    }
    // return // 401
  }
  
  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investmentSchema = schema.create({
      amount: schema.number(),
      rolloverType: schema.enum(['100', '101', '102', '103']),
      rolloverTarget: schema.number(),
      investmentType: schema.enum(['fixed', 'debenture']),
      duration: schema.string({ escape: true }, [rules.maxLength(4)]),
      userId: schema.number(),
      tagName: schema.string({ escape: true }, [rules.maxLength(150)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      long: schema.number(),
      lat: schema.number(),
      walletHolderDetails: schema.object().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        investorFundingWalletId: schema.string(),
      }),
    })
    const payload: any = await request.validate({ schema: investmentSchema })
    console.log('Payload  :', payload)
    let payloadAmount = payload.amount
    let payloadDuration = payload.duration
    let payloadInvestmentType = payload.investmentType
    // let investmentRate = async function () {
    //   try {
    //     const response = await axios.get(
    //       `${API_URL}/investments/rates?amount=${payload.amount}&duration=${payload.duration}&investmentType=${payload.investmentType}`
    //     )
    //     console.log('The API response: ', response.data)
    //     if (response.data.status === 'OK' && response.data.data.length > 0) {
    //       return response.data.data[0].interest_rate
    //     } else {
    //       return
    //     }
    //   } catch (error) {
    //     console.error(error)
    //   }
    // }

    console.log(
      ' The Rate return for RATE line 541: ',
      await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
    )
    let rate = await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
    console.log(' Rate return line 684 : ', rate)
    if (rate === undefined) {
      return response.status(400).json({
        status: 'fail',
        message: 'no investment rate matched your search, please try again.',
        data: [],
      })
    }

    const investment = await Investment.create(payload)
    // const newInvestment = request.all() as Partial<Investment>
    // const investment = await Investment.create(newInvestment)
    // return response.OK(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)

    // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate

    investment.interestRate = rate

    // When the Invest has been approved and activated
    let amount = investment.amount
    let investmentDuration = investment.duration
    let amountDueOnPayout = await interestDueOnPayout(amount, rate, investmentDuration)
    investment.interestDueOnInvestment = amountDueOnPayout
    investment.totalAmountToPayout = investment.amount + amountDueOnPayout

    // investment.payoutDate = await payoutDueDate(investment.startDate, investment.duration)
    // @ts-ignore
    investment.walletId = investment.walletHolderDetails.investorFundingWalletId
    await investment.save()
    console.log('The new investment:', investment)

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
    let userId = investment.userId
    let investmentId = investment.id
    let requestType = 'start investment'
    let approvalIsAutomated = false
    if (approvalIsAutomated === false) {
      // Send Approval Request to Admin
      let approval = await approvalRequest(userId, investmentId, requestType)
      console.log(' Approval request return line 848 : ', approval)
      if (approval === undefined) {
        return response.status(400).json({
          status: 'FAILED',
          message: 'investment approval request was not successful, please try again.',
          data: [],
        })
      }
    } else if (approvalIsAutomated === true) {
      // TODO
      // Send Investment Payload To Transaction Service
      let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
      console.log(' Feedback from Transaction service: ', sendToTransactionService)
      if (sendToTransactionService === 'Ok') {
        // Activate the investment
        investment.requestType = requestType
        investment.status = 'active'
        investment.approvalStatus = 'approved'
        investment.startDate = DateTime.now() //.toISODate()
        investment.payoutDate = DateTime.now().plus({ days: parseInt(investmentDuration) })
        await investment.save()
      } else {
        return response.json({
          status: 'FAILED',
          message: 'Investment was not successfully sent to Transaction Service, please try again.',
          data: investment,
        })
      }
    }

    // Testing
    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
    // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
    // console.log('Testing Payout Date: ' + testingPayoutDate)
    let newInvestmentId = investment.id
    // Send to Notificaation Service
    // @ts-ignore
    let newInvestmentEmail = investment.walletHolderDetails.email
    Event.emit('new:investment', {
      id: newInvestmentId,
      email: newInvestmentEmail,
    })
    return response.status(201).json({ status: 'OK', data: investment.$original })
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
      console.log(' Investment QUERY RESULT: ', investment)
      if (investment.length > 0) {
        console.log('Investment Selected for Update:', investment)
        let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        console.log('Is due for payout status :', isDueForPayout)
        // Restrict update to timed/fixed deposit only
        // if (investment && investment[0].investmentType !== 'debenture' && isDueForPayout === false)
        if (investment) {
          investment[0].status = request.input('status')
            ? request.input('status')
            : investment[0].status
          let terminate = request.input('isTerminationAuthorized')
          investment[0].isTerminationAuthorized =
            request.input('isTerminationAuthorized') !== undefined
              ? request.input('isTerminationAuthorized')
              : investment[0].isTerminationAuthorized
          console.log('terminate :', terminate)
          let payout = request.input('isPayoutAuthorized')
          investment[0].isPayoutAuthorized =
            request.input('isPayoutAuthorized') !== undefined
              ? request.input('isPayoutAuthorized')
              : investment[0].isPayoutAuthorized
          console.log('payout :', payout)
          if (investment) {
            // send to user
            await investment[0].save()
            console.log('Update Investment:', investment)
            return response
              .status(200)
              .json({ status: 'OK', data: investment.map((inv) => inv.$original) })
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'fail', data: investment })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'fail', message: 'No data match your query parameters' })
      }
    } catch (error) {
      console.error(error)
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

    try {
      const investment = await Investment.all()
      // .limit()
      let sortedApprovalRequest = investment
      if (userId) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.userId === parseInt(userId)
        })
      }
      if (investmentId) {
        // @ts-ignore
        sortedApprovalRequest = await Investment.query().where('id', investmentId)
      }

      if (isPayoutAuthorized) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.isPayoutAuthorized.toString() === `${isPayoutAuthorized}`
        })
      }

      if (isTerminationAuthorized) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.isTerminationAuthorized.toString() === `${isTerminationAuthorized}`
        })
      }

      if (payoutDate) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.payoutDate.includes(payoutDate)
        })
      }
      if (status) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.status === `${status}`
        })
      }

      if (walletId) {
        sortedApprovalRequest = sortedApprovalRequest.filter((investment) => {
          // @ts-ignore
          return investment.walletId.toString() === `${walletId}`
        })
      }
      if (limit) {
        sortedApprovalRequest = sortedApprovalRequest.slice(0, Number(limit))
      }
      if (sortedApprovalRequest.length < 1) {
        return response.status(200).json({
          status: 'OK',
          message: 'no investment approval request matched your search',
          data: [],
        })
      }
      // return rate(s)
      return response.status(200).json({
        status: 'OK',
        data: await sortedApprovalRequest.map((inv) => inv.$original),
      })
    } catch (error) {
      console.log(error)
    }
  }

  public async payout({ request, response }: HttpContextContract) {
    try {
      // @ts-ignore
      // let id = request.input('userId')
      let { userId, investmentId } = request.all()
      console.log(
        'Params for update line 941: ' + ' userId: ' + userId + ', investmentId: ' + investmentId
      )
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      let investment = await Investment.query().where('id', investmentId)
      console.log('Investment Info, line 945: ', investment)
      if (investment.length > 0) {
        console.log('investment search data :', investment[0].$original)
        // @ts-ignore
        // let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        // console.log('Is due for payout status :', isDueForPayout)

        // TESTING
        let startDate = DateTime.now().minus({ days: 5 }).toISO()
        let duration = 4
        console.log('Time investment was started line 955: ', startDate)
        let isDueForPayout = await dueForPayout(startDate, duration)
        console.log('Is due for payout status line 957:', isDueForPayout)
        // let amt = investment[0].amount
        if (isDueForPayout) {
          let payload = investment[0].$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'payout investment'
          let approvalIsAutomated = false
          if (approvalIsAutomated === false) {
            let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
            console.log(' Approval request return line 966 : ', approvalRequestIsDone)
            if (approvalRequestIsDone === undefined) {
              return response.status(400).json({
                status: 'FAILED',
                message: 'payout approval request was not successful, please try again.',
                data: [],
              })
            }
            investment = await Investment.query().where('id', investmentId)
            investment[0].requestType = requestType
            investment[0].status = 'active'
            investment[0].approvalStatus = 'pending'
            // Save
            await investment[0].save()
          } else if (approvalIsAutomated === true) {
            // update status of investment
            investment[0].requestType = requestType
            investment[0].approvalStatus = 'approved'
            investment[0].status = 'matured'
            investment[0].isPayoutAuthorized = true
            investment[0].isTerminationAuthorized = true
            // Save
            await investment[0].save()
            // Send notification
            console.log('Updated investment Status line 1088: ', investment)
          }
          console.log('Payout investment data 1:', payload)
          payload.investmentId = investmentId
          payload.requestType = requestType
          // check if payout request is existing
          let payoutRequestIsExisting = await Payout.query().where({
            investment_id: investmentId,
            user_id: userId,
          })
          console.log(
            'Investment payout Request Is Existing data line 1099:',
            payoutRequestIsExisting
          )
          console.log('Investment payload data line 1102:', payload)
          if (
            payoutRequestIsExisting.length < 1 &&
            investment[0].requestType !== 'start investment' &&
            investment[0].approvalStatus !== 'pending' &&
            investment[0].status !== 'initiated'
          ) {
            const payout = await Payout.create(payload)
            payout.status = 'matured'
            await payout.save()
            console.log('Matured Payout investment data line 1112:', payout)
          }
          // investment = await Investment.query().where('id', investmentId)
          // investment[0].requestType = requestType
          // investment[0].status = 'active'
          // investment[0].approvalStatus = 'pending'

          await investment[0].save()
          console.log('Investment data after payout request 2:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
        } else {
          // if the investment has not matured, i.e terminated
          let payload = investment[0].$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'terminate investment'
          let approvalIsAutomated = false
          if (approvalIsAutomated === false) {
            let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
            console.log(' Approval request return line 1135 : ', approvalRequestIsDone)
            if (approvalRequestIsDone === undefined) {
              return response.status(400).json({
                status: 'fail',
                message: 'termination approval request was not successful, please try again.',
                data: [],
              })
            }
            investment = await Investment.query().where('id', investmentId)
            investment[0].requestType = requestType
            investment[0].status = 'active'
            investment[0].approvalStatus = 'pending'
            // Save
            await investment[0].save()
          } else if (approvalIsAutomated === true) {
            investment[0].requestType = requestType
            investment[0].status = 'terminated'
            investment[0].approvalStatus = 'approved'
            investment[0].isPayoutAuthorized = true
            investment[0].isTerminationAuthorized = true
            // Save
            await investment[0].save()
          }

          payload.investmentId = investmentId
          payload.requestType = requestType
          // check if payout request is existing
          let payoutRequestIsExisting = await Payout.query().where({
            investment_id: investmentId,
            user_id: userId,
          })
          console.log(
            'Investment payout Request Is Existing data line 1161:',
            payoutRequestIsExisting
          )
          if (
            payoutRequestIsExisting.length < 1 &&
            investment[0].requestType !== 'start investment' &&
            investment[0].approvalStatus !== 'pending' &&
            investment[0].status !== 'initiated'
          ) {
            console.log('Payout investment data 1:', payload)
            const payout = await Payout.create(payload)
            payout.status = 'terminated'
            await payout.save()
            console.log('Terminated Payout investment data line 1174:', payout)
          }
          // investment = await Investment.query().where('id', investmentId)
          // investment[0].requestType = requestType
          // investment[0].status = 'active'
          // investment[0].approvalStatus = 'pending'
          await investment[0].save()
          console.log('Terminated Payout investment data line 1181:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
        }
      } else {
        return response.status(404).json({
          status: 'FAILED',
          message: 'no investment matched your search',
          data: [],
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  public async processPayment({ request, response }: HttpContextContract) {
    try {
      // @ts-ignore
      let { userId, investmentId } = request.all()
      console.log(
        'Params for update line 924: ' + ' userId: ' + userId + ', investmentId: ' + investmentId
      )
      let investment
      try {
        investment = await Investment.query().where({ id: investmentId, user_id: userId })
      } catch (error) {
        console.error(error)
        return response.json({ status: 'FAILED', message: error.message })
      }
      if (investment.length > 0) {
        let investmentData = investment[0]
        let rolloverType = investment[0].rolloverType
        let amount = investment[0].amount
        let duration = investment[0].duration
        let investmentType = investment[0].investmentType
        let rolloverTarget = investment[0].rolloverTarget
        let rolloverDone = investment[0].rolloverDone
        let currencyCode = investment[0].currencyCode
        let isTransactionSentForProcessing
        let payload
        let payout
        console.log('Investment Info, line 928: ', investment)
        if (
          (investment.length > 0 &&
            investment[0].isPayoutAuthorized === true &&
            investment[0].isTerminationAuthorized === true &&
            investment[0].requestType === 'payout investment' &&
            investment[0].approvalStatus === 'approved' &&
            investment[0].status === 'matured') ||
          (investment.length > 0 &&
            investment[0].isPayoutAuthorized === true &&
            investment[0].isTerminationAuthorized === false &&
            investment[0].requestType === 'payout investment' &&
            investment[0].approvalStatus === 'approved' &&
            investment[0].status === 'matured') ||
          (investment.length > 0 &&
            investment[0].isPayoutAuthorized === false &&
            investment[0].isTerminationAuthorized === true &&
            investment[0].requestType === 'terminate investment' &&
            investment[0].approvalStatus === 'approved' &&
            investment[0].status === 'terminated') ||
          (investment.length > 0 &&
            investment[0].isPayoutAuthorized === true &&
            investment[0].isTerminationAuthorized === true &&
            investment[0].requestType === 'terminate investment' &&
            investment[0].approvalStatus === 'approved' &&
            investment[0].status === 'terminated')
        ) {
          console.log('investment search data line 1261 :', investment[0].$original)
          // @ts-ignore
          // let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
          // console.log('Is due for payout status :', isDueForPayout)

          // let payoutIsApproved = true
          // Notify
          if (
            investment[0].isPayoutAuthorized === true ||
            investment[0].isTerminationAuthorized === true
          ) {
            // Check Rollover Type
            // let rolloverType = investment[0].rolloverType
            // let amount = investment[0].amount
            // let duration = investment[0].duration
            // let investmentType = investment[0].investmentType
            // let rolloverTarget = investment[0].rolloverTarget
            // let rolloverDone = investment[0].rolloverDone
            // let currencyCode = investment[0].currencyCode
            // let isTransactionSentForProcessing
            if (rolloverType === '100') {
              // Save the payment data in payout table
              payload = investmentData
              console.log('Payout investment data line 1284:', payload)
              // payout = await Payout.create(payload)
              // payout.status = 'matured'
              // await payout.save()
              // console.log('Matured Payout investment data line 1235:', payout)

              // check if payout request is existing
              let payoutRequestIsExisting = await Payout.query().where({
                investment_id: investmentId,
                user_id: userId,
              })
              console.log(
                'Investment payout Request Is Existing data line 1296:',
                payoutRequestIsExisting
              )
              if (
                payoutRequestIsExisting.length < 1 &&
                investment[0].requestType !== 'start investment' &&
                investment[0].approvalStatus !== 'pending' &&
                investment[0].status !== 'initiated'
              ) {
                console.log('Payout investment data line 1305:', payload)
                payout = await Payout.create(payload)
                payout.status = 'matured'
                await payout.save()
                console.log('Matured Payout investment data line 1309:', payout)
              } else {
                payoutRequestIsExisting[0].requestType = 'payout investment'
                payoutRequestIsExisting[0].approvalStatus = 'approved'
                payoutRequestIsExisting[0].status = 'matured'
                investment[0].status = 'matured'
                // Save
                payoutRequestIsExisting[0].save()
                investment.save()
              }

              //  Proceed to payout the Total Amount due on maturity
              // Send Payment Details to Transaction Service
              // use try catch
              try {
                // TODO
                // Update with the real transaction service endpoint and payload
                let rate = await sendPaymentDetails(amount, duration, investmentType)
                console.log(' Rate return line 1326 : ', rate)
              } catch (error) {
                console.error(error)
                return response.send({
                  status: 'FAILED',
                  message: 'The transaction was not sent successfully.',
                  error: error.message,
                })
              }
              // TODO
              // Update with the appropriate endpoint and data
              isTransactionSentForProcessing = true
              if (isTransactionSentForProcessing === false) {
                return response.send({
                  status: 'FAILED',
                  message: 'The transaction was not sent successfully.',
                  isTransactionInProcess: isTransactionSentForProcessing,
                })
              }
              return response.send({
                status: 'OK',
                message:
                  'No Rollover was set on this investment, but the transaction was sent successfully for processing .',
                isTransactionInProcess: isTransactionSentForProcessing,
                data: investment[0].$original,
              })
            } else {
              // If the investment has rollover
              // Check RollOver Target
              /**
               * .enum('rollover_type', ['100' = 'no rollover',
               *  '101' = 'rollover principal only',
               * '102' = 'rollover principal with interest',
               * '103' = 'rollover interest only'])
               */

              console.log(
                'Data for line 1363: ',
                rolloverType,
                amount,
                duration,
                investmentType,
                rolloverTarget,
                rolloverDone
              )
              // let payout
              // let payload = investmentData
              //  function for effecting the set rollover
              const effectRollover = async (
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              ) => {
                return new Promise(async (resolve, reject) => {
                  console.log(
                    'Datas line 1282 : ',
                    investmentData,
                    amount,
                    rolloverType,
                    rolloverDone,
                    rolloverTarget
                  )
                  // !amount ||
                  // !rolloverType ||
                  // !rolloverDone ||
                  // !rolloverTarget ||
                  if (!investmentData || rolloverTarget < 0) {
                    reject(
                      new Error(
                        'Incomplete parameters , or no rollover target was set, or is less than allowed range'
                      )
                    )
                  }
                  let amountToPayoutNow
                  let amountToBeReinvested
                  if (rolloverDone >= rolloverTarget) {
                    let payload = investmentData
                    let payout
                    amountToPayoutNow = amount + investmentData.interestDueOnInvestment
                    // Send Investment Initiation Message to Queue

                    // check if Approval is set to Auto, from Setting Controller
                    userId = investment.userId
                    let investmentId = investment.id
                    // let requestType = 'payout investment'
                    // let approvalIsAutomated = false
                    // if (approvalIsAutomated === false) {
                    // Send Approval Request to Admin
                    // let approval = await approvalRequest(userId, investmentId, requestType)
                    // console.log(' Approval request return line 1417 : ', approval)
                    // if (approval === undefined) {
                    //   return response.status(400).json({
                    //     status: 'fail',
                    //     message:
                    //       'investment approval request was not successful, please try again.',
                    //     data: [],
                    //   })
                    // }
                    // } else if (approvalIsAutomated === true) {
                    // investment.status = 'approved'
                    // investment.requestType = requestType
                    // investment.approvalStatus = 'approved'
                    // investment.isPayoutAuthorized = true
                    // investment.isTerminationAuthorized = true
                    // await investment.save()

                    //  Proceed to payout the Total Amount due on maturity
                    // Save the payment data in payout table
                    // console.log('Payout investment data line 1349:', payload)
                    // payout = await Payout.create(payload)
                    // payout.status = 'matured'
                    // await payout.save()
                    // console.log('Matured Payout investment data line 1353:', payout)
                    payload = investmentData
                    console.log('Payout investment data line 1442:', payload)
                    // check if payout request is existing
                    let payoutRequestIsExisting = await Payout.query().where({
                      investment_id: investmentId,
                      user_id: userId,
                    })
                    console.log(
                      'Investment payout Request Is Existing data line 1449:',
                      payoutRequestIsExisting
                    )
                    if (
                      payoutRequestIsExisting.length < 1 &&
                      investment[0].requestType !== 'start investment' &&
                      investment[0].approvalStatus !== 'pending' &&
                      investment[0].status !== 'initiated'
                    ) {
                      console.log('Payout investment data line 1458:', payload)
                      payout = await Payout.create(payload)
                      payout.status = 'matured'
                      await payout.save()
                      console.log('Matured Payout investment data line 1462:', payout)
                    } else {
                      payoutRequestIsExisting[0].requestType = investment[0].requestType
                      payoutRequestIsExisting[0].status = 'matured'
                      investment[0].status = 'matured'
                      //  Save
                      await payoutRequestIsExisting[0].save()
                      await investment[0].save()
                    }

                    try {
                      // TODO
                      // Send Payment details to Transaction Service
                      // Update with the real transaction service endpoint and payload
                      let rate = await sendPaymentDetails(amount, duration, investmentType)
                      console.log(' Rate return line 1469 : ', rate)
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

                    return response.send({
                      status: 'OK',
                      message:
                        'Rollover target has been reached or exceeded, and payout of the sum total of your principal and interest has been initiated.',
                      data: investment[0].$original,
                    })
                  }
                  // if rolloverDone < rolloverTarget
                  investmentData = investment[0]
                  let payload = investmentData
                  console.log('Payload line 1484 :', payload)
                  let payloadDuration = investmentData.duration
                  let payloadInvestmentType = investmentData.investmentType

                  // let investmentRate = async function () {
                  //   try {
                  //     const response = await axios.get(
                  //       `${API_URL}/investments/rates?amount=${payload.amount}&duration=${payload.duration}&investmentType=${payload.investmentType}`
                  //     )
                  //     console.log('The API response: ', response.data)
                  //     if (response.data.status === 'OK' && response.data.data.length > 0) {
                  //       return response.data.data[0].interest_rate
                  //     } else {
                  //       return
                  //     }
                  //   } catch (error) {
                  //     console.error(error)
                  //   }
                  // }

                  // A function for creating new investment
                  const createInvestment = async (
                    payloadAmount,
                    payloadDuration,
                    payloadInvestmentType,
                    investmentData
                  ) => {
                    console.log('Investment data line 1413: ', investmentData)
                    console.log('Investment payloadAmount data line 1414: ', payloadAmount)
                    console.log('Investment payloadDuration data line 1415: ', payloadDuration)
                    console.log(
                      'Investment payloadInvestmentType data line 1417: ',
                      payloadInvestmentType
                    )

                    console.log(
                      ' The Rate return for RATE line 1422: ',
                      await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
                    )
                    let rate = await investmentRate(
                      payloadAmount,
                      payloadDuration,
                      payloadInvestmentType
                    )
                    console.log(' Rate return line 1430 : ', rate)
                    if (rate === undefined) {
                      return response.status(400).json({
                        status: 'fail',
                        message: 'no investment rate matched your search, please try again.',
                        data: [],
                      })
                    }
                    let payload
                    // destructure / extract the needed data from the investment
                    let {
                      amount,
                      rolloverType,
                      rolloverTarget,
                      rolloverDone,
                      investmentType,
                      duration,
                      userId,
                      tagName,
                      currencyCode,
                      long,
                      lat,
                      walletHolderDetails,
                    } = investmentData
                    // copy the investment data to payload
                    payload = {
                      amount,
                      rolloverType,
                      rolloverTarget,
                      rolloverDone,
                      investmentType,
                      duration,
                      userId,
                      tagName,
                      currencyCode,
                      long,
                      lat,
                      walletHolderDetails,
                    }
                    payload.amount = payloadAmount
                    //  payload.interestRate = rate
                    console.log('PAYLOAD line 1471 :', payload)

                    const investment = await Investment.create(payload)
                    investment.interestRate = rate

                    // When the Invest has been approved and activated
                    let investmentAmount = investment.amount
                    let investmentDuration = investment.duration
                    let amountDueOnPayout = await interestDueOnPayout(
                      investmentAmount,
                      rate,
                      investmentDuration
                    )
                    investment.interestDueOnInvestment = amountDueOnPayout
                    investment.totalAmountToPayout = investment.amount + amountDueOnPayout
                    // @ts-ignore
                    investment.walletId = investment.walletHolderDetails.investorFundingWalletId
                    await investment.save()
                    console.log('The new Reinvestment, line 1601 :', investment)

                    // TODO
                    // Send Investment Payload To Transaction Service
                    let sendToTransactionService = 'status: OK' //= new SendToTransactionService(investment)
                    console.log(
                      ' Feedback from Transaction service line 1607: ',
                      sendToTransactionService
                    )

                    await investment.save()
                    // Send Investment Initiation Message to Queue

                    // check if Approval is set to Auto, from Setting Controller
                    let requestType = 'start investment'
                    let approvalIsAutomated = false
                    if (approvalIsAutomated === false) {
                      // Send Approval Request to Admin
                      userId = investment.userId
                      let investmentId = investment.id
                      // let requestType = 'start investment'
                      let approval = await approvalRequest(userId, investmentId, requestType)
                      console.log(' Approval request return line 1623 : ', approval)
                      if (approval === undefined) {
                        return response.status(400).json({
                          status: 'fail',
                          message:
                            'investment approval request was not successful, please try again.',
                          data: [],
                        })
                      }
                    } else if (approvalIsAutomated === true) {
                      investment.requestType = requestType
                      investment.status = 'active'
                      investment.approvalStatus = 'approved'
                      investment.startDate = DateTime.now() //new Date().toISOString()
                      // @ts-ignore
                    }

                    let newInvestmentId = investment.id
                    // @ts-ignore
                    let newInvestmentEmail = investment.walletHolderDetails.email
                    // Send to Notification Service
                    Event.emit('new:investment', {
                      id: newInvestmentId,
                      email: newInvestmentEmail,
                    })
                    return response.status(201).json({ status: 'OK', data: investment.$original })

                    // END
                  }
                  let payout
                  switch (rolloverType) {
                    case '101':
                      //'101' = 'rollover principal only',
                      amountToBeReinvested = amount
                      payloadDuration = investment[0].duration
                      payloadInvestmentType = investment[0].investmentType
                      amountToPayoutNow = investment[0].interestDueOnInvestment
                      investment[0].amount = amountToBeReinvested
                      investment[0].totalAmountToPayout = amountToPayoutNow
                      rolloverDone = rolloverDone + 1
                      investment[0].rolloverTarget = rolloverTarget
                      investment[0].rolloverDone = rolloverDone
                      await investment[0].save()
                      investmentData = investment[0]
                      // Save the payment data in payout table
                      payload = investmentData
                      console.log('Payout investment data line 1669:', payload)
                      payout = await Payout.create(payload)
                      payout.status = 'matured'
                      await payout.save()
                      console.log('Matured Payout investment data line 1673:', payout)

                      // send payment details to transction service

                      // initiate a new investment
                      createInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      )

                      console.log(
                        `Principal of ${currencyCode} ${amountToBeReinvested} was Reinvested and the interest of ${currencyCode} ${amountToPayoutNow} was paid`
                      )
                      break
                    case '102':
                      // '102' = 'rollover principal plus interest',
                      amountToBeReinvested = amount + investment[0].interestDueOnInvestment
                      payloadDuration = investment[0].duration
                      payloadInvestmentType = investment[0].investmentType
                      investment[0].amount = amountToBeReinvested
                      investment[0].totalAmountToPayout = 0
                      rolloverDone = rolloverDone + 1
                      investment[0].rolloverTarget = rolloverTarget
                      investment[0].rolloverDone = rolloverDone
                      await investment[0].save()
                      investmentData = investment[0]
                      // Save the payment data in payout table
                      payload = investmentData
                      console.log('Payout investment data line 1703:', payload)
                      payout = await Payout.create(payload)
                      payout.status = 'matured'
                      await payout.save()
                      console.log('Matured Payout investment data line 1707:', payout)

                      // send payment details to transction service

                      // initiate a new investment
                      createInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      )

                      console.log(
                        `The Sum Total of the Principal and the interest of ${currencyCode} ${amountToBeReinvested} was Reinvested`
                      )
                      break
                    case '103':
                      // '103' = 'rollover interest only'
                      amountToBeReinvested = investment[0].interestDueOnInvestment
                      amountToPayoutNow = amount
                      payloadDuration = investment[0].duration
                      payloadInvestmentType = investment[0].investmentType
                      investment[0].amount = amountToBeReinvested
                      investment[0].totalAmountToPayout = amountToPayoutNow
                      rolloverDone = rolloverDone + 1
                      investment[0].rolloverTarget = rolloverTarget
                      investment[0].rolloverDone = rolloverDone
                      await investment[0].save()
                      investmentData = investment[0]
                      // Save the payment data in payout table
                      payload = investmentData
                      console.log('Payout investment data line 1738:', payload)
                      payout = await Payout.create(payload)
                      payout.status = 'matured'
                      await payout.save()
                      console.log('Matured Payout investment data line 1742:', payout)
                      // send payment details to transction service

                      // initiate a new investment
                      createInvestment(
                        amountToBeReinvested,
                        payloadDuration,
                        payloadInvestmentType,
                        investmentData
                      )

                      console.log(
                        `The Interest of ${currencyCode} ${amountToBeReinvested} was Reinvested and the Principal of ${currencyCode} ${amountToPayoutNow} was paid`
                      )
                      break
                    default:
                      console.log('Nothing was done on this investment')
                      break
                  }
                  return resolve({ payload, amountToBeReinvested, amountToPayoutNow, rolloverDone })
                })
              }

              let testingRolloverImplementation = await effectRollover(
                investmentData,
                amount,
                rolloverType,
                rolloverDone,
                rolloverTarget
              )
              console.log(
                'testing Rollover Implementation line 1773',
                testingRolloverImplementation
              )
              await investment[0].save()
              console.log('Investment data after payout 2:', investment)
              return response.status(200).json({
                status: 'OK',
                data: investment.map((inv) => inv.$original),
              })
            }
          } else {
            // if the investment is terminated
            let payload = investment[0].$original
            // send to Admin for approval
            let userId = payload.userId
            let investmentId = payload.id
            let requestType = 'terminate investment'
            let approvalForTerminationIsAutomated = false
            if (approvalForTerminationIsAutomated === false) {
              let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
              console.log(' Approval request return line 1793 : ', approvalRequestIsDone)
              if (approvalRequestIsDone === undefined) {
                return response.status(400).json({
                  status: 'fail',
                  message: 'termination approval request was not successful, please try again.',
                  data: [],
                })
              }
              console.log('Payout investment data 1:', payload)
              const payout = await Payout.create(payload)
              payout.status = 'terminated'
              await payout.save()
              console.log('Terminated Payout investment data 1:', payout)
              //  END
              investment = await Investment.query().where('id', investmentId)
              investment[0].requestType = requestType
              investment[0].status = 'active'
              investment[0].approvalStatus = 'pending'
              await investment[0].save()
            } else if (approvalForTerminationIsAutomated === true) {
              // if payout was approved
              // send to transaction service
              //  Proceed to payout the Total Amount due on maturity
              try {
                let rate = await sendPaymentDetails(amount, duration, investmentType)
                console.log(' Rate return line 1808 : ', rate)
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
              console.log('Payout investment data 1:', payload)
              const payout = await Payout.create(payload)
              payout.status = 'terminated'
              await payout.save()
              console.log('Terminated Payout investment data 1:', payout)
              //  END
              investment = await Investment.query().where('id', investmentId)
              investment[0].requestType = requestType
              investment[0].status = 'active'
              investment[0].approvalStatus = 'pending'
              await investment[0].save()
              // update datePayoutWasDone
              // @ts-ignore
              // investment[0].datePayoutWasDone = new Date().toISOString()
            }
            await investment[0].save()
            console.log('Terminated Payout investment data line 1847:', investment)
            return response.status(200).json({
              status: 'OK',
              data: investment.map((inv) => inv.$original),
            })
          }
        } else {
          return response.status(404).json({
            status: 'FAILED',
            message: 'no investment matched your search, or payment has been processed.',
            data: {
              paymentStatus: investment.map((inv) => inv.$original.status),
              amountPaid: investment.map((inv) => inv.$original.totalAmountToPayout),
            },
          })
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  public async transactionStatus({ request, response }: HttpContextContract) {
    // const { investmentId } = request.qs()
    console.log('Rate query: ', request.qs())
    // @ts-ignore
    let { userId, investmentId, walletId } = request.all()
    let investment = await Investment.query().where({
      id: investmentId,
      user_id: userId,
      wallet_id: walletId,
    })
    console.log(' QUERY RESULT: ', investment)
    if (investment.length > 0) {
      // investment = await Investment.query().where({id: investmentId,user_id: userId,})

      // Check for Successful Transactions
      let transactionStatus
      // get update from the endpoint with axios
      transactionStatus = 'OK'
      if (transactionStatus !== 'OK') {
        return response.json({
          status: 'FAILED',
          message: 'The transaction was not successful.',
          data: {
            walletId: 1,
            walletBalance: 2500,
            receiverDetails: {
              walletId: 2,
              phone: 2347056435467,
            },
          },
        })
      }
      // Update Account status

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
        walletHolderDetails,
        long,
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
        datePayoutWasDone,
      } = investment[0]

      console.log('Initial status line 1738: ', status)
      console.log('Initial datePayoutWasDone line 1739: ', datePayoutWasDone)
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
        walletHolderDetails,
        long,
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
      // payload.datePayoutWasDone = new Date().toISOString()

      console.log('Payout Payload: ', payload)

      // @ts-ignore
      // let { userId, investmentId, walletId } = request.all()
      let payoutRecord = await PayoutRecord.query().where({
        investment_id: payload.investmentId,
        user_id: userId,
        wallet_id: walletId,
        rollover_target: payload.rolloverTarget,
        rollover_done: payload.rolloverDone,
      })
      console.log(' QUERY RESULT line 1787: ', payoutRecord)
      if (payoutRecord.length > 0) {
        return response.json({
          status: 'OK',
          message: 'Record already exist in the database.',
          data: payoutRecord.map((record) => record.$original),
        })
      }
      // investment[0].totalAmountToPayout = amountPaid
      investment[0].isPayoutSuccessful = isPayoutSuccessful
      investment[0].approvalStatus = 'approved'
      investment[0].status = 'paid'
      // @ts-ignore
      // investment[0].datePayoutWasDone = new Date().toISOString()

      // Save the Update
      await investment[0].save()
      let payout = await PayoutRecord.create(payload)
      // update investment status
      // payout.status = 'paid'
      await payout.save()

      console.log('Payout investment data line 1808:', payout)
      // @ts-ignore
      investment[0].datePayoutWasDone = payout.createdAt

      // Notify

      // Check RollOver Target

      console.log(
        'data:',
        investment.map((inv) => inv.$original)
      )
      await investment[0].save()
      return response.json({ status: 'OK', data: payout.$original })
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }

  public async destroy({ params, request, response }: HttpContextContract) {
    // const { investmentId } = request.qs()
    console.log('Rate query: ', request.qs())
    let investment = await Investment.query().where({
      id: request.input('investmentId'),
      user_id: params.userId,
    })
    console.log(' QUERY RESULT: ', investment)
    if (investment.length > 0) {
      investment = await Investment.query()
        .where({
          id: request.input('investmentId'),
          user_id: params.userId,
        })
        .delete()
      console.log('Deleted data:', investment)
      return response.send('Investment Deleted.')
    } else {
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }
}
