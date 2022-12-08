'use strict'

import { ApprovalType } from 'App/Services/types/approval_type'
import Database from '@ioc:Adonis/Lucid/Database'
// import { parse } from 'url'
import Approval from 'App/Models/Approval'
import { DateTime } from 'luxon'
import { v4 as uuid } from "uuid";
import TimelinesServices from './TimelinesServices'
import InvestmentsServices from './InvestmentsServices'

Database.query()

export default class ApprovalsServices {
    public async createApproval(terminateApproval: ApprovalType): Promise<Approval> {
        try {
            const approval = await Approval.create(terminateApproval)
            const timelineService = new TimelinesServices();
            const investmentService = new InvestmentsServices();
            let timelineObject;
            // change timeline messsage based on the requestType
            if (approval.requestType === "start_investment") {
                let investmentId = approval.investmentId;
                let investmentDetails;
                if (investmentId) {
                    investmentDetails = await investmentService.getInvestmentByInvestmentId(investmentId)
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment request approval created",
                    investmentId: approval.investmentId,
                    userId: investmentDetails.userId,
                    walletId: investmentDetails.walletId,
                    // @ts-ignore
                    message: `${investmentDetails.firstName} investment request approval record has just been created.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${investmentDetails.requestType}`,
                };
                // console.log("Timeline object line 285:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 287:", newTimeline);
            }

            return approval
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovals(queryParams: any): Promise<Approval[] | any> {
        try {
            console.log("Query params in approval service:", queryParams)
            let { limit, offset = 0, updatedAtFrom, updatedAtTo } = queryParams;
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
            let responseData = await Approval.query().whereRaw(queryGetter.sqlQuery, queryGetter.params)
                .orderBy("updated_at", "desc")
                .offset(offset)
                .limit(limit)

            console.log("Response data in approval service:", responseData)
            return responseData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByApprovalId(id: string): Promise<Approval | any | null> {
        try {
            // const approval = await Approval.findBy('id', id);
            const approval = await Approval.query().where({ id: id }).first();
            console.log("Approval search result from service")
            console.log(approval);
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }



    public async getApprovalByInvestmentId(InvestmentId: string): Promise<Approval | null> {
        try {
            const approval = await Approval.query().where({ investment_id: InvestmentId }).first();
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async getApprovalByUserIdAndWalletId(userId: string, walletId: string): Promise<Approval | null> {
        try {
            const approval = await Approval.query().where({ userId: userId, walletId: walletId }).first();
            return approval;
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    public async updateApproval(selectedApproval: any, updateApproval: ApprovalType): Promise<Approval | null> {
        try {
            let saveApproval = await selectedApproval.merge(updateApproval)
            await saveApproval.save();
            debugger
            const investmentService = new InvestmentsServices();
            const selectedInvestmentRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
            const timelineService = new TimelinesServices();
            let timelineObject;
            // change timeline messsage based on the requestType
            if (saveApproval.requestType === "start_investment") {
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "investment_approved" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_approved";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    // TODO: handle remark
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "investment_declined" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_declined";
                    // selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // TODO: handle remark
                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment request approval updated",
                    investmentId: selectedInvestmentRequest.investmentId,
                    userId: selectedInvestmentRequest.userId,
                    walletId: selectedInvestmentRequest.walletId,
                    // @ts-ignore
                    message: `${selectedInvestmentRequest.firstName} investment request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${selectedInvestmentRequest.requestType}`,
                };
                // console.log("Timeline object line 408:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 410:", newTimeline);
            } else if (saveApproval.requestType === "terminate_investment") {
                const selectedInvestmentTerminationRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedInvestmentTerminationRequest ========================================================")
                    console.log(selectedInvestmentTerminationRequest)
                    let selectedInvestmentTerminationRequestUpdate = selectedInvestmentTerminationRequest;
                    selectedInvestmentTerminationRequestUpdate.approvalStatus = "investment_termination_approved" //saveApproval.approvalStatus;
                    selectedInvestmentTerminationRequestUpdate.status = "investment_termination_completed";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    debugger
                    await investmentService.updateInvestment(selectedInvestmentTerminationRequest, selectedInvestmentTerminationRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentTerminationRequest ========================================================")
                    console.log(selectedInvestmentTerminationRequest)
                    let selectedInvestmentTerminationRequestUpdate = selectedInvestmentTerminationRequest;
                    selectedInvestmentTerminationRequestUpdate.approvalStatus = "investment_termination_declined" //saveApproval.approvalStatus;
                    selectedInvestmentTerminationRequestUpdate.status = "investment_termination_declined";
                    // selectedInvestmentTerminationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentTerminationRequest, selectedInvestmentTerminationRequestUpdate);
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment termination request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: selectedApproval.userId,
                    walletId: selectedApproval.walletId,
                    // @ts-ignore
                    message: `${selectedApproval.firstName} investment termination request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${selectedApproval.requestType}`,
                };
                // console.log("Timeline object line 408:", timelineObject);
                await timelineService.createTimeline(timelineObject);
                // let newTimeline = await timelineService.createTimeline(timelineObject);
                // console.log("new Timeline object line 410:", newTimeline);
            }
            return saveApproval
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteApproval(selectedApproval: any): Promise<Approval | null> {
        try {
            await selectedApproval.delete()
            return selectedApproval
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
        if (queryFields.requestType) {
            predicateExists()
            predicate = predicate + "request_type=?";
            params.push(queryFields.requestType)
        }
        if (queryFields.approvalStatus) {
            predicateExists()
            predicate = predicate + "approval_status=?";
            params.push(queryFields.approvalStatus)
        }
        if (queryFields.assignedTo) {
            predicateExists()
            predicate = predicate + "assigned_to=?";
            params.push(queryFields.assignedTo)
        }
        if (queryFields.processedBy) {
            predicateExists()
            predicate = predicate + "processed_by=?";
            params.push(queryFields.processedBy)
        }
        if (queryFields.remark) {
            predicateExists()
            predicate = predicate + "remark=?";
            params.push(queryFields.remark)
        }
        if (queryFields.createdAt) {
            predicateExists()
            predicate = predicate + "terminated_at=?";
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