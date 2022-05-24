import {DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class TaxRecord extends BaseModel {
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
  public income: number

  @column()
  public taxDeducted: number

  @column()
  public investorDetails: JSON

  @column()
  public userId: number
  @column()
  public investmentId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
