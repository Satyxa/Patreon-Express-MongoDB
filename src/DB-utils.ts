import {PostModel} from "./db/PostModel";
import {BlogModel} from "./db/BlogModel";
import {Request, Response} from "express";
import {commentsT, postT} from "./types";
import * as uuid from "uuid";

export const DB_Utils = {
    findBlog: async(req: Request, res: Response) => {
        const {id} = req.params
        const foundBlog = await BlogModel.findOne({id}, { projection : { _id:0 }})
        return {id, foundBlog}
    },

    findPost: async(req: Request, res: Response) => {
        const {id} = req.params
        const foundPost = await PostModel.findOne({id}, { projection : { _id:0, comments: 0 }})
        return {id, foundPost}
    },

    createNewVideo: (newVideoId, title, author, dateNow, availableResolutions) => {
        return {
            id: newVideoId,
            title,
            author,
            canBeDownloaded: false,
            minAgeRestriction: null,
            createdAt: dateNow.toISOString(),
            publicationDate: new Date(dateNow.setDate(dateNow.getDate() + 1)).toISOString(),
            availableResolutions
        }
    },

    updateVideo: (title, author,minAgeRestriction, availableResolutions, publicationDate, canBeDownloaded) => {
        return {
            title: title as string,
            author: author as string,
            publicationDate,
            availableResolutions,
            canBeDownloaded,
            minAgeRestriction
        }
    },

    createPost: (title, shortDescription, content, blogId, blogName) => {
        return {
            id: uuid.v4(),
            title,
            shortDescription,
            content,
            blogId,
            blogName,
            createdAt: new Date().toISOString(),
            comments: []
        }
    },

    createComment: (id, content, user) => {
        const comment: commentsT = {
            id: uuid.v4(),
            postId: id,
            content,
            createdAt: new Date().toISOString(),
            commentatorInfo: {
                userId: user.id,
                userLogin: user.AccountData.username
            }
        }
        const viewComment = {
            content: comment.content,
            commentatorInfo: comment.commentatorInfo,
            createdAt: comment.createdAt,
            id: comment.id
        }
        return {viewComment, comment}
    }
}