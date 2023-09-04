import {Router, Request, Response} from "express";
import {checkAuth, checkValidation, usersValidation} from "../validation";
import {UserAccountDBType, userT} from "../types";
import {createUser} from "../autentification";
import {patreonUsers} from "../db/db";
import {emailAdapter} from "../email-adapter";
import {Filter} from "mongodb";

export const registrationRouter = Router({})

registrationRouter.post('/registration', checkAuth, ...usersValidation, checkValidation,  async(req: Request, res: Response) => {
    const {email, login, password} = req.body
    if(!email || !login || !password) return res.sendStatus(401)
    const filter: Filter<userT> = {$or: [{'AccountData.username': {$regex: login, $options: 'i'}}, {'AccountData.email': {$regex: email, $options: 'i'}}]}
    const checkLoginAndEmail = await patreonUsers.findOne(filter, { projection : { _id:0, passwordHash: 0, passwordSalt: 0 }})
    if (checkLoginAndEmail) return res.sendStatus(400)
    const newUser: UserAccountDBType = await createUser(login, email, password)
    await patreonUsers.insertOne({...newUser})
    console.log('before email send')
    await emailAdapter.sendEmail(newUser.AccountData.email, 'Confirm your email', newUser.EmailConfirmation.confirmationCode, res)

    return res.status(204)
})