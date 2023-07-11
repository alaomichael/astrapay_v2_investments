import Investment from 'App/Models/Investment';
import { DateTime } from "luxon";
import { column, beforeCreate, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Approval extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public rfiCode: string;

  @column()
  public walletId: string;

  @column()
  public userId: string;

  @column()
  public investmentId: string;

  @column()
  public requestType: string;

  @column()
  public approvalStatus: string;

  @column()
  public assignedTo: string;

  @column()
  public processedBy: string;

  @column()
  public approvedBy: string;

  // @column()
  // public remark: string | any;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => Investment, { localKey: "investmentId" })
  public investment: BelongsTo<typeof Investment>;


  @beforeCreate()
  public static assignUuid(approval: Approval) {
    approval.id = uuid();
  }
}
