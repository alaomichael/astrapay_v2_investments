import { DateTime } from 'luxon'
import { column, beforeCreate  } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
/**
 * .enum('rollover_type', ['100' = 'no rollover',
 *  '101' = 'rollover principal only',
 * '102' = 'rollover principal with interest',
 * '103' = 'rollover interest only'])
 */

// type RollOverType = '100' | '101' | '102' | '103'
export default class Payout extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public walletId: string

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public phone: string

  @column()
  public email: string

  @column()
  public investmentId: string

  @column()
  public amount: number

  @column()
  public duration: string

  @column()
  public rolloverType: string

  @column()
  public rolloverTarget: number

  @column()
  public rolloverDone: number

  @column()
  public investmentType: string

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

  @column()
  public interestRate: number

  @column()
  public interestDueOnInvestment: number

  @column()
  public totalAmountToPayout: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: false })
  public startDate: DateTime

  @column.dateTime({ autoCreate: false })
  public payoutDate: DateTime

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

  @column()
  public certificateUrl: string

  @column.dateTime({ autoCreate: false })
  public datePayoutWasDone: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(payout: Payout) {
    payout.id = uuid()
  }
}
