/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import {EventsList} from '@ioc:Adonis/Core/Event'

export default class InvestmentsController {
  public async index(
    { params, request, response }: HttpContextContract,
    { user, type }: EventsList['auth::send-code']
  ) {
    console.log('INVESTMENT params: ', params)
    const { search, limit } = request.qs()
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
    // console.log('INVESTMENT MAPPING: ',investment.map((inv) => inv.$extras))
    // console.log('INVESTMENT based on sorting & limit: ', sortedInvestments)
    // @ts-ignore
    Event.emit('list:investments', {
      id: investment[0].id,
      email: investment[0].walletHolderDetails.email,
    })
    // return investment
    return response.status(200).json(sortedInvestments)
  }
  public async show({ params, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    // console.log('INVESTMENT query: ', request)

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
      const investment = await Investment.query()
        .where('id', params.id)
        .andWhere('user_id', params.user_id)
      // .limit()
      if (investment) {
        // console.log('INVESTMENT: ',investment.map((inv) => inv.$extras))
        console.log('INVESTMENT DATA: ', investment)
        return response.status(200).json({ investment })
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async update({ request, params }: HttpContextContract) {
    let investment = await Investment.query().where({
      user_id: params.id,
      id: request.input('investmentId'),
    })
    console.log('Update Investment:', investment)
    if (investment) {
      investment[0].amount = request.input('amount')
      investment[0].period = request.input('period')
      investment[0].rolloverType = request.input('rolloverType')

      if (investment) {
        // send to user
        await investment[0].save()
        console.log('Update Investment:', investment)
        return investment
      }
      return // 422
    }
    return // 401
  }

  public async store({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investmentSchema = schema.create({
      amount: schema.number(),
      rolloverType: schema.string({ escape: true }, [rules.maxLength(3)]),
      period: schema.string({ escape: true }, [rules.maxLength(100)]),
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
    const investment = await Investment.create(payload)
    // const newInvestment = request.all() as Partial<Investment>
    // const investment = await Investment.create(newInvestment)
    // return response.ok(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)
    // ... code to create a new investment
    // @ts-ignore
    Event.emit('new:investment', { id: investment.id, email: investment.walletHolderDetails.email })
    return investment
  }

  public async store2({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investment = new Investment()
    investment.amount = request.input('amount')
    investment.period = request.input('period')
    investment.rolloverType = request.input('rolloverType')
    investment.tagName = request.input('tagName')
    investment.currencyCode = request.input('currencyCode')
    investment.long = request.input('long')
    investment.lat = request.input('lat')
    investment.walletHolderDetails = request.input('walletHolderDetails')
    //  investment.walletHolderDetails = JSON.stringify(request.input('walletHolderDetails'))
    console.log('Investment:', investment)
    // await user.related('investments').save(investment)
    return investment
  }

  public async destroy({ request, response, params }: HttpContextContract) {
    let id = request.input('userId')
    const investment = await Investment.query().where('user_id', id).where('id', params.id).delete()
    console.log('Deleted data:', investment)
    return response.send('Investment Delete or Payout.')
  }
}
