/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import Payout from 'App/Models/Payout'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import { DateTime } from 'luxon'
import { string } from '@ioc:Adonis/Core/Helpers'
import Env from '@ioc:Adonis/Core/Env'
const axios = require('axios').default

const API_URL = Env.get('API_URL')
import {
  generateRate,
  interestDueOnPayout,
  dueForPayout,
  payoutDueDate,
  approvalRequest,
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

  public async showPayouts({ params, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    try {
      const investment = await Investment.query().where('status', 'payout')
      // .orWhere('id', params.id)
      // .limit()
      if (investment && investment.length > 0) {
        // console.log('INVESTMENT: ',investment.map((inv) => inv.$extras))
        console.log('INVESTMENT DATA: ', investment)
        return response
          .status(200)
          .json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response
          .status(200)
          .json({ status: 'fail', message: 'no investment has been paid out yet.' })
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async feedbacks({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params line 145: ', params)
    const { userId, investmentId, requestType } = request.qs()
    console.log('INVESTMENT query line 147: ', request.qs())
    let investment = await Investment.all()
    let approvalStatus
    if (requestType === 'start investment') {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvalStatus = await Approval.query()
        .where('requestType', requestType)
        .where('userId', userId)
        .where('investmentId', investmentId)
      // check the approval status
      console.log('approvalStatus line 159: ', approvalStatus)
      if (approvalStatus.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      console.log('approvalStatus line 160: ', approvalStatus[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start investment
      if (approvalStatus[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'initiated')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('INVESTMENT DATA line 167: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment activation approval data matched your query, please try again',
          })
        }
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
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
        // send notification
        console.log('Updated investment Status line 201: ', investment)
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvalStatus.length > 0 && approvalStatus[0].approvalStatus === 'declined') {
        investment = await Investment.query()
          .where('status', 'initiated')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('The declined investment line 208: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment activation decline data matched your query, please try again',
          })
        }

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 222: ',
          investment.map((inv) => inv.$original)
        )

        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvalStatus })
      }
    } else if (requestType === 'terminate investment') {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvalStatus = await Approval.query()
        .where('requestType', requestType)
        .where('userId', userId)
        .where('investmentId', investmentId)
      // check the approval status
      console.log('approvalStatus line 249: ', approvalStatus)
      if (approvalStatus.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment approval request data matched your query, please try again',
        })
      }
      console.log('approvalStatus line 256: ', approvalStatus[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start investment
      if (approvalStatus[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('INVESTMENT DATA line 264: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment termination approval data matched your query, please try again',
          })
        }
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
        // update start date
        investment[0].status = 'terminated'

        // @ts-ignore
        investment[0].datePayoutWasDone = DateTime.now().toISO()
        // investment[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(investment[0].duration)
        // investment[0].payoutDate = DateTime.now().plus({ days: duration })
        // console.log('The currentDate line 284: ', currentDateMs)
        // console.log('Time investment was started line 285: ', investment[0].startDate)
        // console.log('Time investment payout date line 286: ', investment[0].payoutDate)

        // Save
        await investment[0].save()
        // send notification
        console.log('Updated investment Status line 289: ', investment)
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvalStatus.length > 0 && approvalStatus[0].approvalStatus === 'declined') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('The declined investment line 296: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment termination decline data matched your query, please try again',
          })
        }

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 312: ',
          investment.map((inv) => inv.$original)
        )
        return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
      } else {
        return response.json({ status: 'OK', data: approvalStatus.map((inv) => inv.$original) })
      }
    } else if (requestType === 'payout investment') {
      console.log('INVESTMENT ID', investmentId)
      console.log('USER ID', userId)
      // check the approval for request
      approvalStatus = await Approval.query()
        .where('requestType', requestType)
        .where('userId', userId)
        .where('investmentId', investmentId)
      // check the approval status
      console.log('approvalStatus line 338: ', approvalStatus)
      if (approvalStatus.length < 1) {
        return response.json({
          status: 'FAILED',
          message: 'No investment payout request data matched your query, please try again',
        })
      }
      console.log('approvalStatus line 345: ', approvalStatus[0].approvalStatus)
      //  if approved update investment status to active, update startDate,  and start investment
      if (approvalStatus[0].approvalStatus === 'approved') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('INVESTMENT DATA line 353: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment data matched your query, please try again',
          })
        }
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // TODO
        // send investment details to Transaction Service
        // on success

        // update status investment
        // update start date
        investment[0].status = 'payout'
        // let currentDateMs = DateTime.now().toISO()
        // @ts-ignore
        // investment[0].startDate = DateTime.now().toISO()
        // let duration = parseInt(investment[0].duration)
        investment[0].payoutDate = DateTime.now().toISO() //DateTime.now().plus({ days: duration })
        // console.log('The currentDate line 372: ', currentDateMs)
        // console.log('Time investment was started line 373: ', investment[0].startDate)
        console.log('Time investment payout date line 374: ', investment[0].payoutDate)
        // Save
        await investment[0].save()
        // send notification
        console.log('Updated investment Status line 378: ', investment)
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else if (approvalStatus.length > 0 && approvalStatus[0].approvalStatus === 'declined') {
        investment = await Investment.query()
          .where('status', 'active')
          .where('requestType', requestType)
          .where('userId', userId)
          .where('id', investmentId)
        console.log('The declined investment line 385: ', investment)
        if (investment.length < 1) {
          return response.json({
            status: 'FAILED',
            message: 'No investment payout decline data matched your query, please try again',
          })
        }

        // investment[0].status = 'declined'
        investment[0].approvalStatus = approvalStatus[0].approvalStatus
        // await Save
        await investment[0].save()
        // send notification
        console.log(
          'INVESTMENT DATA line 399: ',
          investment.map((inv) => inv.$original)
        )
        return response.json({
          status: 'OK',
          data: investment.map((inv) => inv.$original),
        })
      } else {
        return response.json({ status: 'OK', data: approvalStatus.map((inv) => inv.$original) })
      }
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
    let investmentRate = async function () {
      try {
        const response = await axios.get(
          `${API_URL}/investments/rates?amount=${payload.amount}&duration=${payload.duration}&investmentType=${payload.investmentType}`
        )
        console.log('The API response: ', response.data)
        if (response.data.status === 'OK' && response.data.data.length > 0) {
          return response.data.data[0].interest_rate
        } else {
          return
        }
      } catch (error) {
        console.error(error)
      }
    }

    console.log(' The Rate return for RATE line 541: ', await investmentRate())
    let rate = await investmentRate()
    console.log(' Rate return line 210 : ', rate)
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

    // UPDATE Investment Status based on the response from Transaction Service
    let duration = Number(investment.duration)
    let updatedCreatedAt = DateTime.now().plus({ hours: 2 }).toISODate()
    let updatedPayoutDate = DateTime.now().plus({ days: duration }).toISODate()
    console.log('updated CreatedAt Time : ' + updatedCreatedAt)
    console.log('Updated Payout Date: ' + updatedPayoutDate)
    // Save Investment new status to Database
    await investment.save()
    // Send Investment Initiation Message to Queue

    // Send Approval Request to Admin
    let userId = investment.userId
    let investmentId = investment.id
    let requestType = 'start investment'
    let approval = await approvalRequest(userId, investmentId, requestType)
    console.log(' Approval request return line 280 : ', approval)
    if (approval === undefined) {
      return response.status(400).json({
        status: 'fail',
        message: 'investment approval request was not successful, please try again.',
        data: [],
      })
    }

    // Testing
    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 }).toHTTP() // .toISODate()
    // let testingPayoutDate = DateTime.now().plus({ days: duration }).toHTTP()
    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
    // console.log('Testing Payout Date: ' + testingPayoutDate)
    let newInvestmentId = investment.id
    // @ts-ignore
    let newInvestmentEmail = investment.walletHolderDetails.email
    Event.emit('new:investment', {
      id: newInvestmentId,
      email: newInvestmentEmail,
    })
    return response.status(201).json({ status: 'OK', data: investment.$original })
  }

  // public async rate({ request, response }: HttpContextContract) {
  // let amount = request.input('amount')
  // let duration = request.input('duration')
  //   const { amount, duration, investmentType } = request.qs()
  //   console.log('INVESTMENT RATE query: ', request.qs())
  //   let rate = (await generateRate(amount, duration, investmentType)) * 100
  //   console.log('Investment rate:', rate)
  //   return response.status(200).json({
  //     status: 'OK',
  //     data: rate,
  //   })
  // }

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
      // if (investment) {
      //   // console.log('INVESTMENT: ',investment.map((inv) => inv.$extras))
      //   console.log('INVESTMENT DATA: ', investment)
      //   return response.status(200).json({ status: 'OK', data: investment })
      // }
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
        'Params for update line 644: ',
        +'userId ' + userId + 'investmentId ' + investmentId
      )
      // const investment = await Investment.query().where('user_id', id).where('id', params.id).delete()
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      let investment = await Investment.query().where('id', investmentId)
      console.log('Investment Info, line 648: ', investment)
      if (investment.length > 0) {
        console.log('investment search data :', investment[0].$original)
        // @ts-ignore
        // let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        // console.log('Is due for payout status :', isDueForPayout)

        // TESTING
        let startDate = DateTime.now().minus({ days: 5 }).toISO()
        let duration = 6
        console.log('Time investment was started line 809: ', startDate)
        let isDueForPayout = await dueForPayout(startDate, duration)
        console.log('Is due for payout status line 812:', isDueForPayout)

        if (isDueForPayout) {
          let payload = investment[0].$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'payout investment'
          // let approvalStatus = 'pending'
          let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
          console.log(' Approval request return line 822 : ', approvalRequestIsDone)
          if (approvalRequestIsDone === undefined) {
            return response.status(400).json({
              status: 'FAILED',
              message: 'payout approval request was not successful, please try again.',
              data: [],
            })
          }

          // TODO
          // Move the code below to another function
          // if payout was approved

          // send to transaction service

          // // if transaction was successfully processed
          // // update Date payout was effected
          // payload.datePayoutWasDone = new Date().toISOString()
          // console.log('Payout investment data 1:', payload)
          // const payout = await Payout.create(payload)
          // // update investment status
          // payout.status = 'payout'
          // await payout.save()
          // console.log('Payout investment data 2:', payout)
          // // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          // investment = await Investment.query().where('id', investmentId)
          // investment[0].status = 'payout'
          // investment[0].approvalStatus = approvalStatus
          // // Date payout was effected
          // // @ts-ignore
          // // investment[0].datePayoutWasDone = new Date().toISOString()
          await investment[0].save()
          console.log('Investment data after payout 2:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
        } else {
          let payload = investment[0].$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'terminate investment'
          let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
          console.log(' Approval request return line 702 : ', approvalRequestIsDone)
          if (approvalRequestIsDone === undefined) {
            return response.status(400).json({
              status: 'fail',
              message: 'termination approval request was not successful, please try again.',
              data: [],
            })
          }
          // if payout was approved

          // send to transaction service

          // if transaction was successfully processed
          // update Date payout was effected due to termination

          // TODO
          // Move th code below to a new function that will check payout approval status and update the transaction
          // START
          // payload.datePayoutWasDone = new Date().toISOString()
          // console.log('Payout investment data 1:', payload)
          // const payout = await Payout.create(payload)
          // payout.status = 'terminated'
          // await payout.save()
          // console.log('Terminated Payout investment data 1:', payout)
          //  END
          // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          investment = await Investment.query().where('id', investmentId)
          investment[0].requestType = requestType
          investment[0].status = 'active'
          investment[0].approvalStatus = 'pending'
          // update datePayoutWasDone
          // @ts-ignore
          // investment[0].datePayoutWasDone = new Date().toISOString()
          await investment[0].save()
          console.log('Terminated Payout investment data line 736:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
        }
      } else {
        return response.status(404).json({
          status: 'fail',
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
      // let id = request.input('userId')
      let { userId, investmentId } = request.all()
      console.log(
        'Params for update line 924: ',
        +'userId ' + userId + 'investmentId ' + investmentId
      )
      let investment = await Investment.query().where('id', investmentId)
      console.log('Investment Info, line 928: ', investment)
      if (investment.length > 0) {
        console.log('investment search data :', investment[0].$original)
        // @ts-ignore
        // let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        // console.log('Is due for payout status :', isDueForPayout)


        // Send Payment Details to Transaction Service

        // Notify
        let payoutIsApproved = true
        if (payoutIsApproved) {
          // Check Rollover Type
 let rolloverType = investment[0].rolloverType
let amount = investment[0].amount
 let rolloverTarget = investment[0].rolloverTarget
 let rolloverDone = investment[0].rolloverDone
if (rolloverType === '100') {
  //  Proceed to payout the Total Amount due on maturity
  return response.send({ status: 'OK', message: 'No Rollover was set on this investment.' })
}
  // Check RollOver Target
 if (rolloverDone === rolloverTarget) {
   //  Proceed to payout the Total Amount due on maturity
   return response.send({ status: 'OK', message: 'Rollover target has been reached.' })
 } else {
   /**
    * .enum('rollover_type', ['100' = 'no rollover',
    *  '101' = 'rollover principal only',
    * '102' = 'rollover principal with interest',
    * '103' = 'rollover interest only'])
    */
   const effectRollover = (investment, amount, rolloverType, rolloverDone, rolloverTarget) => {
     return new Promise((resolve, reject) => {
       if (!investment || !amount || !rolloverType || !rolloverDone || rolloverTarget|| rolloverTarget <= 0)
         reject(
           new Error(
             'Incomplete parameters , or no rollover target was set, or is less than allowed range'
           )
         )
       let payload
       let amountToPayoutNow
       let amountToBeReinvested
       switch (rolloverType) {
         case '101':
                  amountToBeReinvested = amount
                  amountToPayoutNow = investment.interestDueOnInvestment
                  payload.amount = amountToBeReinvested

           console.log(
             `Principal of ${amountToBeReinvested} was Reinvested and the interest of ${investment.currencyCode} ${amountToPayoutNow} was paid`
           )
           break
         case '102':
        amountToBeReinvested = amount + investment.interestDueOnInvestment
        // amountToPayoutNow = investment.interestDueOnInvestment
        payload.amount = amountToBeReinvested

        console.log(
          `The Sum Total of the Principal and the interest of ${investment.currencyCode} ${amountToBeReinvested} was Reinvested`
        )
           break
         case '103':
           amountToBeReinvested =  investment.interestDueOnInvestment
           amountToPayoutNow = amount
           payload.amount = amountToBeReinvested

           console.log(
             `The Interest of ${investment.currencyCode} ${amountToBeReinvested} was Reinvested and the Principal of ${investment.currencyCode} ${amountToPayoutNow} was paid`
           )
           break
         default:
console.log('Nothing was done on investment')
           break
       }
       return resolve({ payload, amountToBeReinvested, amountToPayoutNow })
     })
   }
   let payload = investment[0].$original
   // send to Admin for approval
   let userId = payload.userId
   let investmentId = payload.id
   let requestType = 'payout investment'
   // let approvalStatus = 'pending'
   let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
   console.log(' Approval request return line 822 : ', approvalRequestIsDone)
   if (approvalRequestIsDone === undefined) {
     return response.status(400).json({
       status: 'FAILED',
       message: 'payout approval request was not successful, please try again.',
       data: [],
     })
   }

   // TODO
   // Move the code below to another function
   // if payout was approved

   // send to transaction service

   // // if transaction was successfully processed
   // // update Date payout was effected
   // payload.datePayoutWasDone = new Date().toISOString()
   // console.log('Payout investment data 1:', payload)
   // const payout = await Payout.create(payload)
   // // update investment status
   // payout.status = 'payout'
   // await payout.save()
   // console.log('Payout investment data 2:', payout)
   // // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
   // investment = await Investment.query().where('id', investmentId)
   // investment[0].status = 'payout'
   // investment[0].approvalStatus = approvalStatus
   // // Date payout was effected
   // // @ts-ignore
   // // investment[0].datePayoutWasDone = new Date().toISOString()
   await investment[0].save()
   console.log('Investment data after payout 2:', investment)
   return response.status(200).json({
     status: 'OK',
     data: investment.map((inv) => inv.$original),
   })
 } }else {
          let payload = investment[0].$original
          // send to Admin for approval
          let userId = payload.userId
          let investmentId = payload.id
          let requestType = 'terminate investment'
          let approvalRequestIsDone = await approvalRequest(userId, investmentId, requestType)
          console.log(' Approval request return line 702 : ', approvalRequestIsDone)
          if (approvalRequestIsDone === undefined) {
            return response.status(400).json({
              status: 'fail',
              message: 'termination approval request was not successful, please try again.',
              data: [],
            })
          }
          // if payout was approved

          // send to transaction service

          // if transaction was successfully processed
          // update Date payout was effected due to termination

          // TODO
          // Move th code below to a new function that will check payout approval status and update the transaction
          // START
          // payload.datePayoutWasDone = new Date().toISOString()
          // console.log('Payout investment data 1:', payload)
          // const payout = await Payout.create(payload)
          // payout.status = 'terminated'
          // await payout.save()
          // console.log('Terminated Payout investment data 1:', payout)
          //  END
          // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          investment = await Investment.query().where('id', investmentId)
          investment[0].requestType = requestType
          investment[0].status = 'active'
          investment[0].approvalStatus = 'pending'
          // update datePayoutWasDone
          // @ts-ignore
          // investment[0].datePayoutWasDone = new Date().toISOString()
          await investment[0].save()
          console.log('Terminated Payout investment data line 736:', investment)
          return response.status(200).json({
            status: 'OK',
            data: investment.map((inv) => inv.$original),
          })
        }
      } else {
        return response.status(404).json({
          status: 'fail',
          message: 'no investment matched your search',
          data: [],
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  public async transactionStatus({ params, request, response }: HttpContextContract) {
    // const { investmentId } = request.qs()
    console.log('Rate query: ', request.qs())
    let investment = await Investment.query().where({
      id: request.input('investmentId'),
      user_id: params.userId,
    })
    console.log(' QUERY RESULT: ', investment)
    if (investment.length > 0) {
      investment = await Investment.query().where({
        id: request.input('investmentId'),
        user_id: params.userId,
      })

      // Check for Successful Transactions

      // Update Account status

      // Notify

      // Check RollOver Target

      console.log(
        'data:',
        investment.map((inv) => inv.$original)
      )
      return response.json({ status: 'OK', data: investment.map((inv) => inv.$original) })
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
