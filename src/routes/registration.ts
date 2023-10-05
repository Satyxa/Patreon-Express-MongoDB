import {Router, Request, Response} from "express";
import {checkAuth, checkValidation, registerValidation, usersValidation} from "../validation";
import {UserAccountDBType, userT} from "../types";
import {createUser} from "../autentification";
import {patreonUsers} from "../db/db";
import {emailAdapter} from "../email-adapter";
import {rateLimit} from "express-rate-limit";
import {rateLimiter} from "../rateLimit";

export const registrationRouter = Router({})

registrationRouter.post('/registration', rateLimiter, ...registerValidation, checkValidation,  async(req: Request, res: Response) => {
    const {email, login, password} = req.body
    if(!email || !login || !password) return res.sendStatus(401)
    const newUser: UserAccountDBType = await createUser(login, email, password)
    await patreonUsers.insertOne({...newUser})
    await emailAdapter.sendEmail(newUser.AccountData.email, 'Confirm your email', `<h1>Thank for your registration</h1>
    <p>To finish registration please follow the link below:
        <a href=https://somesite.com/confirm-email?code=${newUser.EmailConfirmation.confirmationCode}'>complete registration</a>
    </p>`, res)

    return res.status(204)
})