import { DateTime } from 'luxon'
import { column, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
export default class TaxRecord extends AppBaseModel {
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
  public income: number

  @column()
  public taxDeducted: number

  @column()
  public investorDetails: JSON

  @column()
  public userId: string
  @column()
  public investmentId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(taxRecord: TaxRecord) {
    taxRecord.id = uuid()
  }
}
