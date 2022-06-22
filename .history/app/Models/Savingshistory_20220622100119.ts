import { DateTime } from 'luxon'
import { column } from '@ioc:Adonis/Lucid/Orm'

export default class Savingshistory extends AppBaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
