import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Setting from 'App/Models/Setting'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class SettingsController {
    public async index({ params, request, response }: HttpContextContract) {
      console.log('setting params: ', params)
      const {
        duration,
        limit,
        amount,
        investmentType,
        rolloverCode,
        status,
        productName,
        interestRate,
      } = request.qs()
      console.log('setting query: ', request.qs())
      const countActiveSetting = await Setting.query().where('status', 'active').getCount()
      console.log('setting Investment count: ', countActiveSetting)

      // const setting = await Setting.query().offset(0).limit(1)
      const setting = await Setting.all()
      let sortedSettings = setting
      if (amount) {
        // @ts-ignore
        sortedSettings = await Setting
          .query()
          .where('lowest_amount', '<=', amount)
          .andWhere('highest_amount', '>=', amount)
      }

      if (duration) {
        sortedSettings = sortedSettings.filter((setting) => {
          console.log(' setting Duration:', setting.duration)
          console.log(' Query Duration:', duration)
          // @ts-ignore
          return setting.duration === duration
        })
      }

      if (investmentType) {
        sortedSettings = sortedSettings.filter((setting) => {
          // @ts-ignore
          return setting.investmentType!.includes(investmentType)
        })
      }

      if (rolloverCode) {
        sortedSettings = sortedSettings.filter((setting) => {
          // @ts-ignore
          return setting.rolloverCode!.includes(rolloverCode)
        })
      }

      if (productName) {
        sortedSettings = sortedSettings.filter((setting) => {
          // @ts-ignore
          return setting.productName!.includes(productName)
        })
      }
      if (status) {
        sortedSettings = sortedSettings.filter((setting) => {
          // @ts-ignore
          return setting.status === `${status}`
        })
      }

      if (interestRate) {
        sortedSettings = sortedSettings.filter((setting) => {
          // @ts-ignore
          return setting.interestRate === parseInt(interestRate)
        })
      }
      if (limit) {
        sortedSettings = sortedSettings.slice(0, Number(limit))
      }
      if (sortedSettings.length < 1) {
        return response.status(200).json({
          status: 'OK',
          message: 'no investment setting matched your search',
          data: [],
        })
      }
      // return setting(s)
      return response.status(200).json({
        status: 'OK',
        data: sortedSettings,
      })
    }

  public async store({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
    const settingSchema = schema.create({
      productName: schema.string({ escape: true }, [rules.maxLength(20)]),
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
    const payload: any = await request.validate({ schema: settingSchema })
    const setting = await Setting.create(payload)

    await setting.save()
    console.log('The new investment:', setting)

    // TODO
    console.log('A New setting has been Created.')

    // Save setting new status to Database
    await setting.save()
    // Send setting Creation Message to Queue

    // @ts-ignore
    Event.emit('new:setting', { id: setting.id, extras: setting.additionalDetails })
    return setting
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { productName, rateId } = request.qs()
      console.log('Setting query: ', request.qs())

      let setting = await Setting.query().where({
        product_name: productName,
        id: rateId,
      })
      console.log(' QUERY RESULT: ', setting)
      if (setting.length > 0) {
        console.log('Investment setting Selected for Update:', setting)
        if (setting) {
          setting[0].productName = request.input('newProductName')
            ? request.input('newProductName')
            : setting[0].productName
          setting[0].lowestAmount = request.input('lowestAmount')
            ? request.input('lowestAmount')
            : setting[0].lowestAmount
          setting[0].highestAmount = request.input('highestAmount')
            ? request.input('highestAmount')
            : setting[0].highestAmount
          setting[0].duration = request.input('duration')
            ? request.input('duration')
            : setting[0].duration
          setting[0].rolloverCode = request.input('rolloverCode')
            ? request.input('rolloverCode')
            : setting[0].rolloverCode
          setting[0].investmentType = request.input('investmentType')
            ? request.input('investmentType')
            : setting[0].investmentType
          setting[0].interestRate = request.input('interestRate')
            ? request.input('interestRate')
            : setting[0].interestRate
          setting[0].tagName = request.input('tagName') ? request.input('tagName') : setting[0].tagName
          setting[0].additionalDetails = request.input('additionalDetails')
            ? request.input('additionalDetails')
            : setting[0].additionalDetails
          setting[0].long = request.input('long') ? request.input('long') : setting[0].long
          setting[0].lat = request.input('lat') ? request.input('lat') : setting[0].lat
          setting[0].status = request.input('status') ? request.input('status') : setting[0].status

          if (setting) {
            // send to user
            await setting[0].save()
            console.log('Update Investment setting:', setting)
            return setting
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'fail', data: setting })
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
    // let id = request.input('rateId')
    const { productName, rateId } = request.qs()
    console.log('Setting query: ', request.qs())
    // let setting = await Setting.query().where({
    //   product_name: request.input('productName'),
    //   id: request.input('rateId'),
    // })
    let setting = await Setting.query().where({
      product_name: productName,
      id: rateId,
    })
    console.log(' QUERY RESULT: ', setting)

    if (setting.length > 0) {
      setting = await Setting.query()
        .where({
          product_name: productName,
          id: rateId,
        })
        .delete()
      console.log('Deleted data:', setting)
      return response.send('setting Delete.')
    } else {
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }

}
