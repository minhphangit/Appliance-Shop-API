import express from 'express';
import { PostCategoriesRouter } from './categories';
import { PostsRouter } from './posts';
import { CommentsRouter } from './comments';

export const articleRouter = express.Router();
articleRouter.use('/categories', PostCategoriesRouter);
articleRouter.use('/posts', PostsRouter);
articleRouter.use('/comments', CommentsRouter);
