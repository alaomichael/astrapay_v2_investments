import { column, } from "@ioc:Adonis/Lucid/Orm";
import AppBaseModel from 'App/Models/AppBaseModel'

export default class LoginUserData extends AppBaseModel {

    @column()
    public biodata: JSON;

    @column()
    public roles: Array<string>;
}