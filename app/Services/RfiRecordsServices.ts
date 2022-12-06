'use strict'
import RfiRecord from 'App/Models/RfiRecord'
import { RfiRecordType } from 'App/Services/types/rfirecord_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
Database.query()

export default class RfiRecordsServices {
    public async createRfiRecord(createRfiRecord: RfiRecordType): Promise<RfiRecord> {
        try {
            const rfiRecord = await RfiRecord.create(createRfiRecord)
            return rfiRecord
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecords(queryParams: any): Promise<RfiRecord[] | null> {
        try {
            console.log("Query params in rfiRecords service:", queryParams)
            const { limit, offset = 0 } = queryParams
            const queryGetter = await this.queryBuilder(queryParams)
            const responseData = await RfiRecord.query().whereRaw(queryGetter.sqlQuery, queryGetter.params).orderBy("updated_at", "desc")
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .offset(offset).limit(limit)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecordByRfiRecordId(id: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ id: id })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecordByRfiRecordRfiName(rfiName: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ rfi_name: rfiName })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecordByRfiRecordRfiCode(rfiCode: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ rfi_code: rfiCode })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecordByRfiRecordEmail(email: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ email: email })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getRfiRecordByRfiRecordPhone(phone: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ phone: phone })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async getRfiRecordByRfiRecordWebsite(website: string): Promise<RfiRecord | null> {
        try {
            const rfiRecord = await RfiRecord.query().where({ website: website })
                // .preload("bankVerificationRequirements", (query) => { query.orderBy("createdAt", "desc"); })
                .preload("types", (query) => { query.orderBy("typeName", "asc"); })
                .first();
            return rfiRecord;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async updateRfiRecord(selectedRfiRecord: any, updateRfiRecord: RfiRecordType): Promise<RfiRecord | null> {
        try {
            let saveRfiRecord = await selectedRfiRecord.merge(updateRfiRecord)
            await saveRfiRecord.save();
            return saveRfiRecord
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteRfiRecord(selectedRfiRecord: any): Promise<RfiRecord | null> {
        try {
            await selectedRfiRecord.delete()
            return selectedRfiRecord
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

        // if (queryFields.generalVerificationRequirementId) {
        //     predicateExists()
        //     predicate = predicate + "general_verification_requirement_id=?"
        //     params.push(queryFields.generalVerificationRequirementId)
        // }
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


        if (queryFields.phone) {
            predicateExists()
            predicate = predicate + "phone=?"
            params.push(queryFields.phone)
        }

        if (queryFields.phone2) {
            predicateExists()
            predicate = predicate + "phone2=?"
            params.push(queryFields.phone2)
        }

        if (queryFields.email) {
            predicateExists()
            predicate = predicate + "email=?"
            params.push(queryFields.email)
        }

        if (queryFields.website) {
            predicateExists()
            predicate = predicate + "website=?"
            params.push(queryFields.website)
        }


        if (queryFields.slogan) {
            predicateExists()
            predicate = predicate + "slogan=?"
            params.push(queryFields.slogan)
        }

        if (queryFields.imageUrl) {
            predicateExists()
            predicate = predicate + "image_url=?"
            params.push(queryFields.imageUrl)
        }

        if (queryFields.address) {
            predicateExists()
            predicate = predicate + "address=?"
            params.push(queryFields.address)
        }
        if (queryFields.otherInformation) {
            predicateExists()
            predicate = predicate + "other_information=?"
            params.push(queryFields.otherInformation)
        }
        if (queryFields.createdAt) {
            predicateExists()
            predicate = predicate + "created_at=?"
            params.push(queryFields.createdAt)
        }
        if (queryFields.updatedAt) {
            predicateExists()
            predicate = predicate + "updated_at=?"
            params.push(queryFields.updatedAt)
        }

        if (queryFields.createdAtFrom) {
            predicateExists()
            predicate = predicate + "created_at>=?"
            params.push(queryFields.createdAtFrom)
        }
        if (queryFields.createdAtTo) {
            predicateExists()
            predicate = predicate + "created_at<=?"
            params.push(queryFields.createdAtTo)
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
