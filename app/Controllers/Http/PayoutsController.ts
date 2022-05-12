/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Payout from 'App/Models/Payout'
import Investment from 'App/Models/Investment'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import Env from '@ioc:Adonis/Core/Env'
const axios = require('axios').default

const API_URL = Env.get('API_URL')
// @ts-ignore
import {generateRate,interestDueOnPayout,dueForPayout,payoutDueDate, approvalRequest,} from 'App/Helpers/utils'
export default class PayoutsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('PAYOUT params: ', params)
    const { search, limit } = request.qs()
    console.log('PAYOUT query: ', request.qs())
    const countPayouts = await Payout.query().where('status', 'payout').getCount()
    console.log('PAYOUT Investment count: ', countPayouts)
    const countTerminated = await Payout.query().where('status', 'terminated').getCount()
    console.log('Terminated Investment count: ', countTerminated)
    // const payout = await Investment.query().offset(0).limit(1)
    const payout = await Payout.all()
    let sortedPayouts = payout
    if (search) {
      sortedPayouts = sortedPayouts.filter((payout) => {
        // @ts-ignore
        // console.log(' Sorted :', investment.walletHolderDetails.lastName!.startsWith(search))
        // @ts-ignore
        return payout.walletHolderDetails.lastName!.startsWith(search)
      })
    }
    if (limit) {
      sortedPayouts = sortedPayouts.slice(0, Number(limit))
    }
    if (sortedPayouts.length < 1) {
      return response.status(200).json({
        status: 'ok',
        message: 'no investment payout matched your search',
        data: [],
      })
    }
    // return investment
    return response.status(200).json(sortedPayouts)
  }


  public async payout({ request, response }: HttpContextContract) {
    try {
      // @ts-ignore
      // let id = request.input('userId')
      let { userId, investmentId } = request.all()
      console.log('Params for update line 191: ', userId, investmentId)
      // const investment = await Investment.query().where('user_id', id).where('id', params.id).delete()
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      let investment = await Investment.query().where('id', investmentId)
      console.log('Investment Info, line 58: ', investment)
      if (investment.length > 0) {
        console.log('investment search data :', investment[0].$original)
        // @ts-ignore
        let isDueForPayout = await dueForPayout(investment[0].startDate, investment[0].duration)
        console.log('Is due for payout status :', isDueForPayout)

        if (isDueForPayout === true) {
          let payload = investment[0].$original
          // Date payout was effected
          payload.datePayoutWasDone = new Date().toISOString()
          console.log('Payout investment data 1:', payload)
          const payout = await Payout.create(payload)
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
          // Date payout was effected due to termination
          payload.datePayoutWasDone = new Date().toISOString()
          console.log('Payout investment data 1:', payload)
          const payout = await Payout.create(payload)
          payout.status = 'terminated'
          await payout.save()
          console.log('Terminated Payout investment data 1:', payout)
          // investment = await Investment.query().where('id', params.id).where('user_id', id).delete()
          investment = await Investment.query().where('id', investmentId)
          investment[0].status = 'terminated'
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

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const payout = await Payout.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', payout)
    return response.send('Payout Delete.')
  }
}
