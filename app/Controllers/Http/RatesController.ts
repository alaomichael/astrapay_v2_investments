import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Rate from 'App/Models/Rate'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class RatesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('Rate params: ', params)
    const { search, limit } = request.qs()
    console.log('Rate query: ', request.qs())
    const countPayouts = await Rate.query().where('status', 'good').getCount()
    console.log('Rate Investment count: ', countPayouts)
    // const countTerminated = await Rate.query().where('status', 'terminated').getCount()
    // console.log('Terminated Investment count: ', countTerminated)
    // const rate = await Rate.query().offset(0).limit(1)
    const rate = await Rate.all()
    let sortedRates = rate
    if (search) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.walletHolderDetails.lastName!.startsWith(search)
      })
    }
    if (limit) {
      sortedRates = sortedRates.slice(0, Number(limit))
    }
    if (sortedRates.length < 1) {
      return response.status(200).json({
        success: true,
        message: 'no investment rate matched your search',
        data: [],
      })
    }
    // return investment
    return response.status(200).json(sortedRates)
  }

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const rate = await Rate.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', rate)
    return response.send('Rate Delete.')
  }
}
