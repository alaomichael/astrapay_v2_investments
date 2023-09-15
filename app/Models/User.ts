import { DateTime } from 'luxon'
import { column, beforeCreate, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
import Saving from './Saving'
import Investment from './Investment'

export default class User extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public walletId: string

  @column()
  public okraRecordId: string

  @column()
  public accountToCreditDetails: JSON

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public walletHolderDetails: JSON

  @column()
  public long: number

  @column()
  public lat: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column()
  public requestType: string

  @column()
  public approvalStatus: string

  @column()
  public status: string

  @column()
  public timeline: string

  @column()
  public certificateUrl: string

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Saving, { localKey: 'id' })
  public savings: HasMany<typeof Saving>

  @hasMany(() => Investment, { localKey: 'id' })
  public investments: HasMany<typeof Investment>

  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = uuid()
  }
}
