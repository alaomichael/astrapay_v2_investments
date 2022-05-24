import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Tax extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public state: string

  @column()
  public lga: string

  @column()
  public taxCode: string

  @column()
  public rate: number

  @column()
  public lowestAmount: number

  @column()
  public highestAmount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
