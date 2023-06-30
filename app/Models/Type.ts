import { DateTime } from 'luxon'
import { beforeCreate, beforeSave, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
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
  public liquidationPenaltyRate: number

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

  @beforeSave()
  public static async stringifyFormats(type: Type) {
    if (type.$dirty.availableTypes && type.$dirty.availableTypes !== undefined) {
      // console.log("type availableTypes before stringify , line 107 =====", type.availableTypes)
      // console.log("type availableTypes before stringify , line 108 =====", typeof type.availableTypes)
      type.availableTypes = JSON.stringify(type.availableTypes)
    }

    // features
    if (type.$dirty.features && type.$dirty.features !== undefined) {
      // console.log("type features before stringify , line 107 =====", type.features)
      // console.log("type features before stringify , line 108 =====", typeof type.features)
      type.features = JSON.stringify(type.features)
    }
    // requirements
    if (type.$dirty.requirements && type.$dirty.requirements !== undefined) {
      // console.log("type requirements before stringify , line 107 =====", type.requirements)
      // console.log("type requirements before stringify , line 108 =====", typeof type.requirements)
      type.requirements = JSON.stringify(type.requirements)
    }
    
  }

}
