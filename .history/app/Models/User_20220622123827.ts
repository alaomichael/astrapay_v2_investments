import { DateTime } from 'luxon'
import { column, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'

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
  public type: Type

  @column()
  public interval: Interval

  @column()
  public accountToDebitDetails: JSON

  @column()
  public recurrenceDone: number

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public walletHolderDetails: JSON

  @column()
  public schedule: JSON

  @column()
  public long: number

  @column()
  public lat: number

  @column()
  public interestRate: number

  @column()
  public interestDueOnSaving: number

  @column()
  public targetAmount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true })
  public startDate: DateTime

  @column.dateTime({ autoCreate: false })
  public endDate: DateTime

  @column()
  public isPayoutAuthorized: boolean

  @column()
  public isTerminationAuthorized: boolean

  @column()
  public isPayoutSuccessful: boolean

  @column()
  public requestType: string

  @column()
  public approvalStatus: string

  @column()
  public status: string

  @column()
  public timeline: string

  @column.dateTime({ autoCreate: false })
  public datePayoutWasDone: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = uuid()
  }
}
