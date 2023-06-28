import { DateTime } from "luxon";
import { column, beforeCreate, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import { v4 as uuid } from "uuid";
import Investment from "./Investment";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class Timeline extends AppBaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public investmentId: string;

  @column()
  public userId: string;

  @column()
  public walletId: string;

  @column()
  public action: string;

  @column()
  public message: string;
  
  @column()
  public adminMessage: string;
  
  @column()
  public metadata: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => Investment, { localKey: "investmentId" })
  public investment: BelongsTo<typeof Investment>;

  @beforeCreate()
  public static assignUuid(timeline: Timeline) {
    timeline.id = uuid();
  }
}


