import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Tax from 'App/Models/Tax'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
export default class TaxesController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('tax params: ', params)
    const { state, lga, taxCode, rate, lowestAmount, highestAmount, limit } = request.qs()
    console.log('tax query: ', request.qs())
    const countActiveTax = await Tax.query().where('state', 'oyo').getCount()
    console.log('tax Investment count: ', countActiveTax)

    // const tax = await Tax.query().offset(0).limit(1)
    const tax = await Tax.all()
    let sortedTax = tax

    if (rate) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.rate === parseInt(rate)
      })
    }


        if (lowestAmount) {
          sortedTax = sortedTax.filter((tax) => {
            // @ts-ignore
            return tax.lowestAmount === parseInt(lowestAmount)
          })
        }

    if (state) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.state!.includes(state)
      })
    }

    if (lga) {
      sortedTax = sortedTax.filter((tax) => {
        // @ts-ignore
        return tax.lga.includes(lga)
      })
    }


      if (taxCode) {
        sortedTax = sortedTax.filter((tax) => {
          // @ts-ignore
          return tax.taxCode.includes(taxCode)
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
    const taxSchema = schema.create({
      state: schema.string({ escape: true }, [rules.maxLength(50)]),
      lga: schema.string({ escape: true }, [rules.maxLength(100)]),
      taxCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      rate: schema.number(),
      lowestAmount: schema.number(),
      highestAmount: schema.number(),
    })
    const payload: any = await request.validate({ schema: taxSchema })
    const tax = await Tax.create(payload)

    await tax.save()
    console.log('The new tax rate:', tax)

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
      const { state } = request.qs()
      console.log('Tax query: ', request.qs())

      let tax = await Tax.query().where({
        state: state,
      })
      console.log(' QUERY RESULT: ', tax)
      if (tax.length > 0) {
        console.log('Investment tax Selected for Update:', tax)
        if (tax) {
          tax[0].state = request.input('state') ? request.input('state') : tax[0].state
          tax[0].lga = request.input('lga') ? request.input('lga') : tax[0].lga
          tax[0].taxCode = request.input('taxCode') ? request.input('taxCode') : tax[0].taxCode
          tax[0].rate = request.input('rate') ? request.input('rate') : tax[0].rate
          tax[0].lowestAmount = request.input('lowestAmount')
            ? request.input('lowestAmount')
            : tax[0].lowestAmount
          tax[0].highestAmount = request.input('highestAmount')
            ? request.input('highestAmount')
            : tax[0].highestAmount

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
