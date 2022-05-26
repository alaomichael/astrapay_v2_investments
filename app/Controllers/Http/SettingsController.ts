import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Setting from 'App/Models/Setting'
// import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class SettingsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('setting params: ', params)
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
    console.log('setting query: ', request.qs())
    const countActiveSetting = await Setting.query().where('investment_type', 'fixed').getCount()
    console.log('setting Investment count: ', countActiveSetting)

    // const setting = await Setting.query().offset(0).limit(1)
    const setting = await Setting.all()
    let sortedSettings = setting

    if (fundingWalletId) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.fundingWalletId === parseInt(fundingWalletId)
      })
    }

    if (investmentType) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.investmentType!.includes(investmentType)
      })
    }

    if (isPayoutAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.isPayoutAutomated.toString() === isPayoutAutomated
      })
    }

    if (isInvestmentAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.isInvestmentAutomated.toString() === isInvestmentAutomated
      })
    }

    if (isTerminationAutomated) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.isTerminationAutomated.toString() === isTerminationAutomated
      })
    }

    if (fundingSourceTerminal) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.fundingSourceTerminal!.includes(fundingSourceTerminal)
      })
    }

    if (tagName) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.tagName!.includes(tagName)
      })
    }

    if (currencyCode) {
      sortedSettings = sortedSettings.filter((setting) => {
        // @ts-ignore
        return setting.currencyCode!.includes(currencyCode)
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
      data: sortedSettings.map((setting) => setting.$original),
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
    return response.json({ status: 'OK', data: setting.$original })
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { id } = request.qs()
      console.log('Setting query: ', request.qs())

      let setting = await Setting.query().where({
        id: id,
      })
      console.log(' QUERY RESULT: ', setting)
      if (setting.length > 0) {
        console.log('Investment setting Selected for Update:', setting)
        if (setting) {
          setting[0].fundingWalletId = request.input('fundingWalletId')
            ? request.input('fundingWalletId')
            : setting[0].fundingWalletId
          setting[0].isPayoutAutomated = request.input('isPayoutAutomated')
            ? request.input('isPayoutAutomated')
            : setting[0].isPayoutAutomated
          setting[0].fundingSourceTerminal = request.input('fundingSourceTerminal')
            ? request.input('fundingSourceTerminal')
            : setting[0].fundingSourceTerminal
          setting[0].isInvestmentAutomated = request.input('isInvestmentAutomated')
            ? request.input('isInvestmentAutomated')
            : setting[0].isInvestmentAutomated
          setting[0].isTerminationAutomated = request.input('isTerminationAutomated')
            ? request.input('isTerminationAutomated')
            : setting[0].isTerminationAutomated
          setting[0].investmentType = request.input('investmentType')
            ? request.input('investmentType')
            : setting[0].investmentType
          setting[0].tagName = request.input('tagName')
            ? request.input('tagName')
            : setting[0].tagName
          setting[0].currencyCode = request.input('currencyCode')
            ? request.input('currencyCode')
            : setting[0].currencyCode

          if (setting) {
            // send to user
            await setting[0].save()
            console.log('Update Investment setting:', setting)
            return setting
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'FAILED', data: setting })
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
    console.log('Setting query: ', request.qs())

    let setting = await Setting.query().where({
      id: id,
    })
    console.log(' QUERY RESULT: ', setting)

    if (setting.length > 0) {
      setting = await Setting.query()
        .where({
          id: id,
        })
        .delete()
      console.log('Deleted data:', setting)
      return response.send('setting Delete.')
    } else {
      return response.status(404).json({ status: 'FAILED', message: 'Invalid parameters' })
    }
  }
}
