import { DateTime } from 'luxon'
import { column, beforeCreate, beforeSave } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
export default class Setting extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({
  })
  public rfiName: string

  @column({
  })
  public rfiCode: string

  @column({
  })
  public rfiImageUrl: string

  @column({
  })
  public initiationNotificationEmail: string | any

@column({
  })
  public activationNotificationEmail: string | any

@column({
  })
  public maturityNotificationEmail: string | any

@column({
  })
  public payoutNotificationEmail: string | any

@column({
  })
  public rolloverNotificationEmail: string | any

@column({
  })
  public liquidationNotificationEmail: string | any


  @column()
  public investmentWalletId: string

  @column()
  public payoutWalletId: string

  @column()
  public isPayoutAutomated: boolean

  @column()
  public liquidationPenalty: number

  @column()
  public fundingSourceTerminal: string

  @column()
  public isInvestmentAutomated: boolean

  @column()
  public isRolloverAutomated: boolean
  
  @column()
  public isAllPayoutSuspended: boolean
  
  @column()
  public isAllRolloverSuspended: boolean

  // @column()
  // public investmentType: 'fixed' | 'debenture'

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(setting: Setting) {
    setting.id = uuid()
  }

  @beforeSave()
  public static async stringifyFormats(setting: Setting) {
    if (setting.$dirty.initiationNotificationEmail && setting.$dirty.initiationNotificationEmail !== undefined) {
      // console.log("setting initiationNotificationEmail before stringify , line 107 =====", setting.initiationNotificationEmail)
      // console.log("setting initiationNotificationEmail before stringify , line 108 =====", typeof setting.initiationNotificationEmail)
      setting.initiationNotificationEmail = JSON.stringify(setting.initiationNotificationEmail)
    }
    
    // activationNotificationEmail
    if (setting.$dirty.activationNotificationEmail && setting.$dirty.activationNotificationEmail !== undefined) {
      // console.log("setting activationNotificationEmail before stringify , line 107 =====", setting.activationNotificationEmail)
      // console.log("setting activationNotificationEmail before stringify , line 108 =====", typeof setting.activationNotificationEmail)
      setting.activationNotificationEmail = JSON.stringify(setting.activationNotificationEmail)
    }
    // maturityNotificationEmail
    if (setting.$dirty.maturityNotificationEmail && setting.$dirty.maturityNotificationEmail !== undefined) {
      // console.log("setting maturityNotificationEmail before stringify , line 107 =====", setting.maturityNotificationEmail)
      // console.log("setting maturityNotificationEmail before stringify , line 108 =====", typeof setting.maturityNotificationEmail)
      setting.maturityNotificationEmail = JSON.stringify(setting.maturityNotificationEmail)
    }
    // payoutNotificationEmail
    if (setting.$dirty.payoutNotificationEmail && setting.$dirty.payoutNotificationEmail !== undefined) {
      // console.log("setting payoutNotificationEmail before stringify , line 107 =====", setting.payoutNotificationEmail)
      // console.log("setting payoutNotificationEmail before stringify , line 108 =====", typeof setting.payoutNotificationEmail)
      setting.payoutNotificationEmail = JSON.stringify(setting.payoutNotificationEmail)
    }
    // rolloverNotificationEmail
    if (setting.$dirty.rolloverNotificationEmail && setting.$dirty.rolloverNotificationEmail !== undefined) {
      // console.log("setting rolloverNotificationEmail before stringify , line 107 =====", setting.rolloverNotificationEmail)
      // console.log("setting rolloverNotificationEmail before stringify , line 108 =====", typeof setting.rolloverNotificationEmail)
      setting.rolloverNotificationEmail = JSON.stringify(setting.rolloverNotificationEmail)
    }
    // liquidationNotificationEmail
    if (setting.$dirty.liquidationNotificationEmail && setting.$dirty.liquidationNotificationEmail !== undefined) {
      // console.log("setting liquidationNotificationEmail before stringify , line 107 =====", setting.liquidationNotificationEmail)
      // console.log("setting liquidationNotificationEmail before stringify , line 108 =====", typeof setting.liquidationNotificationEmail)
      setting.liquidationNotificationEmail = JSON.stringify(setting.liquidationNotificationEmail)
    }
  }

  // @afterFind()
  // public static async parseFormats(setting: Setting) {
  //   console.log("setting initiationNotificationEmail before parsing , line 109 =====", setting.initiationNotificationEmail)
  //   // initiationNotificationEmail = JSON.parse(initiationNotificationEmail as string)
  //   setting.initiationNotificationEmail = JSON.parse(setting.initiationNotificationEmail)
  // }

  // @afterFetch()
  // public static async parseAllFormats(settings: Setting[]) {
  //   settings.map((setting) => {
  //     // console.log("setting initiationNotificationEmail before parsing , line 117 =====", setting.initiationNotificationEmail)
  //     // console.log("setting initiationNotificationEmail before parsing , line 118 =====",typeof setting.initiationNotificationEmail)
  //     return setting//.initiationNotificationEmail
  //   })
  // }
}
