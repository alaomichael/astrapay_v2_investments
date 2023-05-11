export interface ApprovalType {
    walletId: string,
    userId: string,
    investmentId: string,
    requestType: string,
    approvalStatus: string,
    assignedTo: string,
    processedBy: string,
    rfiCode: string,
    // remark: string,
    // remark: Array<RemarkType>,
}