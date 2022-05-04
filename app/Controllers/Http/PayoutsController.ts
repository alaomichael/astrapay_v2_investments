/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Payout from 'App/Models/Payout'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class PayoutsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('PAYOUT params: ', params)
    const { search, limit } = request.qs()
    console.log('PAYOUT query: ', request.qs())
    const countPayouts = await Payout.query().where('status', 'on going').getCount()
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
        success: true,
        message: 'no investment payout matched your search',
        data: [],
      })
    }
  }

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const payout = await Payout.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', payout)
    return response.send('Payout Delete.')
  }
}
