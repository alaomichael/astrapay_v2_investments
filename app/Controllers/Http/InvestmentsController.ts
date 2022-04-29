import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class InvestmentsController {
  public async index({}: HttpContextContract) {
    // const investment = await Investment.query().preload('user')
    const investment = await Investment.all()
    console.log(
      'INVESTMENT MAPPING: ',
      investment.map((inv) => inv.$extras)
    )
    return investment
  }
  public async show({ params, response }: HttpContextContract) {
    console.log('INVESTMENT params: ', params)
    // console.log('INVESTMENT query params: ', request.ctx)
    try {
      const investment = await Investment.query()
        .where('user_id', params.user_id)
        .where('id', params.id)
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
    return investment
  }

  public async store2({  request }: HttpContextContract) {
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
