import { ObjectId } from 'mongodb';
import mongoose, { Schema, model } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import * as yup from 'yup';
import { imageUrlDbSchema, imageUrlSchema } from './post.model';

export const postCategorySchema = yup.object().shape({
  title: yup.string().required().max(100),
  description: yup.string().max(500),
  parentId: yup
    .string()
    .nullable()
    .test('Validate ObjectId', 'parentId is not a valid ObjectId', async (value?: any) => {
      if (!value) return true;
      return ObjectId.isValid(value);
    }),
  url: yup.string().max(500),
  imageUrl: imageUrlSchema,
  isDeleted: yup.boolean().default(false),
  createdBy: yup.string().max(100),
  updatedBy: yup.string().max(100),
});

interface PostCategory extends Omit<yup.InferType<typeof postCategorySchema>, 'parentId'> {
  parentId: ObjectId;
}

const postCategoryDbSchema = new Schema<PostCategory>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxLength: 500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'PostCategory',
    },
    url: {
      type: String,
      maxLength: 500,
      unique: true,
    },
    imageUrl: imageUrlDbSchema,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
      maxLength: 100,
      default: 'Annonyomous',
    },
    updatedBy: {
      type: String,
      maxLength: 100,
    },
  },
  { versionKey: false, timestamps: true },
);
postCategoryDbSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'postCategoryId',
  count: true,
});
postCategoryDbSchema.virtual('parentCategory', {
  ref: 'PostCategory',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});
postCategoryDbSchema.plugin(mongooseLeanVirtuals);
postCategoryDbSchema.set('toObject', { virtuals: true });
postCategoryDbSchema.set('toJSON', { virtuals: true });
export const PostCategory = model('PostCategory', postCategoryDbSchema);
