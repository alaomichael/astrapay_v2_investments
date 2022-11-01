import { DateTime } from 'luxon'
import { column } from '@ioc:Adonis/Lucid/Orm'
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Savingshistory extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
