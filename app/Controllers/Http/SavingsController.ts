import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'
import Saving from 'App/Models/Saving'
export default class SavingsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('saving params: ', params)
    const { userId, walletId, okraRecordId, tagName, limit } = request.qs()
    console.log('saving query: ', request.qs())
    const countActiveTax = await Saving.query().where('state', 'oyo').getCount()
    console.log('saving Investment count: ', countActiveTax)

    // const saving = await Saving.query().offset(0).limit(1)
    const saving = await Saving.all()
    let sortedSaving = saving

    if (userId) {
      sortedSaving = sortedSaving.filter((saving) => {
        // @ts-ignore
        return saving.userId === userId
      })
    }

    if (walletId) {
      sortedSaving = sortedSaving.filter((saving) => {
        // @ts-ignore
        return saving.walletId === walletId
      })
    }

    if (okraRecordId) {
      sortedSaving = sortedSaving.filter((saving) => {
        // @ts-ignore
        return saving.okraRecordId === okraRecordId
      })
    }

    if (tagName) {
      sortedSaving = sortedSaving.filter((saving) => {
        // @ts-ignore
        return saving.tagName!.includes(tagName)
      })
    }
    if (limit) {
      sortedSaving = sortedSaving.slice(0, Number(limit))
    }
    if (sortedSaving.length < 1) {
      return response.status(200).json({
        status: 'OK',
        message: 'no saving matched your search',
        data: {},
      })
    }
    // return saving(s)
    return response.status(200).json({
      status: 'OK',
      data: sortedSaving.map((saving) => saving.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    // const saving = await auth.authenticate()
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
    console.log('The new saving payload:', payload)
    const saving = await Saving.create(payload)

    await saving.save()
    console.log('The new saving rate:', saving)

    // TODO
    console.log('A New saving has been Created.')

    // Save saving new status to Database
    await saving.save()
    // Send saving Creation Message to Queue

    // @ts-ignore
    Event.emit('new:saving', { id: saving.id, extras: saving.additionalDetails })
    return response.json({ status: 'OK', data: saving.$original })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { userId } = request.qs()
      console.log('Saving query: ', request.qs())
      const userSchema = schema.create({
        userId: schema.string.optional({ escape: true }, [rules.maxLength(50)]),
        walletId: schema.string.optional({ escape: true }, [rules.maxLength(100)]),
        okraRecordId: schema.string.optional({ escape: true }, [rules.maxLength(100)]),
        tagName: schema.string.optional({ escape: true }, [rules.maxLength(150)]),
        currencyCode: schema.string.optional({ escape: true }, [rules.maxLength(5)]),
        long: schema.number.optional(),
        lat: schema.number.optional(),
        accountToCreditDetails: schema.object.optional().members({
          firstName: schema.string.optional(),
          lastName: schema.string.optional(),
          email: schema.string.optional([rules.email()]),
          phone: schema.number.optional(),
          bankName: schema.string.optional(),
          accountNumber: schema.string.optional(),
        }),
        walletHolderDetails: schema.object.optional().members({
          firstName: schema.string.optional(),
          lastName: schema.string.optional(),
          email: schema.string.optional([rules.email()]),
          phone: schema.number.optional(),
          walletId: schema.string.optional(),
        }),
      })
      const payload: any = await request.validate({ schema: userSchema })
      let saving = await Saving.query()
        .where({
          userId: userId,
        })
        .first()
      console.log(' QUERY RESULT: ', saving)
      if (saving) {
        console.log('Investment saving Selected for Update:', saving)
        if (saving) {
          saving.merge(payload)
          // @ts-ignore

          if (saving) {
            // send to saving
            await saving.save()
            console.log('Update Investment saving:', saving)
            return saving
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: saving })
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
    console.log('Saving query: ', request.qs())

    let saving = await Saving.query().where({
      id: id,
    })
    console.log(' QUERY RESULT: ', saving)

    if (saving.length > 0) {
      saving = await Saving.query()
        .where({
          id: id,
        })
        .delete()
      console.log('Deleted data:', saving)
      return response.send('saving Delete.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}
