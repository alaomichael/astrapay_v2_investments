import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

/**
   * .enum('rollover_type', ['100' = 'no rollover',
   *  '101' = 'rollover principal only',
   * '102' = 'rollover principal with interest',
   * '103' = 'rollover interest only'])
   */
type RollOverType = '100' | '101' | '102' | '103'

export default class Investment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public walletId: number

  @column()
  public amount: number

  @column()
  public duration: string

  @column()
  public rolloverType: RollOverType

  @column()
  public investmentType: 'fixed' | 'debenture'

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
  public status: string

  @column.dateTime({ autoCreate: false })
  public datePayoutWasDone: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
