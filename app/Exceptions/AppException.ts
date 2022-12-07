import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Exception } from '@poppinss/utils'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new NoLoginException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class AppException extends Exception {
    public code = 'E_APP_EXCEPTION'
    public status = 400
    public codeSt = "400"
    public data = {}

    constructor({ message, status, code, codeSt, data }: { message: string; status?: number; code?: string, codeSt?: string, data?: any }) {
        super(message, status, code)
        this.message = message
        this.code = code ? code : this.code
        this.status = status ? status : this.status
        this.codeSt = codeSt ? codeSt : this.status.toString()
        this.data = data
    }



    public async handle(_error: this, ctx: HttpContextContract) {
        // return ctx.response.status(401).send(this.message)
        console.log("errrrrrrrrrooooooooooooooooooooooooooooooo 11111111111111111111111111333333333333333333333333")
        // return ctx.response.status(this.status).send({
        //   status: "error",
        //   statusCode: this.codeSt,
        //   message: this.message
        // })
        return ctx.response.status(this.status).json({
            status: "error",
            statusCode: this.codeSt,
            message: this.message
        })
    }
}