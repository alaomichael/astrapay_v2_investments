'use strict'

import { TimelineType } from 'App/Services/types/timeline_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
import Timeline from 'App/Models/Timeline'
import { DateTime } from 'luxon'
Database.query()

export default class TimelinesServices {
    public async createTimeline(createTimeline: TimelineType): Promise<Timeline> {
        try {
            const timeline = await Timeline.create(createTimeline)
            return timeline
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTimelines(queryParams: any): Promise<Timeline[] | any> {
        try {
            console.log("Query params in timeline service:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams
            // // Using keys method of Object class
            // let isObjectEmpty = (object) => {
            //   return Object.keys(object).length === 0;
            // }
            // console.log(isObjectEmpty(queryParams)); // true

            // // Using stringify method of JSON class
            // isObjectEmpty = (object) => {
            //   return JSON.stringify(object) === "{}";
            // }
            // console.log(isObjectEmpty(queryParams)); // true
            // if (updatedAtFrom == undefined) {
            //   // default to last 3 months
            //   const params = {
            //     updatedAtFrom: DateTime.now().minus({ days: 90 }).toISO()//.toISODate();
            //   }
            //   // const qs = '?' + new URLSearchParams(params).toString()
            //   // console.log(qs)
            //   if (isObjectEmpty(queryParams) == true) {
            //     queryParams = queryParams + new URLSearchParams(params).toString();
            //     console.log("queryParams line 110 =========================")
            //     console.log(queryParams)
            //   } else if (isObjectEmpty(queryParams) == false) {

            //     queryParams = queryParams + '&' + new URLSearchParams(params).toString()
            //     // console.log(queryParams)
            //   }
            //   updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            // }
            // if (updatedAtTo == undefined) {
            //   const params = {
            //     updatedAtTo: DateTime.now().toISO()//.toISODate();
            //   }
            //   queryParams = queryParams + '&' + new URLSearchParams(params).toString()
            //   // console.log(queryParams)
            //   updatedAtTo = DateTime.now().toISO();//.toISODate();
            // }

            if (!updatedAtFrom) {
                // default to last 3 months
                queryParams.updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
                updatedAtFrom = DateTime.now().minus({ days: 90 }).toISO();//.toISODate();
            }
            // debugger;
            if (!updatedAtTo) {
                queryParams.updatedAtTo = DateTime.now().toISO();//.toISODate();
                updatedAtTo = DateTime.now().toISO();//.toISODate();
            }

            const queryGetter = await this.queryBuilder(queryParams)
            let responseData = await Timeline.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            // console.log("Response data in timeline service:", responseData)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async getTimelineByTimelineId(id: string): Promise<Timeline | any | null> {
        try {
            // const timeline = await Timeline.findBy('id', id);
            const timeline = await Timeline.query().where({ id: id }).first();
            // console.log("Timeline search result from service")
            // console.log(timeline);
            return timeline;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTimelineByInvestmentId(investmentId: string): Promise<Timeline | any | null> {
        try {
            // const timeline = await Timeline.findBy('id', id);
            const timeline = await Timeline.query().where({ investment_id: investmentId }).first();
            // console.log("Timeline search result from service")
            // console.log(timeline);
            return timeline;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getTimelineByUserIdAndWalletId(userId: string, walletId: string): Promise<Timeline | null> {
        try {
            const timeline = await Timeline.query().where({ userId: userId, walletId: walletId }).first();
            return timeline;
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async updateTimeline(selectedTimeline: any, updateTimeline: TimelineType): Promise<Timeline | null> {
        try {
            let saveTimeline = await selectedTimeline.merge(updateTimeline)
            await saveTimeline.save();
            return saveTimeline
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteTimeline(selectedTimeline: any): Promise<Timeline | null> {
        try {
            await selectedTimeline.delete()
            return selectedTimeline
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
        if (queryFields.walletId) {
            predicateExists()
            predicate = predicate + "wallet_id=?"
            params.push(queryFields.walletId)
        }
        if (queryFields.userId) {
            predicateExists()
            predicate = predicate + "user_id=?";
            params.push(queryFields.userId)
        }
        if (queryFields.investmentId) {
            predicateExists()
            predicate = predicate + "investment_id=?";
            params.push(queryFields.investmentId)
        }
        if (queryFields.action) {
            predicateExists()
            predicate = predicate + "action=?";
            params.push(queryFields.action)
        }
        if (queryFields.message) {
            predicateExists()
            predicate = predicate + "message=?";
            params.push(queryFields.message)
        }
        if (queryFields.metadata) {
            predicateExists()
            predicate = predicate + "metadata=?";
            params.push(queryFields.metadata)
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