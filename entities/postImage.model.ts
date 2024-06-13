import { ObjectId } from 'mongodb';
import { Schema, model } from 'mongoose';
import * as yup from 'yup';

const imageUrlSchema = yup.object().shape({
  url: yup.string().required(),
  publicId: yup.string().required(),
  postId: yup.string(),
  name: yup.string().required(),
  size: yup.number().required(),
});

export interface imageUrl extends Omit<yup.InferType<typeof imageUrlSchema>, 'postId'> {
  postId?: ObjectId;
}

const imageUrlDbSchema = new Schema<imageUrl>({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
});

export const ImageUrl = model<imageUrl>('ImageUrl', imageUrlDbSchema);
