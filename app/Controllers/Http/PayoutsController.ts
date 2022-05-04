/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class PayoutsController {

     public async index({ params, request, response }: HttpContextContract) {
    console.log('PAYOUT params: ', params)
    const { search, limit } = request.qs()
    console.log('PAYOUT query: ', request.qs())
    const count = await Payout.query().where('currency_code', 'NGN').getCount()
    console.log('PAYOUT count: ', count)
    // const investment = await Investment.query().offset(0).limit(1)
    const payout = await Payout.all()
    let sortedInvestments = payout
    if (search) {
      sortedInvestments = sortedInvestments.filter((payout) => {
        // @ts-ignore
        // console.log(' Sorted :', investment.walletHolderDetails.lastName!.startsWith(search))
        // @ts-ignore
        return investment.walletHolderDetails.lastName!.startsWith(search)
      })
    }
    if (limit) {
      sortedInvestments = sortedInvestments.slice(0, Number(limit))
    }
    if (sortedInvestments.length < 1) {
      return response.status(200).json({
        success: true,
        message: 'no investment matched your search',
        data: [],
      })
    }
}
