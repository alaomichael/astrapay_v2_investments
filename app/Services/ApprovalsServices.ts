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
    public async createApproval(createApproval: ApprovalType): Promise<Approval> {
        try {
            const approval = await Approval.create(createApproval)
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
            const investmentService = new AccountsServices();
            const selectedInvestmentRequest = await investmentService.getInvestmentByInvestmentId(saveApproval.investmentId);
            const investmentLinkingService = new LinkAccountsServices();
            const tokenService = new TokensServices();
            const cardService = new CardsServices()
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
                    selectedInvestmentRequestUpdate.status = "investment_number_pending";
                    selectedInvestmentRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedInvestmentRequest ========================================================")
                    console.log(selectedInvestmentRequest)
                    let selectedInvestmentRequestUpdate = selectedInvestmentRequest;
                    selectedInvestmentRequestUpdate.approvalStatus = "investment_declined" //saveApproval.approvalStatus;
                    selectedInvestmentRequestUpdate.status = "investment_declined";
                    selectedInvestmentRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateInvestment(selectedInvestmentRequest, selectedInvestmentRequestUpdate);
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment opening request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: selectedApproval.userId,
                    walletId: selectedApproval.walletId,
                    // @ts-ignore
                    message: `${selectedApproval.firstName} investment opening request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${selectedApproval.requestType}`,
                };
                // console.log("Timeline object line 408:", timelineObject);
                let newTimeline = await timelineService.createTimeline(timelineObject);
                console.log("new Timeline object line 410:", newTimeline);
            } else if (saveApproval.requestType === "create_investment") {
                const selectedAccountCreationRequest = await investmentService.getAccountByAccountId(saveApproval.investmentId);
                debugger
                // get the request by request id
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedAccountCreationRequest ========================================================")
                    console.log(selectedAccountCreationRequest)
                    let selectedAccountCreationRequestUpdate = selectedAccountCreationRequest;
                    selectedAccountCreationRequestUpdate.approvalStatus = "investment_creation_approved" //saveApproval.approvalStatus;
                    selectedAccountCreationRequestUpdate.status = "investment_creation_completed";
                    // selectedAccountCreationRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    debugger
                    await investmentService.updateInvestment(selectedAccountCreationRequest, selectedAccountCreationRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedAccountCreationRequest ========================================================")
                    console.log(selectedAccountCreationRequest)
                    let selectedAccountCreationRequestUpdate = selectedAccountCreationRequest;
                    selectedAccountCreationRequestUpdate.approvalStatus = "investment_creation_declined" //saveApproval.approvalStatus;
                    selectedAccountCreationRequestUpdate.status = "investment_creation_declined";
                    // selectedAccountCreationRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentService.updateAccount(selectedAccountCreationRequest, selectedAccountCreationRequestUpdate);
                }
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment creation request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: selectedApproval.userId,
                    walletId: selectedApproval.walletId,
                    // @ts-ignore
                    message: `${selectedApproval.firstName} investment creation request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${selectedApproval.requestType}`,
                };
                // console.log("Timeline object line 408:", timelineObject);
                let newTimeline = await timelineService.createTimeline(timelineObject);
                console.log("new Timeline object line 410:", newTimeline);
            } else if (saveApproval.requestType === "link_investment") {
                // get the request by request id
                const selectedAccountLinkingRequest = await investmentLinkingService.getLinkAccountByLinkAccountId(saveApproval.linkAccountId);
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedAccountLinkingRequest ========================================================")
                    console.log(selectedAccountLinkingRequest)
                    let selectedAccountLinkingRequestUpdate = selectedAccountLinkingRequest;
                    selectedAccountLinkingRequestUpdate.approvalStatus = "investment_linking_approved" //saveApproval.approvalStatus;
                    selectedAccountLinkingRequestUpdate.status = "investment_number_linked";
                    selectedAccountLinkingRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    await investmentLinkingService.updateLinkAccount(selectedAccountLinkingRequest, selectedAccountLinkingRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedAccountLinkingRequest ========================================================")
                    console.log(selectedAccountLinkingRequest)
                    let selectedAccountLinkingRequestUpdate = selectedAccountLinkingRequest;
                    selectedAccountLinkingRequestUpdate.approvalStatus = "investment_linking_declined" //saveApproval.approvalStatus;
                    selectedAccountLinkingRequestUpdate.status = "investment_linking_declined";
                    selectedAccountLinkingRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await investmentLinkingService.updateLinkAccount(selectedAccountLinkingRequest, selectedAccountLinkingRequestUpdate);
                }
                let { userId, walletId, requestType } = saveApproval.$original;
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "investment linking request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: userId,
                    walletId: walletId,
                    // @ts-ignore
                    message: `${selectedAccountLinkingRequest.firstName} investment linking request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${requestType}`,
                };
                // console.log("Timeline object line 246:", timelineObject);
                let newTimeline = await timelineService.createTimeline(timelineObject);
                console.log("new Timeline object line 248:", newTimeline);
            } else if (saveApproval.requestType === "token_request") {
                // get the request by request id
                const selectedTokenRequest = await tokenService.getTokenByTokenId(saveApproval.tokenId);
                let selectedTokenRequestUpdate = selectedTokenRequest;
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedAccountLinkingRequest ========================================================")
                    console.log(selectedTokenRequest)
                    // let selectedTokenRequestUpdate = selectedTokenRequest;
                    selectedTokenRequestUpdate.approvalStatus = "token_request_approved" //saveApproval.approvalStatus;
                    selectedTokenRequestUpdate.status = "token_request_approved";
                    selectedTokenRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    await tokenService.updateToken(selectedTokenRequest, selectedTokenRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedAccountLinkingRequest ========================================================")
                    console.log(selectedTokenRequest)
                    // let selectedTokenRequestUpdate = selectedTokenRequest;
                    selectedTokenRequestUpdate.approvalStatus = "token_request_declined" //saveApproval.approvalStatus;
                    selectedTokenRequestUpdate.status = "token_request_declined";
                    selectedTokenRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await tokenService.updateToken(selectedTokenRequest, selectedTokenRequestUpdate);
                }
                let { userId, walletId, requestType } = saveApproval.$original;
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "token request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: userId,
                    walletId: walletId,
                    // @ts-ignore
                    message: `${selectedTokenRequest.firstName} token request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${requestType}`,
                };
                // console.log("Timeline object line 300:", timelineObject);
                let newTimeline = await timelineService.createTimeline(timelineObject);
                console.log("new Timeline object line 302:", newTimeline);
            } else if (saveApproval.requestType === "card_request") {
                // get the request by request id
                const selectedCardRequest = await cardService.getCardByCardId(saveApproval.cardId);
                let selectedCardRequestUpdate = selectedCardRequest;
                // update status based on admin action
                if (saveApproval.approvalStatus === "approved") {
                    // update the neccesary field
                    console.log("selectedCardRequest ========================================================")
                    console.log(selectedCardRequest)
                    // let selectedCardRequestUpdate = selectedTokenRequest;
                    selectedCardRequestUpdate.approvalStatus = "card_request_approved" //saveApproval.approvalStatus;
                    selectedCardRequestUpdate.status = "card_request_approved";
                    selectedCardRequestUpdate.remark = saveApproval.remark;
                    // update the record
                    await cardService.updateCard(selectedCardRequest, selectedCardRequestUpdate);
                } else if (saveApproval.approvalStatus === "declined") {
                    // update the neccesary field
                    console.log("selectedCardRequest ========================================================")
                    console.log(selectedCardRequest)
                    // let selectedCardRequestUpdate = selectedTokenRequest;
                    selectedCardRequestUpdate.approvalStatus = "token_request_declined" //saveApproval.approvalStatus;
                    selectedCardRequestUpdate.status = "token_request_declined";
                    selectedCardRequestUpdate.remark = saveApproval.remark;

                    // update the record
                    await tokenService.updateToken(selectedCardRequest, selectedCardRequestUpdate);
                }
                let { userId, walletId, requestType } = saveApproval.$original;
                // update timeline
                timelineObject = {
                    id: uuid(),
                    action: "card request approval updated",
                    investmentId: saveApproval.investmentId,
                    userId: userId,
                    walletId: walletId,
                    // @ts-ignore
                    message: `${selectedTokenRequest.firstName} card request approval record has just been updated.`,
                    createdAt: DateTime.now(),
                    metadata: `request type : ${requestType}`,
                };
                // console.log("Timeline object line 481:", timelineObject);
                let newTimeline = await timelineService.createTimeline(timelineObject);
                console.log("new Timeline object line 483:", newTimeline);
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