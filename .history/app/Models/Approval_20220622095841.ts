import { DateTime } from 'luxon'
import { column, beforeCreate  } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
export default class Approval extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public investmentId: string

  @column()
  public requestType: string

  @column()
  public approvalStatus: string

  @column()
  public remark: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(approval: Approval) {
    approval.id = uuid()
  }
}
