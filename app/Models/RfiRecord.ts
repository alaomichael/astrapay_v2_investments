import { column, beforeCreate, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
// import moment from 'moment'
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'
import Type from './Type';
import Investment from './Investment';
// import BankVerificationRequirement from './BankVerificationRequirement';
// import GeneralVerificationRequirement from './GeneralVerificationRequirement';

export default class RfiRecord extends AppBaseModel {
  public static primaryKey = 'id'
  public static table = 'rfi_records'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  // @column({})
  // public generalVerificationRequirementId: string

  @column({})
  public rfiName: string

  @column({})
  public rfiCode: string

  @column({})
  public phone: string

  @column({})
  public phone2: string

  @column({})
  public email: string

  @column({})
  public website: string

  @column({})
  public slogan: string

  @column({})
  public imageUrl: string

  @column({})
  public address: string

  // @column({})
  // public otherInformation: string | any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // @belongsTo(() => GeneralVerificationRequirement, { localKey: "generalVerificationRequirementId" })
  // public generalVerificationRequirement: BelongsTo<typeof GeneralVerificationRequirement>;


  @hasMany(() => Type, { localKey: "id" })
  public types: HasMany<typeof Type>;


  @hasMany(() => Investment, { localKey: "id" })
  public investments: HasMany<typeof Investment>;


  @beforeCreate()
  public static assignUuid(rfirecord: RfiRecord) {
    rfirecord.id = uuid();
  }
}
