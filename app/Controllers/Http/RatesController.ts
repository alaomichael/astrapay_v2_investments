import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Rate from 'App/Models/Rate'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class RatesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('Rate params: ', params)
    const {
      duration,
      limit,
      amount,
      investmentType,
      rolloverCode,
      status,
      typeName,
      interestRate,
    } = request.qs()
    console.log('Rate query line 19: ', request.qs())
    const countActiveRates = await Rate.query().where('status', 'active').getCount()
    console.log('Rate Investment count: ', countActiveRates)
    // const countSuspended = await Rate.query().where('status', 'suspended').getCount()
    // console.log('Liquidated Investment count: ', countSuspended)
    // const rate = await Rate.query().offset(0).limit(1)
    const rate = await Rate.all()
    let sortedRates = rate
    if (amount) {
      // @ts-ignore
      sortedRates = await Rate.query()
        .where('lowest_amount', '<=', amount)
        .andWhere('highest_amount', '>=', amount)
    }

    if (duration) {
      sortedRates = sortedRates.filter((rate) => {
        // console.log(' Rate Duration:', rate.duration)
        // console.log(' Query Duration:', duration)
        // @ts-ignore
        return rate.duration === duration
      })
    }

    if (investmentType) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.investmentType!.includes(investmentType)
      })
    }

    if (rolloverCode) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.rolloverCode!.includes(rolloverCode)
      })
    }

    if (typeName) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.typeName!.includes(typeName)
      })
    }
    if (status) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.status === `${status}`
      })
    }

    if (interestRate) {
      sortedRates = sortedRates.filter((rate) => {
        // @ts-ignore
        return rate.interestRate === parseInt(interestRate)
      })
    }
    if (limit) {
      sortedRates = sortedRates.slice(0, Number(limit))
    }
    // console.log('sortedRates line 79: ', sortedRates)

    if (sortedRates.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment rate matched your search',
        data: null,
      })
    }
    // return rate(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedRates.map((rate) => rate.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const rateSchema = schema.create({
      typeName: schema.string({ escape: true }, [rules.maxLength(20)]),
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
    // return response.OK(investment)
    // The code below only work when there is auth
    // await user.related('investments').save(investment)

    // generateRate, interestDueOnPayout, dueForPayout, payoutDueDate
    // let rate = await generateRate(investment.amount, investment.duration, investment.investmentType)
    // @ts-ignore
    // rate.status = 'active'
    await rate.save()
    // console.log('The new investment:', rate)

    console.log('A New Rate has been Created.')

    // Save Rate new status to Database
    await rate.save()
    // Send Rate Creation Message to Queue

    // @ts-ignore
    Event.emit('new:rate', { id: rate.id, extras: rate.additionalDetails })
    return response.status(200).json({
      status: 'OK',
      data: rate.$original,
    })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { typeName, rateId } = request.qs()
      console.log('Rate query: ', request.qs())
      // let rate = await Rate.query().where({
      //   type_name: request.input('typeName'),
      //   id: request.input('rateId'),
      // })
      let rate = await Rate.query().where({
        type_name: typeName,
        id: rateId,
      })
      // console.log(' QUERY RESULT: ', rate)
      if (rate.length > 0) {
        // console.log('Investment rate Selected for Update:', rate)
        if (rate) {
          rate[0].productName = request.input('newProductName')
            ? request.input('newProductName')
            : rate[0].productName
          rate[0].lowestAmount = request.input('lowestAmount')
            ? request.input('lowestAmount')
            : rate[0].lowestAmount
          rate[0].highestAmount = request.input('highestAmount')
            ? request.input('highestAmount')
            : rate[0].highestAmount
          rate[0].duration = request.input('duration')
            ? request.input('duration')
            : rate[0].duration
          rate[0].rolloverCode = request.input('rolloverCode')
            ? request.input('rolloverCode')
            : rate[0].rolloverCode
          rate[0].investmentType = request.input('investmentType')
            ? request.input('investmentType')
            : rate[0].investmentType
          rate[0].interestRate = request.input('interestRate')
            ? request.input('interestRate')
            : rate[0].interestRate
          rate[0].tagName = request.input('tagName') ? request.input('tagName') : rate[0].tagName
          rate[0].additionalDetails = request.input('additionalDetails')
            ? request.input('additionalDetails')
            : rate[0].additionalDetails
          rate[0].long = request.input('long') ? request.input('long') : rate[0].long
          rate[0].lat = request.input('lat') ? request.input('lat') : rate[0].lat
          rate[0].status = request.input('status') ? request.input('status') : rate[0].status

          if (rate) {
            // send to user
            await rate[0].save()
            // console.log('Update Investment rate:', rate)
            return response.status(200).json({
              status: 'OK',
              data: rate.map((rate) => {
                return rate.$original
              }),
            })
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: rate })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'FAILED', message: 'No data match your query parameters' })
      }
    } catch (error) {
      console.error(error)
    }
    // return // 401
  }

  public async destroy({ request, response }: HttpContextContract) {
    // let id = request.input('rateId')
    const { typeName, rateId } = request.qs()
    console.log('Rate query: ', request.qs())
    // let rate = await Rate.query().where({
    //   type_name: request.input('typeName'),
    //   id: request.input('rateId'),
    // })
    let rate = await Rate.query().where({
      type_name: typeName,
      id: rateId,
    })
    // console.log(' QUERY RESULT: ', rate)

    if (rate.length > 0) {
      rate = await Rate.query()
        .where({
          type_name: typeName,
          id: rateId,
        })
        .delete()
      // console.log('Deleted data:', rate)
      return response.send('Rate Delete.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}
