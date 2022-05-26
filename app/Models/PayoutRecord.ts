import { DateTime } from 'luxon'
import { column, beforeCreate, BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
export default class PayoutRecord extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: number

  @column()
  public investmentId: number

  @column()
  public walletId: number

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
  public totalAmountPaid: number

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

  @column.dateTime({ autoCreate: true })
  public datePayoutWasDone: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(payoutRecord: PayoutRecord) {
    payoutRecord.id = uuid()
  }
}
