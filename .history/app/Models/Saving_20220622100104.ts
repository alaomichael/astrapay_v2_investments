import { DateTime } from 'luxon'
import {  column } from '@ioc:Adonis/Lucid/Orm'
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Saving extends AppBaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
