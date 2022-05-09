import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

// type RollOverType = '100' | '101' | '102' | '103' | '104' | '105' | '106' | '107'

export default class Rate extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public productName: string

  @column()
  public lowestAmount: number

  @column()
  public highestAmount: number

  @column()
  public duration: string

  @column()
  public rolloverCode: string

  @column()
  public investmentType: string

  @column()
  public interestRate: number

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public additionalDetails: JSON

  @column()
  public long: number

  @column()
  public lat: number

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
