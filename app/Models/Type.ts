import { DateTime } from 'luxon'
import { beforeCreate, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'
import RfiRecord from './RfiRecord';
import InvestmentTenure from './InvestmentTenure';

export default class Type extends AppBaseModel {
  // public static namingStrategy = new SnakeCaseNamingStrategy()
  public static primaryKey = 'id'
  public static table = 'types'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column({})
  public rfiCode: string

  @column({})
  public rfiRecordId: string

  @column({})
  public typeName: string

  @column({})
  public lowestAmount: number

  @column({})
  public highestAmount: number

  @column({})
  public description: string

  @column({})
  public interestRate: number

  @column({})
  public isRolloverAllowed: boolean

  @column({})
  public quantityIssued: number

  @column({})
  public quantityAvailableForIssue: number

  @column({})
  public availableTypes: string | any

  @column({})
  public minimumAllowedPeriodOfInvestment: string

  @column({})
  public maximumAllowedPeriodOfInvestment: string

  // @column({})
  // public dailyMinimumLimit: number

  // @column({})
  // public dailyMaximumLimit: number

  // @column({})
  // public weeklyMinimumLimit: number

  // @column({})
  // public weeklyMaximumLimit: number

  // @column({})
  // public monthlyMinimumLimit: number

  // @column({})
  // public monthlyMaximumLimit: number

  // @column({})
  // public yearlyMinimumLimit: number

  // @column({})
  // public yearlyMaximumLimit: number

  @column({})
  public isAutomated: boolean

  @column({})
  public features: string | any

  @column({})
  public requirements: string | any

  @column({})
  public createdBy: string

  @column({})
  public tagName: string

  @column({})
  public currencyCode: string

  @column({})
  public lng: string

  @column({})
  public lat: string

  @column({})
  public status: string

  // @column({})
  // public remark: string | any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => RfiRecord, { localKey: "rfiRecordId" })
  public rfiRecord: BelongsTo<typeof RfiRecord>;

  @hasMany(() => InvestmentTenure, { localKey: "id" })
  public investmentTenures: HasMany<typeof InvestmentTenure>;


  // @hasMany(() => VerificationRecord, { localKey: "id" })
  // public verificationRecords: HasMany<typeof VerificationRecord>;

  @beforeCreate()
  public static assignUuid(type: Type) {
    type.id = uuid();
  }
}
