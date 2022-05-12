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
// @ts-ignore
import { generateRate, interestDueOnPayout, dueForPayout, payoutDueDate, approvalRequest,} from 'App/Helpers/utils'
export default class InvestmentsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    const { search, limit, requestType } = request.qs()
    console.log('INVESTMENT query: ', request.qs())
    const count = await Investment.query().where('currency_code', 'NGN').getCount()
    console.log('INVESTMENT count: ', count)
    // const investment = await Investment.query().offset(0).limit(1)
    const investment = await Investment.all()
    let sortedInvestments = investment
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
      if (investment.length > 0) {
        console.log('INVESTMENT DATA: ', investment)
        if (limit) {
          investment = investment.slice(0, Number(limit))
        }
        return response.status(200).json({ status: 'ok', data: investment })
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
        return response.status(200).json({ status: 'ok', data: investment })
      } else {
        return response
          .status(200)
          .json({ status: 'fail', message: 'no investment has been paid out yet.' })
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async feedbacks({ params, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    try {
let testAmount = 200000
let testDuration = 90
let testInvestmentType = 'fixed'
    let investmentRate = async function () {
      try {
        const response = await axios.get(
          `${API_URL}/investments/rates?amount=${testAmount}&duration=${testDuration}&investmentType=${testInvestmentType}`
        )
        console.log('The API response: ', response.data)
        if (response.data.status === 'ok' && response.data.data.length > 0) {
          return response.data.data[0].interest_rate
        } else {
          return
        }
      } catch (error) {
        console.error(error)
      }
    }

    console.log(' The Rate return for RATE: ', await investmentRate())
    let rate = await investmentRate()
    console.log(' Rate return line 151 : ', rate)
    if (rate === undefined) {
      return response.status(400).json({
        status: 'fail',
        message: 'no investment rate matched your search, please try again.',
        data: [],
      })
    }

const investment = await rate
      // const investment = await Investment.query().where('status', 'pending')
      // .orWhere('id', params.id)
      // .limit()
      if (investment && investment.length > 0) {
        // console.log('INVESTMENT: ',investment.map((inv) => inv.$extras))
        console.log('INVESTMENT DATA: ', investment)
        return response.status(200).json({ status: 'ok', data: investment })
      } else {
        return response
          .status(200)
          .json({ status: 'fail', message: 'no investment has been pending yet.' })
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      let investment = await Investment.query().where({
        user_id: request.input('userId'),
        id: request.input('investmentId'),
      })
      if (investment.length > 0) {
        console.log('Investment Selected for Update:', investment)
let isDueForPayout
        try {
          // let isDueForPayout = await dueForPayout(investment[0].createdAt, investment[0].duration)
          isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
          console.log('Is due for payout status :', isDueForPayout)
        } catch (error) {
          console.error('Is due for payout status Error :', error)
          return response.json({ status: 'fail', data: error.message })
        }

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
            return response.json({ status: 'ok', data: investment })
          }
          return // 422
        } else {
          return response.json({ status: 'fail', data: investment })
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
        if (response.data.status === 'ok' && response.data.data.length > 0) {
          return response.data.data[0].interest_rate
        } else {
          return
        }
      } catch (error) {
        console.error(error)
      }
    }

    console.log(' The Rate return for RATE 2: ', await investmentRate())
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
    // return response.ok(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)

    // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate

    investment.interestRate = rate

    // When the Invest has been approved and activated
    let amountDueOnPayout = await interestDueOnPayout(investment.amount, rate, investment.duration)
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

    // @ts-ignore
    Event.emit('new:investment', { id: investment.id, email: investment.walletHolderDetails.email })
    return response.status(201).json({ status: 'ok', data: investment })
  }

  // public async rate({ request, response }: HttpContextContract) {
    // let amount = request.input('amount')
    // let duration = request.input('duration')
  //   const { amount, duration, investmentType } = request.qs()
  //   console.log('INVESTMENT RATE query: ', request.qs())
  //   let rate = (await generateRate(amount, duration, investmentType)) * 100
  //   console.log('Investment rate:', rate)
  //   return response.status(200).json({
  //     status: 'ok',
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
            return response.status(200).json({ status: 'ok', data: investment })
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
      //   return response.status(200).json({ status: 'ok', data: investment })
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
          status: 'ok',
          message: 'no investment approval request matched your search',
          data: [],
        })
      }
      // return rate(s)
      return response.status(200).json({
        status: 'ok',
        data: sortedApprovalRequest,
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
      console.log('Params for update line 492: ', userId, investmentId)
      // const investment = await Investment.query().where('user_id', id).where('id', params.id).delete()
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      let investment = await Investment.query().where('id', investmentId)
      console.log('Investment Info, line 496: ', investment)
      if (investment.length > 0) {
        console.log('investment search data :', investment[0].$original)
        // @ts-ignore
        let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        console.log('Is due for payout status :', isDueForPayout)

        if (isDueForPayout) {
          let payload = investment[0].$original
          // send to Admin for approval

          // if payout was approved

          // send to transaction service

          // if transaction was successfully processed
          // update Date payout was effected
          payload.datePayoutWasDone = new Date().toISOString()
          console.log('Payout investment data 1:', payload)
          const payout = await Payout.create(payload)
          // update investment status
          payout.status = 'payout'
          await payout.save()
          console.log('Payout investment data 2:', payout)
          // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          investment = await Investment.query().where('id', investmentId)
          investment[0].status = 'payout'
          // Date payout was effected
          // @ts-ignore
          investment[0].datePayoutWasDone = new Date().toISOString()
          investment[0].save()
          console.log('Investment data after payout 2:', investment)
          return response.status(200).json({
            status: 'ok',
            data: investment,
          })
        } else {
          let payload = investment[0].$original
          // send to Admin for approval

          // if payout was approved

          // send to transaction service

          // if transaction was successfully processed
          // update Date payout was effected due to termination
          payload.datePayoutWasDone = new Date().toISOString()
          console.log('Payout investment data 1:', payload)
          const payout = await Payout.create(payload)
          payout.status = 'terminated'
          await payout.save()
          console.log('Terminated Payout investment data 1:', payout)
          // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          investment = await Investment.query().where('id', investmentId)
          investment[0].status = 'terminated'

          // update datePayoutWasDone
          // @ts-ignore
          investment[0].datePayoutWasDone = new Date().toISOString()
          investment[0].save()
          console.log('Terminated Payout investment data 2:', investment)
          return response.status(200).json({
            status: 'ok',
            data: investment,
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
