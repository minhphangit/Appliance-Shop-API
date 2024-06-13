import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import path from 'path';
import { AppDataSource } from './data-source';
import indexRouter from './routes/routes';
import adminRoutes from './routes/admin/routes';
import userRouter from './routes/user/routes';
import { articleRouter } from './routes/article/routes';
import { ChatRouter } from './routes/chat';
import mongoose from 'mongoose';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';

const file = fs.readFileSync(path.resolve('./openapi.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);

//MongoDB connection with initial retry
const mongooseConnection = 'mongodb://' + process.env.MONGODB_URL;
mongoose.connection.on('connected', () => console.log('Connected to ' + mongooseConnection));
mongoose.connection.on('disconnected', () => console.log('MongoDB lost connection'));
mongoose.connection.on('error', (error) => console.error('Error in MongoDb connection: ' + error));
const MongoDBConnect = () => {
  mongoose
    .connect(mongooseConnection, {
      user: process.env.MONGODB_USER,
      pass: process.env.MONGODB_PASS,
      serverSelectionTimeoutMS: 5000,
    })
    .catch((err) => {
      console.log('MongoDB connection unsuccessful, retry after 5 seconds.');
      setTimeout(MongoDBConnect, 5000);
    });
};
MongoDBConnect();

const app: Express = express();

AppDataSource.initialize().then(async () => {
  console.log('Data source was initialized');

  app.use(logger('dev'));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // use session
  app.use(
    session({
      secret: process.env.SECRET || 'secret',
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    }),
  );

  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/', indexRouter);
  app.use('/admin', adminRoutes);
  app.use('/user', userRouter);
  app.use('/article', articleRouter);
  app.use('/chat', ChatRouter);

  // catch 404 and forward to error handler
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.status(404).send('Not found');
    // next(createError(404));
  });

  // error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err,
    });
  });
});

export default app;
