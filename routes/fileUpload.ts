import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { uploadMultiple, uploadSingle } from '../utils/upload';
import multer from 'multer';
import fs from 'fs';
import { toSafeFileName } from '../utils/toSafeFileName';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/product.entity';

export const fileUpload = async (id: any, req: Request, res: Response, data: Model<any, any, any, any, any, any>) => {
  try {
    let found = await data.findById(id);
    if (!found) {
      return res.status(404).json({ message: `Couldn't find that ${data.modelName} id` });
    }
    req.params.collectionName = data.modelName;
    uploadSingle(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(500).json({ type: 'MulterError', message: error.message });
      } else if (error) {
        return res.status(500).json({ type: 'UnknownError', message: error.message });
      } else {
        const UPLOAD_DIR = process.env.UPLOAD_DIR;
        const PUBLIC_DIR = process.env.PUBLIC_DIR;
        if (found.imageUrl)
          fs.unlink(`${PUBLIC_DIR}/${found.imageUrl}`, (err) => {
            console.log(err);
          });
        const patchData = {
          imageUrl: `/${UPLOAD_DIR}/${data.modelName}/${id}/${req.body.file.name}`,
        };

        found.imageUrl = patchData.imageUrl;
        found.save();
        return found;
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Database Error' });
  }
};

export const filesUpload = async (id: any, req: Request, res: Response, data: Model<any, any, any, any, any, any>) => {
  try {
    let found = await data.findById(id);
    if (!found) {
      return res.status(404).json({ message: `Couldn't find that ${data.modelName} id` });
    }
    req.params.collectionName = data.modelName;
    uploadMultiple(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        res.status(500).json({ type: 'MulterError', message: error.message });
      } else if (error) {
        res.status(500).json({ type: 'UnknownError', message: error.message });
      } else {
        const UPLOAD_DIR = process.env.UPLOAD_DIR;
        const PUBLIC_DIR = process.env.PUBLIC_DIR;
        const patchData: string[] = [];
        found.imagesUrl.forEach((e: string) => {
          fs.unlink(`${PUBLIC_DIR}/${e}`, (err) => {
            console.log(err);
          });
          patchData.push(`/${UPLOAD_DIR}/${data.modelName}/${id}/${toSafeFileName(req.body.file.filename)}`);
        });
        found.imageUrl = patchData;
        found.save();
        return found;
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Database Error' });
  }
};

//----------------------------------------------
//Upaload for product
//----------------------------------------------

const repository = AppDataSource.getRepository(Product);

export const fileUploadProduct = async (id: any, req: Request, res: Response) => {
  try {
    const found = await repository.findOne({ where: { id: id } });
    if (!found) {
      return res.status(404).json({ message: `Couldn't find that record with id ${id}` });
    }

    // Tiếp tục với mã logic của bạn cho việc xử lý upload file và cập nhật đường dẫn trong cơ sở dữ liệu
    uploadSingle(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        res.status(500).json({ type: 'MulterError', message: error.message });
      } else if (error) {
        res.status(500).json({ type: 'UnknownError', message: error.message });
      } else {
        const UPLOAD_DIR = process.env.UPLOAD_DIR;
        const PUBLIC_DIR = process.env.PUBLIC_DIR;
        if (found.coverImageUrl) {
          fs.unlink(`${PUBLIC_DIR}/${found.coverImageUrl}`, (err) => {
            console.log(err);
          });
        }
        const filename = req.body.file.filename;
        const imageUrl = `/${UPLOAD_DIR}/product/CoverImg/${found.id}/${filename}`;
        found.coverImageUrl = imageUrl;
        await repository.save(found);
        return res.status(200).json(found);
      }
    });
  } catch (error) {
    return console.log(error);
  }
};

export const filesUploadProduct = async (id: any, req: Request, res: Response) => {
  try {
    const found = await repository.findOne({ where: { id: id } });
    if (!found) {
      return res.status(404).json({ message: `Couldn't find that record with id ${id}` });
    }

    // Tiếp tục với mã logic của bạn cho việc xử lý upload nhiều file và cập nhật đường dẫn trong cơ sở dữ liệu
    // uploadMultiple(req, res, async (error) => {
    //   if (error instanceof multer.MulterError) {
    //     res.status(500).json({ type: 'MulterError', message: error.message });
    //   } else if (error) {
    //     res.status(500).json({ type: 'UnknownError', message: error.message });
    //   } else {
    //     const UPLOAD_DIR = process.env.UPLOAD_DIR;
    //     const PUBLIC_DIR = process.env.PUBLIC_DIR;
    //     const patchData: string[] = [];
    //     found.imageUrls.forEach((e: string) => {
    //       fs.unlink(`${PUBLIC_DIR}/${e}`, (err) => {
    //         console.log(err);
    //       });
    //       patchData.push(`/${UPLOAD_DIR}/product/ImagesUrl/${found.id}/${toSafeFileName(req.body.file.filename)}`);
    //     });
    //     found.imageUrls = patchData;
    //     await repository.save(found);
    //     return res.status(200).json(found);
    //   }
    // });
  } catch (error) {
    return res.status(500).json({ message: 'Database Error' });
  }
};
