import LoginUserData from 'App/Models/LoginUserData'

declare module '@ioc:Adonis/Core/HttpContext' {
    interface HttpContextContract {
        loginUserData?: LoginUserData
    }
}