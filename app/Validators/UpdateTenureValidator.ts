import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class UpdateTenureValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        // initiate the parent class
        super()
    }

    public schema = schema.create({
        duration: schema.string.optional(),
    })

}
