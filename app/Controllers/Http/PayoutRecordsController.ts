/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import PayoutRecord from 'App/Models/PayoutRecord'
// import Investment from 'App/Models/Investment'
// import { DateTime } from 'luxon'
// import { schema, rules } from '@ioc:Adonis/Core/Validator'
// import Event from '@ioc:Adonis/Core/Event'
// import Env from '@ioc:Adonis/Core/Env'
// const axios = require('axios').default

// const API_URL = Env.get('API_URL')

export default class PayoutRecordsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('PayoutRecord params: ', params)
    const { search, limit,userId, investmentId,status } = request.qs()
    console.log('PayoutRecord query: ', request.qs())
    const countPayouts = await PayoutRecord.query().where('status', 'paid').getCount()
    console.log('PayoutRecord Investment count: ', countPayouts)
    const countTerminated = await PayoutRecord.query().where('request_type', 'terminate investment').getCount()
    console.log('Terminated Investment count: ', countTerminated)
    // const PayoutRecord = await Investment.query().offset(0).limit(1)
    const payoutRecord = await PayoutRecord.all()
    let sortedPayouts = payoutRecord
    if (search) {
      sortedPayouts = sortedPayouts.filter((payoutRecord) => {
        // @ts-ignore
        // console.log(' Sorted :', payoutRecord.walletHolderDetails.lastName!.startsWith(search))
        // @ts-ignore
        return payoutRecord.walletHolderDetails.lastName!.startsWith(search)
      })
    }
       if (status) {
         sortedPayouts = sortedPayouts.filter((payoutRecord) => {
           // @ts-ignore
           return payoutRecord.status.includes(status)
         })
       }

       if (userId) {
         sortedPayouts = sortedPayouts.filter((payoutRecord) => {
           // @ts-ignore
           return payoutRecord.userId === userId
         })
       }
       if (investmentId) {
         sortedPayouts = sortedPayouts.filter((payoutRecord) => {
           // @ts-ignore
           return payoutRecord.investmentId === investmentId
         })
       }
    if (limit) {
      sortedPayouts = sortedPayouts.slice(0, Number(limit))
    }
    if (sortedPayouts.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment payout record matched your search',
        data: [],
      })
    }
    // return payoutRecord
    return response.status(200).json({
      status: 'OK',
      data: sortedPayouts.map((payoutRecord) => {
        return payoutRecord.$original
      }),
    })
  }

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const payout = await PayoutRecord.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', payout)
    return response.send('PayoutRecord Delete.')
  }
}
