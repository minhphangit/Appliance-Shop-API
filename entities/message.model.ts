import { ObjectId } from 'mongodb';
import { Schema, model } from 'mongoose';
import * as yup from 'yup';

const messageSchema = yup.object().shape({
  chatId: yup.number().required(),
  type: yup.string().required().oneOf(['order', 'product', 'text', 'image']),
  replyTo: yup.string().nullable(),
  sender: yup.string().required().oneOf(['customer', 'employee']),
  status: yup.string().required().oneOf(['sent', 'seen', 'deleted']).default('sent'),
  content: yup.string().required(),
  editHistory: yup.array(yup.string()).nullable(),
});

interface Message extends Omit<yup.InferType<typeof messageSchema>, 'replyTo'> {
  replyTo: ObjectId;
}

const messageDbSchema = new Schema<Message>(
  {
    chatId: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['order', 'product', 'text', 'image'],
      default: 'text',
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    sender: {
      type: String,
      required: true,
      enum: ['customer', 'employee'],
    },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'seen', 'deleted'],
      default: 'sent',
    },
    content: {
      type: String,
      required: true,
    },
    editHistory: {
      type: [String],
      nullable: true,
    },
  },
  { versionKey: false, timestamps: true },
);
export const Message = model('Message', messageDbSchema);
