export interface ApprovalType {
    walletId: string,
    userId: string,
    investmentId: string,
    email: string,
    requestType: string,
    approvalStatus: string,
    assignedTo: string,
    processedBy: string,
    rfiCode: string,
    approvedBy: string,
    // remark: string,
    // remark: Array<RemarkType>,
}