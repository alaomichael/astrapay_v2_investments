import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TaxRecord from 'App/Models/TaxRecord'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class TaxRecordsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('taxRecord params: ', params)
    const {
      fundingWalletId,
      isPayoutAutomated,
      fundingSourceTerminal,
      isInvestmentAutomated,
      isTerminationAutomated,
      investmentType,
      tagName,
      currencyCode,
      limit,
    } = request.qs()
    console.log('taxRecord query: ', request.qs())
    const countActiveTaxRecords = await TaxRecord.query().where('state', 'oyo').getCount()
    console.log('taxRecord count: ', countActiveTaxRecords)

    // const taxRecord = await TaxRecord.query().offset(0).limit(1)
    const taxRecord = await TaxRecord.all()
    let sortedTax = taxRecord

    if (fundingWalletId) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.fundingWalletId === parseInt(fundingWalletId)
      })
    }

    if (investmentType) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.investmentType!.includes(investmentType)
      })
    }

    if (isPayoutAutomated) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.isPayoutAutomated.toString() === isPayoutAutomated
      })
    }

    if (isInvestmentAutomated) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.isInvestmentAutomated.toString() === isInvestmentAutomated
      })
    }

    if (isTerminationAutomated) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.isTerminationAutomated.toString() === isTerminationAutomated
      })
    }

    if (fundingSourceTerminal) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.fundingSourceTerminal!.includes(fundingSourceTerminal)
      })
    }

    if (tagName) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.tagName!.includes(tagName)
      })
    }

    if (currencyCode) {
      sortedTax = sortedTax.filter((taxRecord) => {
        // @ts-ignore
        return taxRecord.currencyCode!.includes(currencyCode)
      })
    }

    if (limit) {
      sortedTax = sortedTax.slice(0, Number(limit))
    }
    if (sortedTax.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment taxRecord matched your search',
        data: [],
      })
    }
    // return taxRecord(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedTax.map((taxRecord) => taxRecord.$original),
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
          taxRecord[0].taxCode = request.input('taxCode') ? request.input('taxCode') : taxRecord[0].taxCode
          taxRecord[0].rate = request.input('rate') ? request.input('rate') : taxRecord[0].rate
          taxRecord[0].lowestAmount = request.input('lowestAmount')
            ? request.input('lowestAmount')
            : taxRecord[0].lowestAmount
          taxRecord[0].highestAmount = request.input('highestAmount')
            ? request.input('highestAmount')
            : taxRecord[0].highestAmount

          if (taxRecord) {
            // send to user
            await taxRecord[0].save()
            console.log('Update Investment taxRecord:', taxRecord)
            return taxRecord
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'fail', data: taxRecord })
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
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }
}
