import { DateTime } from 'luxon'
import { column, beforeCreate, BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
/**
 * .enum('rollover_type', ['100' = 'no rollover',
 *  '101' = 'rollover principal only',
 * '102' = 'rollover principal with interest',
 * '103' = 'rollover interest only'])
 */

// type RollOverType = '100' | '101' | '102' | '103'

export default class Rate extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

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

  @beforeCreate()
  public static assignUuid(rate: Rate) {
    rate.id = uuid()
  }
}
