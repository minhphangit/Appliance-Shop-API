import express, { NextFunction, Request, Response } from 'express';
import { validateSchemaByField } from '../../utils/validateSchema';
import { Comment, commentSchema } from '../../entities/comment.model';
import { allowRoles } from '../../middlewares/verifyRoles';
import passport from 'passport';
export const CommentsRouter = express.Router();
const { passportVerifyToken } = require('../../middlewares/passport');
passport.use('admin', passportVerifyToken);

// Admin get all comments
CommentsRouter.get(
  '/all',
  passport.authenticate('admin', { session: false }),
  allowRoles('R1', 'R3'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await Comment.find().lean({ virtuals: true }).populate('post', 'title'));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Database Error' });
    }
  },
);

//Admin comment search
CommentsRouter.get('/all/search/query', passport.authenticate('admin', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response) => {
  let query: { [index: string]: any } = {};
  for (var queryKey in req.query) {
    if (queryKey in commentSchema.fields)
      try {
        await validateSchemaByField(commentSchema, req.query, queryKey);
        query[queryKey] = req.query[queryKey];
      } catch (error: any) {
        return res.status(400).json(error.errors);
      }
  }
  // if (db == "order") {
  //   query = { ...query, ...(await ordersQuery(req.query)) };
  // }
  try {
    let found = await Comment.find(query).lean({ virtuals: true }).populate('post', 'title');
    return res.json(found);
  } catch (error) {
    res.status(500).json({ message: 'Database Error' });
  }
});

//Admin update comment by id
CommentsRouter.patch(
  '/all/:id',
  passport.authenticate('admin', { session: false }),
  allowRoles('R1', 'R3'),
  async (req: any, res: Response, next: NextFunction) => {
    const id = req.params.id;
    let inputError = [];
    for (const key in req.body) {
      if (key in commentSchema.fields) {
        try {
          await validateSchemaByField(commentSchema, req.body, key);
        } catch (error: any) {
          inputError.push(error.errors);
        }
      }
    }
    if (inputError.length > 0) {
      return res.status(400).json({ message: inputError.toString() });
    }
    try {
      let idData = await Comment.findByIdAndUpdate(id, req.body);
      if (idData) {
        return res.json({ message: `Comment updated successfully` });
      } else res.status(404).json({ message: `Couldn't find that comment` });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Database Error' });
    }
  },
);

//Admin delete comment by id
CommentsRouter.delete('/all/:id', passport.authenticate('admin', { session: false }), allowRoles('R1', 'R3'), async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    let idData = await Comment.findByIdAndDelete(id);
    idData ? res.json({ message: 'Comment deleted successfully' }) : res.status(404).json({ message: `Couldn't find that comment` });
  } catch (error) {
    res.status(500).json({ message: 'Database Error' });
  }
});
