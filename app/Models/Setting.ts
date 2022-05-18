import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public fundingWalletId: number

  @column()
  public isPayoutAutomated: boolean

  @column()
  public fundingSourceTerminal: string

  @column()
  public isInvestmentAutomated: boolean

  @column()
  public isTerminationAutomated: boolean

  @column()
  public investmentType: 'fixed' | 'debenture'

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
