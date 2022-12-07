'use strict'
import Tenures from 'App/Models/InvestmentTenure'
import { TenureType } from 'App/Services/types/tenure_type'
import Database from '@ioc:Adonis/Lucid/Database'
import InvestmentTenure from 'App/Models/InvestmentTenure'
// import { parse } from 'url'
Database.query()

export default class TenuresServices {
    public async createTenure(createTenure: TenureType, id: string): Promise<Tenures[]> {
        try {
            let newTenure = createTenure;// await Tenures.create(createTenure)
            // console.log("New tenure:", typeof newTenure);
            let createdTenures: Tenures[] = [];
            // @ts-ignore 
            let allTenure = await newTenure.forEach(async (tenure: any) => {
                let duration = await InvestmentTenure.create({
                    tenure,
                    typeId: id,
                });
                createdTenures.push(duration);
                //  console.log("The new tenure is, line 23: ", createdTenures);
                // console.log("The new duration is: ", duration);
            });
            return createdTenures
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTenures(queryParams: any): Promise<Tenures[]> {
        try {
            const { limit, offset = 0 } = queryParams
            const queryGetter = await this.queryBuilder(queryParams)
            const responseData = await Tenures.query().whereRaw(queryGetter.sqlQuery, queryGetter.params).orderBy("tenure", "asc").offset(offset).limit(limit)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTenureByTenureId(id: string): Promise<Tenures | null> {
        try {
            const tenure = await Tenures.findBy('id', id);
            return tenure;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTenureByTypeId(id: string): Promise<Tenures | null> {
        try {
            const tenure = await Tenures.findBy('type_id', id);
            return tenure;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async updateTenure(selectedTenure: any, updateTenure: TenureType): Promise<Tenures | null> {
        try {
            let saveTenure = await selectedTenure.merge(updateTenure)
            await saveTenure.save();
            return saveTenure
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteTenure(selectedTenure: any): Promise<Tenures | null> {
        try {
            await selectedTenure.delete()
            return selectedTenure
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteRelatedTenure(typeId: string): Promise<Tenures | null> {
        try {
            // get tenure by type
            // delete all the tenure
            let selectedTenure = await Tenures.query().where('type_id', typeId).delete();
            console.log("The tenure is deleted successfully: ", selectedTenure);
            //@ts-ignore
            return selectedTenure;
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
        // const { fundingWalletId, isDisbursementAutomated, fundingSourceTerminal,isLoanAutomated,isTerminationAutomated,tagName,currencyCode,limit } = queryParams;
        if (queryFields.id) {
            predicateExists()
            predicate = predicate + "id=?"
            params.push(queryFields.id)
        }
        if (queryFields.typeId) {
            predicateExists()
            predicate = predicate + "type_id=?"
            params.push(queryFields.typeId)
        }
        if (queryFields.tenure) {
            predicateExists()
            predicate = predicate + "tenure=?";
            params.push(queryFields.tenure)
        }
        response.sqlQuery = predicate
        response.params = params
        return response
    }
}