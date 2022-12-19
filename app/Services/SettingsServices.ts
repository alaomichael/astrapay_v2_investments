'use strict'
import Settings from 'App/Models/Setting'

import { SettingType } from 'App/Services/types/setting_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
Database.query()

export default class SettingsServices {
    public async createSetting(createSetting: SettingType): Promise<Settings> {
        try {
            const setting = await Settings.create(createSetting)
            return setting
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getSettings(queryParams: any): Promise<Settings | null> {
        try {
            // console.log("Query params in settings service:",queryParams)
            // const { limit, offset = 0 } = queryParams
            const queryGetter = await this.queryBuilder(queryParams)
            const responseData = await Settings.query().whereRaw(queryGetter.sqlQuery, queryGetter.params).first()//.orderBy("updated_at", "desc").offset(offset).limit(limit)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getSettingBySettingId(id: string): Promise<Settings | null> {
        try {
            const setting = await Settings.query().where({ id: id }).first();
            return setting;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getSettingBySettingTagName(tagName: string): Promise<Settings | null> {
        try {
            const setting = await Settings.query().where({ tagName: tagName }).first();
            return setting;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getSettingBySettingRfiName(rfiName: string): Promise<Settings | null> {
        try {
            const setting = await Settings.query().where({ rfiName: rfiName }).first();
            return setting;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getSettingBySettingRfiCode(rfiCode: string): Promise<Settings | null> {
        try {
            const setting = await Settings.query().where({ rfiCode: rfiCode }).first();
            return setting;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async updateSetting(selectedSetting: any, updateSetting: SettingType): Promise<Settings | null> {
        try {
            let saveSetting = await selectedSetting.merge(updateSetting)
            await saveSetting.save();
            return saveSetting
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteSetting(selectedSetting: any): Promise<Settings | null> {
        try {
            await selectedSetting.delete()
            return selectedSetting
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    private async queryBuilder(queryFields: any) {
        /**
         * This is the query builder to allow for different filter on the model.
         * One of the reasons of using this is that I have not found a way around querying json field with lucid
         * So I will be making use of params, sql and predicate to build a raw query to be used in lucid.
         * The predicate are the filters and params are the values. The sql base statements that will be built on with concatenation
         * This function returns the sql query and the params i.e fields to be filtered
         * Function predicateExists() handles adding the conjuction while building the sql query
         */
        delete queryFields.limit
        delete queryFields.offset
        interface Response {
            sqlQuery: string
            params: any[]
        }
        let params: any[] = []
        let predicate = ""
        let response: Response = {
            sqlQuery: "string",
            params: []
        }
        const predicateExists = () => {
            if (predicate == "") {
                return predicate
            }
            predicate = predicate + " and "
            return predicate
        }

        if (!queryFields || Object.keys(queryFields).length === 0) {
            response.sqlQuery = predicate
            response.params = params
            return response
        }
        if (queryFields.id) {
            predicateExists()
            predicate = predicate + "id=?"
            params.push(queryFields.id)
        }

        // rfiName
        // rfiCode
        // rfiImageUrl
        // isAccountOpeningAutomated
        // isAtmCardRequestAutomated
        // isTokenRequestAutomated
        // isAccountLinkingAutomated
        // currencyCode

        if (queryFields.rfiName) {
            predicateExists()
            predicate = predicate + "rfi_name=?"
            params.push(queryFields.rfiName)
        }

        if (queryFields.rfiCode) {
            predicateExists()
            predicate = predicate + "rfi_code=?"
            params.push(queryFields.rfiCode)
        }

        if (queryFields.rfiImageUrl) {
            predicateExists()
            predicate = predicate + "rfi_image_url=?"
            params.push(queryFields.rfiImageUrl)
        }
        
        if (queryFields.initiationNotificationEmail) {
            predicateExists()
            predicate = predicate + "initiation_notification_email=?"
            params.push(queryFields.initiationNotificationEmail)
        }
        
        if (queryFields.activationNotificationEmail) {
            predicateExists()
            predicate = predicate + "activation_notification_email=?"
            params.push(queryFields.activationNotificationEmail)
        }
        
        if (queryFields.maturityNotificationEmail) {
            predicateExists()
            predicate = predicate + "maturity_notification_email=?"
            params.push(queryFields.maturityNotificationEmail)
        }
        
        if (queryFields.payoutNotificationEmail) {
            predicateExists()
            predicate = predicate + "payout_notification_email=?"
            params.push(queryFields.payoutNotificationEmail)
        }
        
        if (queryFields.rolloverNotificationEmail) {
            predicateExists()
            predicate = predicate + "rollover_notification_email=?"
            params.push(queryFields.rolloverNotificationEmail)
        }
        
        if (queryFields.liquidationNotificationEmail) {
            predicateExists()
            predicate = predicate + "liquidation_notification_email=?"
            params.push(queryFields.liquidationNotificationEmail)
        }

        if (queryFields.investmentWalletId) {
            predicateExists()
            predicate = predicate + "investment_wallet_id=?";
            params.push(queryFields.investmentWalletId)
        }
        if (queryFields.payoutWalletId) {
            predicateExists()
            predicate = predicate + "payout_wallet_id=?";
            params.push(queryFields.payoutWalletId)
        }
        if (queryFields.isPayoutAutomated) {
            predicateExists()
            predicate = predicate + "is_payout_automated=?";
            params.push(queryFields.isPayoutAutomated)
        }

        if (queryFields.fundingSourceTerminal) {
            predicateExists()
            predicate = predicate + "funding_source_terminal=?";
            params.push(queryFields.fundingSourceTerminal)
        }
        if (queryFields.isInvestmentAutomated) {
            predicateExists()
            predicate = predicate + "is_investment_automated=?";
            // queryFields.isInvestmentAutomated = queryFields.isInvestmentAutomated == "true" ? 1 : 0;
            params.push(queryFields.isInvestmentAutomated)
        }
        if (queryFields.isRolloverAutomated) {
            predicateExists()
            predicate = predicate + "is_rollover_automated=?";
            // queryFields.isRolloverAutomated = queryFields.isRolloverAutomated == "true" ? 1 : 0;
            params.push(queryFields.isRolloverAutomated)
        }
        // if (queryFields.investmentType) {
        //     predicateExists()
        //     predicate = predicate + "investment_type=?";
        //     // queryFields.investmentType = queryFields.isAccountLinkingAutomated == "true" ? 1 : 0;
        //     params.push(queryFields.investmentType)
        // }
        if (queryFields.tagName) {
            predicateExists()
            predicate = predicate + "tag_name=?"
            params.push(queryFields.tagName)
        }
        if (queryFields.currencyCode) {
            predicateExists()
            predicate = predicate + "currency_code=?"
            params.push(queryFields.currencyCode)
        }
        response.sqlQuery = predicate
        response.params = params
        return response
    }
}
