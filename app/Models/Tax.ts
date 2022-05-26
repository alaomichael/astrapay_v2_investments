import { DateTime } from 'luxon'
import { column, beforeCreate, BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'

export default class Tax extends BaseModel {
  @column({ isPrimary: true })
  public id: string

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

  @beforeCreate()
  public static assignUuid(tax: Tax) {
    tax.id = uuid()
  }
}
