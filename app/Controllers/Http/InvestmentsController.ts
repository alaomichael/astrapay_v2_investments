/* eslint-disable prettier/prettier */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Investment from 'App/Models/Investment'
import Payout from 'App/Models/Payout'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
// @ts-ignore
import { generateRate, interestDueOnPayout, dueForPayout, payoutDueDate } from 'App/Helpers/utils'
export default class InvestmentsController {
  public async index({ params, request, response }: HttpContextContract) {
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
      // @ts-ignore
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

  public async update({ request, params, response }: HttpContextContract) {
    try {
      let investment = await Investment.query().where({
        user_id: params.id,
        id: request.input('investmentId'),
      })
      if (investment.length > 0) {
        console.log('Investment Selected for Update:', investment)
        let isDueForPayout = await dueForPayout(investment[0].createdAt, investment[0].duration)
        console.log('Is due for payout status :', isDueForPayout)
        // Restrict update to timed/fixed deposit only
        if (
          investment &&
          investment[0].investmentType !== 'debenture' &&
          isDueForPayout === false
        ) {
          investment[0].amount = request.input('amount')
          investment[0].duration = request.input('duration')
          investment[0].rolloverType = request.input('rolloverType')
          investment[0].investmentType = request.input('investmentType')

          if (investment) {
            // send to user
            await investment[0].save()
            console.log('Update Investment:', investment)
            return investment
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

  public async store({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
    const investmentSchema = schema.create({
      amount: schema.number(),
      rolloverType: schema.enum(['200' , '201']),
      investmentType: schema.enum(['fixed','debenture']),
      duration: schema.string({ escape: true }, [rules.maxLength(100)]),
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
      })
    })
    const payload: any = await request.validate({ schema: investmentSchema })
    const investment = await Investment.create(payload)
    // const newInvestment = request.all() as Partial<Investment>
    // const investment = await Investment.create(newInvestment)
    // return response.ok(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)

    // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate
    let rate = await generateRate(investment.amount, investment.duration, investment.investmentType)
    investment.interestRate = rate
    let amountDueOnPayout = await interestDueOnPayout(investment.amount, rate, investment.duration)
    investment.interestDueOnInvestment = amountDueOnPayout
    investment.totalAmountToPayout = investment.amount + amountDueOnPayout
    investment.payoutDate = await payoutDueDate(investment.createdAt, investment.duration)
    // @ts-ignore
    investment.walletId = investment.walletHolderDetails.investorFundingWalletId
    await investment.save()
    console.log('The new investment:', investment)
    // ... code to create a new investment
    // @ts-ignore
    Event.emit('new:investment', { id: investment.id, email: investment.walletHolderDetails.email })
    return investment
  }

  // public async store2({ request }: HttpContextContract) {
  //   // const user = await auth.authenticate()
  //   const investment = new Investment()
  //   investment.amount = request.input('amount')
  //   investment.duration = request.input('duration')
  //   investment.rolloverType = request.input('rolloverType')
  //   investment.tagName = request.input('tagName')
  //   investment.currencyCode = request.input('currencyCode')
  //   investment.long = request.input('long')
  //   investment.lat = request.input('lat')
  //   investment.walletHolderDetails = request.input('walletHolderDetails')
  //   //  investment.walletHolderDetails = JSON.stringify(request.input('walletHolderDetails'))
  //   console.log('Investment:', investment)
  //   // await user.related('investments').save(investment)
  //   return investment
  // }

  public async rate({ request, response }: HttpContextContract) {
    // let amount = request.input('amount')
    // let duration = request.input('duration')
    const { amount, duration, investmentType } = request.qs()
    console.log('INVESTMENT RATE query: ', request.qs())
    let rate = (await generateRate(amount, duration, investmentType)) * 100
    console.log('Investment rate:', rate)
    return response.status(200).json({
      status: 'ok',
      data: rate,
    })
  }

  public async payout({ request, response, params }: HttpContextContract) {
    try {
      // @ts-ignore
      // let id = request.input('userId')
      let { userId, investmentId } = request.all()
      console.log('Params for update line 191: ', userId, investmentId)
      // const investment = await Investment.query().where('user_id', id).where('id', params.id).delete()
      // let investment = await Investment.query().where('user_id', id).where('id', params.id)
      let investment = await Investment.query().where('id', investmentId)
      console.log('investment search data :', investment[0].$original)
      // @ts-ignore
      let isDueForPayout = await dueForPayout(investment[0].createdAt, investment[0].duration)
      console.log('Is due for payout status :', isDueForPayout)

      if (isDueForPayout) {
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
        investment[0].datePayoutWasDone = new Date().toISOString()
        investment[0].save()
        console.log('Terminated Payout investment data 2:', investment)
        return response.status(200).json({
          status: 'ok',
          data: investment,
        })
      }
    } catch (error) {
      console.error(error)
    }
  }
}
