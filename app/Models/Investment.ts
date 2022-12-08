import  RfiRecord  from './RfiRecord';
import { DateTime } from 'luxon'
import { column, beforeCreate, belongsTo, BelongsTo, HasOne, hasOne, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'
import Approval from './Approval';
import Timeline from './Timeline';
// import User from './User'

/**
 * .enum('rollover_type', ['100' = 'no rollover',
 *  '101' = 'rollover principal only',
 * '102' = 'rollover principal with interest',
 * '103' = 'rollover interest only'])
 */
type RollOverType = '100' | '101' | '102' | '103'

export default class Investment extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public walletId: string

  @column()
  public rfiRecordId: string

  @column()
  public rfiCode: string

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public phone: string

  @column()
  public email: string

  @column()
  public investorFundingWalletId: string

  @column()
  public amount: number

  @column()
  public duration: number

  @column()
  public rolloverType: RollOverType

  @column()
  public rolloverTarget: number

  @column()
  public rolloverDone: number

  @column()
  public investmentTypeName: string

  @column()
  public investmentTypeId: string

  @column()
  public investmentType: string // 'fixed' | 'debenture'

  @column()
  public tagName: string

  @column()
  public currencyCode: string

  @column()
  public interestRate: number

  @column()
  public interestDueOnInvestment: number

  @column()
  public totalAmountToPayout: number

  // @column()
  // public walletHolderDetails: JSON

  @column()
  public isRequestSent: boolean

  @column()
  public investmentRequestReference: string

  @column()
  public isInvestmentCreated: boolean

  @column()
  public isInvestmentCompleted: boolean

  @column.dateTime({ autoCreate: false })
  public investmentCompletionDate: DateTime

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
  public certificateUrl: string

  @column.dateTime({ autoCreate: false })
  public datePayoutWasDone: DateTime

  @column()
  public lng: string

  @column()
  public lat: string
string
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => RfiRecord, { localKey: 'rfiRecordId' })
  public rfiRecord: BelongsTo<typeof RfiRecord>

  @hasOne(() => Approval, { localKey: "id" })
  public approvals: HasOne<typeof Approval>;

  @hasMany(() => Timeline, { localKey: "id" })
  public timelines: HasMany<typeof Timeline>;

  @beforeCreate()
  public static assignUuid(investment: Investment) {
    investment.id = uuid()
  }
}
