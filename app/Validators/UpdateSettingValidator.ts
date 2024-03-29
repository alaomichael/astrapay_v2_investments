import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class UpdateSettingValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        rfiName: schema.string.optional({ escape: true },
            [rules.maxLength(100), rules.unique({
                table: 'settings',
                column: 'rfi_name'
            })]
        ),
        rfiCode: schema.string.optional({ escape: true },
            [rules.maxLength(100), rules.unique({
                table: 'settings',
                column: 'rfi_code'
            })]
        ),
        rfiImageUrl: schema.string.optional(),
        // initiationNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        initiationNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // activationNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        // maturityNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        // payoutNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        // rolloverNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        // liquidationNotificationEmail: schema.string.optional({ escape: true }, [rules.email()]),
        // activationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        activationNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // maturityNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        maturityNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // payoutNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        payoutNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // rolloverNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        rolloverNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // liquidationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        liquidationNotificationEmail: schema.array.optional().members(
            schema.object().members({
                email: schema.string.optional({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        investmentWalletId: schema.string.optional({ escape: true },),
        payoutWalletId: schema.string.optional({ escape: true },),
        isPayoutAutomated: schema.boolean.optional(),
        liquidationPenalty: schema.number.optional(),
        fundingSourceTerminal: schema.string.optional({ escape: true },),
        isInvestmentAutomated: schema.boolean.optional(),
        isRolloverAutomated: schema.boolean.optional(),
        isAllPayoutSuspended: schema.boolean.optional(),
        isAllRolloverSuspended:schema.boolean.optional(),
        // investmentType: schema.string.optional({ escape: true },),
        tagName: schema.string.optional({ escape: true },),
        currencyCode: schema.string.optional(),
        // tagName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
        //     table: 'settings',
        //     column: 'tag_name'
        // })]),
    })

}