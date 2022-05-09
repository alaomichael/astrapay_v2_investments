import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Rate from 'App/Models/Rate'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class RatesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('Rate params: ', params)
    const { duration, limit, amount } = request.qs()
    console.log('Rate query: ', request.qs())
    const countPayouts = await Rate.query().where('status', 'active').getCount()
    console.log('Rate Investment count: ', countPayouts)
    // const countTerminated = await Rate.query().where('status', 'terminated').getCount()
    // console.log('Terminated Investment count: ', countTerminated)
    // const rate = await Rate.query().offset(0).limit(1)
    const rate = await Rate.all()
    let sortedRates = rate
    if (duration) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.duration!.startsWith(duration)
      })
    }
    if (amount) {
      // @ts-ignore
      sortedRates = await Rate.query().has('lowest_amount', '==', amount).orHas('highest_amount', '>=' ,amount)
      return sortedRates
      // sortedRates = sortedRates.filter((rate) => {
      //   // @ts-ignore
      //   return rate.amount!.startsWith(amount)
      // })
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

  public async store({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
    const rateSchema = schema.create({
      productName: schema.string({ escape: true }, [rules.maxLength(20)]),
      lowestAmount: schema.number(),
      highestAmount: schema.number(),
      duration: schema.string({ escape: true }, [rules.maxLength(4)]),
      rolloverCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      investmentType: schema.string({ escape: true }, [rules.maxLength(50)]),
      interestRate: schema.number(),
      tagName: schema.string({ escape: true }, [rules.maxLength(100)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      additionalDetails: schema.object().members({}),
      long: schema.number(),
      lat: schema.number(),
      status: schema.string({ escape: true }, [rules.maxLength(20)]),
    })
    const payload: any = await request.validate({ schema: rateSchema })
    const rate = await Rate.create(payload)
    // const newInvestment = request.all() as Partial<Investment>
    // const investment = await Investment.create(newInvestment)
    // return response.ok(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)

    // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate
    // let rate = await generateRate(investment.amount, investment.duration, investment.investmentType)
    // @ts-ignore
    rate.status = 'active'
    await rate.save()
    console.log('The new investment:', rate)

    // TODO
    console.log('A New Rate has been Created.')

    // Save Rate new status to Database
    await rate.save()
    // Send Rate Creation Message to Queue

    // @ts-ignore
    Event.emit('new:rate', { id: rate.id, extras: rate.additionalDetails })
    return rate
  }

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const rate = await Rate.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', rate)
    return response.send('Rate Delete.')
  }
}
