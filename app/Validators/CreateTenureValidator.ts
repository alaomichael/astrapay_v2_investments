import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateTenureValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        // initiate the parent class
        super()
    }

    public schema = schema.create({
        typeId: schema.string(),
        duration: schema.string(),
    })

}
