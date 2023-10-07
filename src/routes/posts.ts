import {Router, Response, Request} from "express";
import {UserModel} from '../db/UserModel'
import {PostModel} from "../db/PostModel";
import {BlogModel} from "../db/BlogModel";
import {CommentModel} from "../db/CommentModel";
import {commentsT, postT} from '../types'
import {blogIdValidation, checkAuth, checkValidation, commentValidator, postCreateValidation} from "../validation";
import {commentsPagAndSort, paginationSort, postPagAndSort} from "../PaginationAndSort";
import {AuthMiddleware} from "../AuthMiddleware";
import {Filter} from "mongodb";
import {DB_Utils} from "../DB-utils";


export const postsRouter = Router({})

postsRouter.get('/:id/comments', async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const {pageNumber, pageSize, sortBy, sortDirection} = await paginationSort(req)
        const filter: Filter<commentsT> = {postId: id}
        const totalCount = await CommentModel.countDocuments(filter)
        const pagesCount = Math.ceil(totalCount / pageSize)

        if (!await PostModel.findOne({id}))return res.sendStatus(404)

        const comments = await commentsPagAndSort(filter, sortBy, sortDirection, pageSize, pageNumber)

        return res.status(200).send({
            pagesCount, page: +pageNumber,
            pageSize, totalCount, items: comments})
    } catch (err){
        console.log(err, `=> get "/:id/comments" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.post('/:id/comments',AuthMiddleware, ...commentValidator, checkValidation, async (req:Request, res:Response) => {
    try {
        const id = req.params.id
        const content: string = req.body.content

        if(!await PostModel.findOne({id})) return res.sendStatus(404)
        const user = await UserModel.findOne({id: req.userId!})
        if(!user)return res.sendStatus(404)

        const {comment, viewComment} = DB_Utils.createComment(id, content, user)

        await CommentModel.create({...comment})
        await PostModel.updateOne({id}, {$push: {comments: comment}})
        return res.status(201).send(viewComment)
    } catch (err){
        console.log(err, `=> create comment for post "/:id/comments" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const {pageNumber, pageSize, sortBy, sortDirection} = await paginationSort(req)
        const totalCount = await PostModel.countDocuments({})
        const pagesCount = Math.ceil(totalCount / pageSize)

        const posts = await postPagAndSort({}, sortBy, sortDirection, pageSize, pageNumber)
        return res.status(200).send({
            pagesCount, page: pageNumber,
            pageSize, totalCount, items: posts})
    } catch (err){
        console.log(err, `=> get all posts with sort and pagination "/" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const {foundPost} = await DB_Utils.findPost(req, res)
        if (!foundPost) return res.sendStatus(404)
        return res.status(200).send(foundPost)
    } catch (err){
        console.log(err, `=> get post by id "/:id" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.post('/', checkAuth, ...postCreateValidation, ...blogIdValidation, checkValidation, async (req: Request, res: Response) => {
    try {
        const {title, shortDescription, content, blogId} = req.body
        const blog = await BlogModel.findOne({id: blogId})
        if(!blog) return res.sendStatus(404)
        const newPost: postT = DB_Utils.createPost(title, shortDescription, content, blogId, blog.name)

        await PostModel.create({...newPost})
        delete newPost.comments
        return res.status(201).send(newPost)
    } catch (err){
        console.log(err, `=> create post "/" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.put('/:id', checkAuth, ...postCreateValidation,...blogIdValidation, checkValidation, async (req: Request, res: Response) => {
    try {
        const {id} = req.params
        const {title, shortDescription, content, blogId} = req.body
        const blog = await BlogModel.findOne({id: blogId})
        const result = await PostModel.updateOne({id},
            {
                $set: {
                    title,
                    shortDescription,
                    content,
                    blogId,
                    blogName: blog!.name,
                }
            })
        if(result.matchedCount === 1){return res.sendStatus(204)}
        else {return res.sendStatus(404)}
    } catch (err){
        console.log(err, `=> update post (put) "/:id" postsRouter`)
        return res.sendStatus(500)
    }
})

postsRouter.delete('/:id', checkAuth,async (req: Request, res: Response) => {
    try {
        const {id} = req.params
        const result = await PostModel.deleteOne({id})
        if(result.deletedCount === 1) return res.sendStatus(204)
        else return res.sendStatus(404)
    } catch (err) {
        console.log(err, `=> delete "/:id" postsRouter`)
        return res.sendStatus(500)
    }
})