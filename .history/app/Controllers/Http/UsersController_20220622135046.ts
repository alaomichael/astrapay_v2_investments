import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('user params: ', params)
    const { state, lga, taxCode, rate, lowestAmount, highestAmount, limit } = request.qs()
    console.log('user query: ', request.qs())
    const countActiveTax = await User.query().where('state', 'oyo').getCount()
    console.log('user Investment count: ', countActiveTax)

    // const user = await User.query().offset(0).limit(1)
    const user = await User.all()
    let sortedTax = user

    if (rate) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.rate === parseInt(rate)
      })
    }

    if (lowestAmount) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.lowestAmount === parseInt(lowestAmount)
      })
    }

    if (highestAmount) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.highestAmount === parseInt(highestAmount)
      })
    }

    if (state) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.state!.includes(state)
      })
    }

    if (lga) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.lga.includes(lga)
      })
    }

    if (taxCode) {
      sortedTax = sortedTax.filter((user) => {
        // @ts-ignore
        return user.taxCode.includes(taxCode)
      })
    }

    if (limit) {
      sortedTax = sortedTax.slice(0, Number(limit))
    }
    if (sortedTax.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no investment user matched your search',
        data: [],
      })
    }
    // return user(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedTax.map((user) => user.$original),
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
    const user = await User.create(payload)

    await user.save()
    console.log('The new user rate:', user)

    // TODO
    console.log('A New user has been Created.')

    // Save user new status to Database
    await user.save()
    // Send user Creation Message to Queue

    // @ts-ignore
    Event.emit('new:user', { id: user.id, extras: user.additionalDetails })
    return response.json({ status: 'OK', data: user.$original })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { state } = request.qs()
      console.log('User query: ', request.qs())

      let user = await User.query().where({
        state: state,
      })
      console.log(' QUERY RESULT: ', user)
      if (user.length > 0) {
        console.log('Investment user Selected for Update:', user)
        if (user) {
          user[0].state = request.input('state') ? request.input('state') : user[0].state
          user[0].lga = request.input('lga') ? request.input('lga') : user[0].lga
          user[0].taxCode = request.input('taxCode') ? request.input('taxCode') : user[0].taxCode
          user[0].rate = request.input('rate') ? request.input('rate') : user[0].rate
          user[0].lowestAmount = request.input('lowestAmount')
            ? request.input('lowestAmount')
            : user[0].lowestAmount
          user[0].highestAmount = request.input('highestAmount')
            ? request.input('highestAmount')
            : user[0].highestAmount

          if (user) {
            // send to user
            await user[0].save()
            console.log('Update Investment user:', user)
            return user
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: user })
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
    console.log('User query: ', request.qs())

    let user = await User.query().where({
      id: id,
    })
    console.log(' QUERY RESULT: ', user)

    if (user.length > 0) {
      user = await User.query()
        .where({
          id: id,
        })
        .delete()
      console.log('Deleted data:', user)
      return response.send('user Delete.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}