import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('user params: ', params)
    const { userId, walletId, okraRecordId, tagName, limit } = request.qs()
    console.log('user query: ', request.qs())
    const countActiveTax = await User.query().where('state', 'oyo').getCount()
    console.log('user Investment count: ', countActiveTax)

    // const user = await User.query().offset(0).limit(1)
    const user = await User.all()
    let sortedUser = user

    if (userId) {
      sortedUser = sortedUser.filter((user) => {
        // @ts-ignore
        return user.userId === userId
      })
    }

    if (walletId) {
      sortedUser = sortedUser.filter((user) => {
        // @ts-ignore
        return user.walletId === walletId
      })
    }

    if (okraRecordId) {
      sortedUser = sortedUser.filter((user) => {
        // @ts-ignore
        return user.okraRecordId === okraRecordId
      })
    }

    if (tagName) {
      sortedUser = sortedUser.filter((user) => {
        // @ts-ignore
        return user.tagName!.includes(tagName)
      })
    }
    if (limit) {
      sortedUser = sortedUser.slice(0, Number(limit))
    }
    if (sortedUser.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no user matched your search',
        data: [],
      })
    }
    // return user(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedUser.map((user) => user.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    // const user = await auth.authenticate()
    const userSchema = schema.create({
      userId: schema.string({ escape: true }, [rules.maxLength(50)]),
      walletId: schema.string.optional({ escape: true }, [rules.maxLength(100)]),
      okraRecordId: schema.string({ escape: true }, [rules.maxLength(100)]),
      tagName: schema.string({ escape: true }, [rules.maxLength(150)]),
      currencyCode: schema.string({ escape: true }, [rules.maxLength(5)]),
      long: schema.number(),
      lat: schema.number(),
      accountToCreditDetails: schema.object().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        bankName: schema.string(),
        accountNumber: schema.string(),
      }),
      walletHolderDetails: schema.object.optional().members({
        firstName: schema.string(),
        lastName: schema.string(),
        email: schema.string([rules.email()]),
        phone: schema.number(),
        walletId: schema.string(),
      }),
    })
    const payload: any = await request.validate({ schema: userSchema })
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
      const {  userId } = request.qs()
      console.log('User query: ', request.qs())
      const userSchema = schema.create({
        state: schema.string({ escape: true }, [rules.maxLength(50)]),
        lga: schema.string({ escape: true }, [rules.maxLength(100)]),
        taxCode: schema.string({ escape: true }, [rules.maxLength(5)]),
        rate: schema.number(),
        lowestAmount: schema.number(),
        highestAmount: schema.number(),
      })
      const payload: any = await request.validate({ schema: userSchema })

      let user = await User.query()
        .where({
          userId: userId,
        })
        .first()
      console.log(' QUERY RESULT: ', user)
      if (user) {
        console.log('Investment user Selected for Update:', user)
        if (user) {
          user.merge(payload)
          // @ts-ignore

          if (user) {
            // send to user
            await user.save()
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
