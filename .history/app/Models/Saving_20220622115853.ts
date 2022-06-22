import { DateTime } from 'luxon'
import { column, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import AppBaseModel from 'App/Models/AppBaseModel'

//  schedule: { // required
//                     interval: 'monthly',
//                     startDate: 'YYYY-MM-DD', // If blank will default to today
//                     endDate: 'YYYY-MM-DD' //If blank will not stop
//             },

type Interval = 'daily' | 'weekly' | 'monthly' | 'yearly'
type Type = 'one-time' | 'recurring' | 'future' | 'lock'

export default class Saving extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public walletId: string

  @column()
  public amount: number

  @column()
  public duration: string

  @column()
  public type: Type

  @column()
  public interval: Interval

  @column()
  public accountToDebitDetails: JSON

  @column()
  public recurrencyDone: number

  @column()
  public investmentType: 'fixed' | 'debenture'

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
  public interestDueOnSavings: number

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
  public static assignUuid(saving: Saving) {
    saving.id = uuid()
  }
}
