import { ObjectId } from 'mongodb';
import * as yup from 'yup';

yup.setLocale({
  number: {
    integer: '${path} phải là số nguyên',
    positive: '${path} phải lớn hơn 0',
    moreThan: '${path} phải lớn hơn ${more}',
  },
  string: {
    max: '${path} không quá ${max} ký tự',
    min: '${path} phải có ít nhất ${min} ký tự',
    email: 'Không đúng định dạng email',
    url: 'Không đúng định dạng URL',
  },
  date: {
    min: '${path} phải sau ${min}',
    max: '${path} phải trước ${max}',
  },
  mixed: {
    required: '${path} là bắt buộc',
    notType: '${path} không đúng định dạng ${type}',
  },
});

const validateSchema = (schema: yup.Schema, data: any) => {
  return schema.validate(data, { abortEarly: false, strict: false });
};
const validateSchemaByField = (schema: yup.Schema, data: any, field: string) => {
  return schema.validateAt(field, data);
};
const validateId = (id: any) => {
  let idSchema = yup.number().integer().positive();
  return idSchema.validate(id);
};
const validateObjectId = (id: any) => {
  let objectIdSchema = yup.string().test('Validate ObjectId', '${path} is not a valid ObjectId', (value: any) => {
    return ObjectId.isValid(value);
  });
  return objectIdSchema.validate(id);
};
export { validateSchema, validateSchemaByField, validateId, validateObjectId };
