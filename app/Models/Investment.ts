import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Investment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public walletId: number

  @column()
  public amount: number

  @column()
  public period: string

  @column()
  public rolloverType: string

  @column()
  public investmentType: string

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public walletHolderDetails: JSON

  @column()
  public long: number

  @column()
  public lat: number

  @column()
  public interestRate: number

  @column()
  public interestDueOnInvestment: number

  @column()
  public totalAmountToPayout: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: false })
  public payoutDate: DateTime

  @column()
  public status: string

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
