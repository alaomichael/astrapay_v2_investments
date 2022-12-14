import { schema, } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class UpdateApprovalValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        approvalStatus: schema.string(),
        assignedTo: schema.string(),
        // requestType: schema.string(),
        remark: schema.array.optional().members(
            schema.object.optional().members({
                // field: schema.enum([
                //     "accountNo",
                //     "customerId",
                //     "branch",
                //     "biometricIdNo",
                //     "title",
                //     "surname",
                //     "firstName",
                //     "otherName",
                //     "maritalStatus",
                //     "gender",
                //     "motherMaidenName",
                //     "dateOfBirth",
                //     "placeOfBirth",
                //     "stateOfOrigin",
                //     "localGovtArea",
                //     "nationality",
                //     "residentPermitNo",
                //     "residentPermitIssueDate",
                //     "residentPermitExpiryDate",
                //     "taxIdentificationNo",
                //     "purposeOfAccount",
                //     "dualCitizenship",
                //     "dualCitizenshipSpecification",
                //     "socialSecurityNo",
                //     "walletId",
                //     "userId",
                //     "assignedTo",
                //     "approvedBy",
                //     "contactDetails",
                //     "accountServices",
                //     "bvn",
                //     "isBvnVerified",
                //     "validMeansOfIdentification",
                //     "chequeConfirmationThreshold",
                //     "employmentDetails",
                //     "detailsOfNextOfKin",
                //     "detailsOfAccountHeldWithOtherBank",
                //     "accountProductId",
                //     "accountProductName",
                //     "bankCode",
                //     "currencyCode",
                //     "accountUsageMetrics",
                //     "cardUsageMetrics",
                //     "tokenUsageMetrics",
                //     "lng",
                //     "lat",
                //     "isRequestSent",
                //     "accountOpeningRequestReference",
                //     "isAccountCreated",
                //     "accountCreationRequestReference",
                //     "isAccountOpeningCompleted",
                //     "accountOpeningCompletionDate",
                //     "requestType",
                //     "approvalStatus",
                //     "processedBy",
                //     "label",
                //     "status",
                //     "checkedForCompletionAt",
                //     "branch",
                //     "accountName",
                //     "linkAccountNo",
                //     "phoneNo",
                //     "email",
                //     "validMeansOfIdentification",
                //     "authorizationRecord",
                //     "officialRecord",
                //     "accountLinkingRequestReference",
                //     "isAccountLinked",
                //     "isAccountLinkingCompleted",
                //     "accountLinkingCompletionDate",
                // ]),
                field: schema.string(),
                reason: schema.string(),
            })),
        processedBy: schema.string(),
        isRolloverSuspended: schema.boolean.optional(),
        rolloverReactivationDate: schema.date.optional({ format: 'yyyy-MM-dd', }),
        isPayoutSuspended: schema.boolean.optional(),
        payoutReactivationDate: schema.date.optional({ format: 'yyyy-MM-dd', }),
    });
}
