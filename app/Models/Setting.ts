import { DateTime } from 'luxon'
import { column, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
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

  @column()
  public investmentWalletId: string

  @column()
  public payoutWalletId: string

  @column()
  public isPayoutAutomated: boolean

  @column()
  public fundingSourceTerminal: string

  @column()
  public isInvestmentAutomated: boolean

  @column()
  public isRolloverAutomated: boolean

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
}
