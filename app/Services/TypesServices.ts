'use strict'

import { TypeType } from 'App/Services/types/type_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
import Type from 'App/Models/Type'
// import { DateTime } from 'luxon'
// import { v4 as uuid } from "uuid";
Database.query()

export default class TypesServices {
    public async createType(createType: TypeType): Promise<Type> {
        try {
            const type = await Type.create(createType)
            return type
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTypes(queryParams: any): Promise<Type[] | any> {
        try {
            console.log("Query params in type service:", queryParams)
            // let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams;
            let { limit, offset = 0,   } = queryParams;
            // if (!updatedAtFrom) {
            //     // default to last 3 months
            //     queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            //     updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            // }
            // // debugger;
            // if (!updatedAtTo) {
            //     queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
            //     updatedAtTo = DateTime.now().toISO();//.toISODate();
            // }
            const queryGetter = await this.queryBuilder(queryParams)
            console.log("queryGetter ",queryGetter )
            debugger
            let responseData = await Type.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .orderBy("updated_at", "desc")
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
                .offset(offset)
                .limit(limit)

            // console.log("Response data in type service:", responseData)
            // debugger
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTypeByTypeId(id: string): Promise<Type | any | null> {
        try {
            // const type = await Type.findBy('id', id);
            const type = await Type.query().where({ id: id })
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
                .first();
            // console.log("Type search result from service")
            // console.log(type);
            return type;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTypeByTypeIdAndBankRecordId(id: string, rfiRecordId: string): Promise<Type | any | null> {
        try {
            // const type = await Type.findBy('id', id);
            const type = await Type.query().where({ id: id, rfi_record_id: rfiRecordId })
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
                .first();
            // console.log("Type search result from service")
            // console.log(type);
            return type;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTypeByTypeName(typeName: string): Promise<Type | null> {
        try {
            const type = await Type.query().where({ type_name: typeName })
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
                .first();
            return type;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTypeByTagName(tagName: string,): Promise<Type | null> {
        try {
            const type = await Type.query().where({ tag_name: tagName })
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
                .first();
            return type;
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async getTypesByStatus(status: string): Promise<Type[] | null> {
        try {
            const type = await Type.query().where({ status: status })
                .preload("investmentTenures", (query) => { query.orderBy("tenure", "asc"); })
            //.first();
            return type;
        } catch (error) {
            console.log(error)
            throw error
        }
    }
    public async updateType(selectedType: any, updateType: TypeType): Promise<Type | null> {
        try {
            let saveType = await selectedType.merge(updateType)
            await saveType.save();
            return saveType
        } catch (error) {
            console.log(error)
            throw error
        }
    }
    // updateTypeInterestRate(type, interestRate);
    public async updateTypeInterestRate(selectedType: any, interestRate: number): Promise<Type | null> {
        try {
            selectedType.interestRate = interestRate;
            let newPayload = selectedType;
            // debugger
            let saveType = await selectedType.merge(newPayload)
            await saveType.save();
            return saveType
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteType(selectedType: any): Promise<Type | null> {
        try {
            await selectedType.delete()
            return selectedType
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
        if (queryFields.rfiRecordId) {
            predicateExists()
            predicate = predicate + "rfi_record_id=?";
            params.push(queryFields.rfiRecordId)
        }

        if (queryFields.rfiCode) {
            predicateExists()
            predicate = predicate + "rfi_code=?";
            params.push(queryFields.rfiCode)
        }
        if (queryFields.typeName) {
            predicateExists()
            predicate = predicate + "type_name=?"
            params.push(queryFields.typeName)
        }
        if (queryFields.lowestAmount) {
            predicateExists()
            predicate = predicate + "lowest_amount=?";
            params.push(queryFields.lowestAmount)
        }
        if (queryFields.highestAmount) {
            predicateExists()
            predicate = predicate + "highest_amount=?";
            params.push(queryFields.highestAmount)
        }
        if (queryFields.description) {
            predicateExists()
            predicate = predicate + "description=?";
            params.push(queryFields.description)
        }
        if (queryFields.interestRate) {
            predicateExists()
            predicate = predicate + "interest_rate=?";
            params.push(queryFields.interestRate)
        }
        if (queryFields.isRolloverAllowed) {
            predicateExists()
            predicate = predicate + "is_rollover_allowed=?";
            params.push(queryFields.isRolloverAllowed)
        }
        if (queryFields.quantityIssued) {
            predicateExists()
            predicate = predicate + "quantity_issued=?";
            params.push(queryFields.quantityIssued)
        }
        if (queryFields.quantityAvailableForIssue) {
            predicateExists()
            predicate = predicate + "quantity_available_for_issue=?";
            params.push(queryFields.quantityAvailableForIssue)
        }
        
        if (queryFields.availableTypes) {
            predicateExists()
            predicate = predicate + "available_types=?";
            params.push(queryFields.availableTypes)
        }
        if (queryFields.minimumAllowedPeriodOfInvestment) {
            predicateExists()
            predicate = predicate + "minimum_allowed_period_of_investment=?";
            params.push(queryFields.minimumAllowedPeriodOfInvestment)
        }
        if (queryFields.maximumAllowedPeriodOfInvestment) {
            predicateExists()
            predicate = predicate + "maximum_allowed_period_of_investment=?";
            params.push(queryFields.maximumAllowedPeriodOfInvestment)
        }
        
        // if (queryFields.dailyMinimumLimit) {
        //     predicateExists()
        //     predicate = predicate + "daily_minimum_limit=?";
        //     params.push(queryFields.dailyMinimumLimit)
        // }
        // if (queryFields.dailyMaximumLimit) {
        //     predicateExists()
        //     predicate = predicate + "daily_maximum_limit=?";
        //     params.push(queryFields.dailyMaximumLimit)
        // }
        // if (queryFields.weeklyMinimumLimit) {
        //     predicateExists()
        //     predicate = predicate + "weekly_minimum_limit=?";
        //     params.push(queryFields.weeklyMinimumLimit)
        // }
        // if (queryFields.weeklyMaximumLimit) {
        //     predicateExists()
        //     predicate = predicate + "weekly_maximum_limit=?";
        //     params.push(queryFields.weeklyMaximumLimit)
        // }
        // if (queryFields.monthlyMinimumLimit) {
        //     predicateExists()
        //     predicate = predicate + "monthly_minimum_limit=?";
        //     params.push(queryFields.monthlyMinimumLimit)
        // }
        // if (queryFields.monthlyMaximumLimit) {
        //     predicateExists()
        //     predicate = predicate + "monthly_maximum_limit=?";
        //     params.push(queryFields.monthlyMaximumLimit)
        // }
        // if (queryFields.yearlyMinimumLimit) {
        //     predicateExists()
        //     predicate = predicate + "yearly_minimum_limit=?";
        //     params.push(queryFields.yearlyMinimumLimit)
        // }
        // if (queryFields.yearlyMaximumLimit) {
        //     predicateExists()
        //     predicate = predicate + "yearly_maximum_limit=?";
        //     params.push(queryFields.yearlyMaximumLimit)
        // }
        if (queryFields.isAutomated) {
            predicateExists()
            predicate = predicate + "is_automated=?";
            params.push(queryFields.isAutomated)
        }
        // if (queryFields.isRenewable) {
        //     predicateExists()
        //     predicate = predicate + "is_renewable=?";
        //     params.push(queryFields.isRenewable)
        // }
        
        if (queryFields.features) {
            predicateExists()
            predicate = predicate + "features=?";
            params.push(queryFields.features)
        }
        if (queryFields.requirements) {
            predicateExists()
            predicate = predicate + "requirements=?";
            params.push(queryFields.requirements)
        }
        if (queryFields.createdBy) {
            predicateExists()
            predicate = predicate + "created_by=?";
            params.push(queryFields.createdBy)
        }
        if (queryFields.tagName) {
            predicateExists()
            predicate = predicate + "tag_name=?";
            params.push(queryFields.tagName)
        }
        if (queryFields.currencyCode) {
            predicateExists()
            predicate = predicate + "currency_code=?";
            params.push(queryFields.currencyCode)
        }
        if (queryFields.lng) {
            predicateExists()
            predicate = predicate + "lng=?";
            params.push(queryFields.lng)
        }
        if (queryFields.lat) {
            predicateExists()
            predicate = predicate + "lat=?";
            params.push(queryFields.lat)
        }
        
        if (queryFields.status) {
            predicateExists()
            predicate = predicate + "status=?";
            params.push(queryFields.status)
        }
        
        if (queryFields.createdAt) {
            predicateExists()
            predicate = predicate + "created_at=?";
            params.push(queryFields.createdAt)
        }

        if (queryFields.updatedAt) {
            predicateExists()
            predicate = predicate + "updated_at=?"
            params.push(queryFields.updatedAt)
        }
        if (queryFields.updatedAtFrom) {
            predicateExists()
            predicate = predicate + "updated_at>=?"
            params.push(queryFields.updatedAtFrom)
        }
        if (queryFields.updatedAtTo) {
            predicateExists()
            predicate = predicate + "updated_at<=?"
            params.push(queryFields.updatedAtTo)
        }
        response.sqlQuery = predicate
        response.params = params
        return response
    }
}