import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Investment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public amount: number

  @column()
  public period: string

  @column()
  public walletId: number

  @column()
  public userId: number

  @column()
  public rolloverType: string

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public long: number

  @column()
  public lat: number

  @column()
  public walletHolderDetails: JSON

  @column.dateTime({ autoCreate: false })
  public payoutDate: DateTime

  @column()
  public interestRate: number

  @column()
  public interestDueOnInvestment: number

  @column()
  public totalAmount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
