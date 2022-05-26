import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TaxRecord from 'App/Models/TaxRecord'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class TaxRecordsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('taxRecord params: ', params)
    const { state, lga, taxCode, rate, income, taxDeducted, userId, investmentId, limit } =
      request.qs()
    console.log('taxRecord query: ', request.qs())
    const countActiveTaxRecords = await TaxRecord.query().where('state', 'oyo').getCount()
    console.log('taxRecord count: ', countActiveTaxRecords)

    // const taxRecord = await TaxRecord.query().offset(0).limit(1)
    const taxRecord = await TaxRecord.all()
    let sortedTaxRecord = taxRecord

    if (rate) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.rate === parseInt(rate)
      })
    }

    if (income) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.income === parseInt(income)
      })
    }

    if (taxDeducted) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.taxDeducted === parseInt(taxDeducted)
      })
    }

    if (userId) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.userId === parseInt(userId)
      })
    }

    if (investmentId) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.investmentId === parseInt(investmentId)
      })
    }

    if (state) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.state!.includes(state)
      })
    }

    if (lga) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.lga.includes(lga)
      })
    }

    if (taxCode) {
      sortedTaxRecord = sortedTaxRecord.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.taxCode.includes(taxCode)
      })
    }

    if (limit) {
      sortedTaxRecord = sortedTaxRecord.slice(0, Number(limit))
    }
    if (sortedTaxRecord.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment taxRecord matched your search',
        data: [],
      })
    }
    // return taxRecord(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedTaxRecord.map((taxRecord) => taxRecord.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const taxSchema = schema.create({
      state: schema.string({ escape: true }, [rules.maxLength(50)]),
      lga: schema.string({ escape: true }, [rules.maxLength(100)]),
      taxCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      rate: schema.number(),
      income: schema.number(),
      taxDeducted: schema.number(),
      userId: schema.number(),
      investmentId: schema.number(),
      investorDetails: schema.object().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        investorFundingWalletId: schema.string(),
      }),
    })
    const payload: any = await request.validate({ schema: taxSchema })
    const taxRecord = await TaxRecord.create(payload)

    await taxRecord.save()
    console.log('The new taxRecord rate:', taxRecord)

    // TODO
    console.log('A New taxRecord has been Created.')

    // Save taxRecord new status to Database
    await taxRecord.save()
    // Send taxRecord Creation Message to Queue

    // @ts-ignore
    Event.emit('new:taxRecord', { id: taxRecord.id, extras: taxRecord.additionalDetails })
    return response.json({ status: 'OK', data: taxRecord.$original })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { state } = request.qs()
      console.log('TaxRecord query: ', request.qs())

      let taxRecord = await TaxRecord.query().where({
        state: state,
      })
      console.log(' QUERY RESULT: ', taxRecord)
      if (taxRecord.length > 0) {
        console.log('Investment taxRecord Selected for Update:', taxRecord)
        if (taxRecord) {
          taxRecord[0].state = request.input('state') ? request.input('state') : taxRecord[0].state
          taxRecord[0].lga = request.input('lga') ? request.input('lga') : taxRecord[0].lga
          taxRecord[0].taxCode = request.input('taxCode')
            ? request.input('taxCode')
            : taxRecord[0].taxCode
          taxRecord[0].rate = request.input('rate') ? request.input('rate') : taxRecord[0].rate
          taxRecord[0].income = request.input('income')
            ? request.input('income')
            : taxRecord[0].income
          taxRecord[0].taxDeducted = request.input('taxDeducted')
            ? request.input('taxDeducted')
            : taxRecord[0].taxDeducted

          taxRecord[0].userId = request.input('userId')
            ? request.input('userId')
            : taxRecord[0].userId
          taxRecord[0].investmentId = request.input('investmentId')
            ? request.input('investmentId')
            : taxRecord[0].investmentId
          taxRecord[0].investorDetails = request.input('investorDetails')
            ? request.input('investorDetails')
            : taxRecord[0].investorDetails
          if (taxRecord) {
            // send to user
            await taxRecord[0].save()
            console.log('Update Investment taxRecord:', taxRecord)
            return taxRecord
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: taxRecord })
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
    const { id } = request.qs()
    console.log('TaxRecord query: ', request.qs())

    let taxRecord = await TaxRecord.query().where({
      id: id,
    })
    console.log(' QUERY RESULT: ', taxRecord)

    if (taxRecord.length > 0) {
      taxRecord = await TaxRecord.query()
        .where({
          id: id,
        })
        .delete()
      console.log('Deleted data:', taxRecord)
      return response.send('taxRecord Delete.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}
