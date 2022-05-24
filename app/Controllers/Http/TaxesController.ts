import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tax from 'App/Models/Tax'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class TaxesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('tax params: ', params)
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
    console.log('tax query: ', request.qs())
    const countActiveSetting = await Tax.query().where('investment_type', 'fixed').getCount()
    console.log('tax Investment count: ', countActiveSetting)

    // const tax = await Tax.query().offset(0).limit(1)
    const tax = await Tax.all()
    let sortedTax = tax

    if (fundingWalletId) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.fundingWalletId === parseInt(fundingWalletId)
      })
    }

    if (investmentType) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.investmentType!.includes(investmentType)
      })
    }

    if (isPayoutAutomated) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.isPayoutAutomated.toString() === isPayoutAutomated
      })
    }

    if (isInvestmentAutomated) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.isInvestmentAutomated.toString() === isInvestmentAutomated
      })
    }

    if (isTerminationAutomated) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.isTerminationAutomated.toString() === isTerminationAutomated
      })
    }

    if (fundingSourceTerminal) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.fundingSourceTerminal!.includes(fundingSourceTerminal)
      })
    }

    if (tagName) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.tagName!.includes(tagName)
      })
    }

    if (currencyCode) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.currencyCode!.includes(currencyCode)
      })
    }

    if (limit) {
      sortedTax = sortedTax.slice(0, Number(limit))
    }
    if (sortedTax.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment tax matched your search',
        data: [],
      })
    }
    // return tax(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedTax.map((tax) => tax.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const settingSchema = schema.create({
      fundingWalletId: schema.number(),
      isPayoutAutomated: schema.boolean(),
      fundingSourceTerminal: schema.string({ escape: true }, [rules.maxLength(50)]),
      isInvestmentAutomated: schema.boolean(),
      isTerminationAutomated: schema.boolean(),
      investmentType: schema.enum(['fixed', 'debenture']),
      tagName: schema.string({ escape: true }, [rules.maxLength(100)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
    })
    const payload: any = await request.validate({ schema: settingSchema })
    const tax = await Tax.create(payload)

    await tax.save()
    console.log('The new investment:', tax)

    // TODO
    console.log('A New tax has been Created.')

    // Save tax new status to Database
    await tax.save()
    // Send tax Creation Message to Queue

    // @ts-ignore
    Event.emit('new:tax', { id: tax.id, extras: tax.additionalDetails })
    return response.json({ status: 'OK', data: tax.$original })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { id } = request.qs()
      console.log('Tax query: ', request.qs())

      let tax = await Tax.query().where({
        id: id,
      })
      console.log(' QUERY RESULT: ', tax)
      if (tax.length > 0) {
        console.log('Investment tax Selected for Update:', tax)
        if (tax) {
          tax[0].fundingWalletId = request.input('fundingWalletId')
            ? request.input('fundingWalletId')
            : tax[0].fundingWalletId
          tax[0].isPayoutAutomated = request.input('isPayoutAutomated')
            ? request.input('isPayoutAutomated')
            : tax[0].isPayoutAutomated
          tax[0].fundingSourceTerminal = request.input('fundingSourceTerminal')
            ? request.input('fundingSourceTerminal')
            : tax[0].fundingSourceTerminal
          tax[0].isInvestmentAutomated = request.input('isInvestmentAutomated')
            ? request.input('isInvestmentAutomated')
            : tax[0].isInvestmentAutomated
          tax[0].isTerminationAutomated = request.input('isTerminationAutomated')
            ? request.input('isTerminationAutomated')
            : tax[0].isTerminationAutomated
          tax[0].investmentType = request.input('investmentType')
            ? request.input('investmentType')
            : tax[0].investmentType
          tax[0].tagName = request.input('tagName')
            ? request.input('tagName')
            : tax[0].tagName
          tax[0].currencyCode = request.input('currencyCode')
            ? request.input('currencyCode')
            : tax[0].currencyCode

          if (tax) {
            // send to user
            await tax[0].save()
            console.log('Update Investment tax:', tax)
            return tax
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'fail', data: tax })
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
    console.log('Tax query: ', request.qs())

    let tax = await Tax.query().where({
      id: id,
    })
    console.log(' QUERY RESULT: ', tax)

    if (tax.length > 0) {
      tax = await Tax.query()
        .where({
          id: id,
        })
        .delete()
      console.log('Deleted data:', tax)
      return response.send('tax Delete.')
    } else {
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }
}
