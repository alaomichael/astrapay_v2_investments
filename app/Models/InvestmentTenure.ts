import { DateTime } from 'luxon'
import { beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Type from './Type';
import { v4 as uuid } from "uuid";
import AppBaseModel from 'App/Models/AppBaseModel'


export default class InvestmentTenure extends AppBaseModel {
    @column({ isPrimary: true })
    public id: string;

    @column({})
    public typeId: string;

    @column({})
    public tenure: number;

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime;

    @belongsTo(() => Type, { localKey: "typeId" })
    public type: BelongsTo<typeof Type>;

    @beforeCreate()
    public static assignUuid(investmenttenure: InvestmentTenure) {
        investmenttenure.id = uuid();
    }
}
