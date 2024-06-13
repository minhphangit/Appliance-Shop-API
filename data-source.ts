require('dotenv').config();
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  // type: 'mssql',
  type: 'mariadb',
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT),
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  // port: 1433,
  // username: 'minh5520_SQLLogin_1',
  // database: 'ShopGiaDung',
  entities: ['entities/**/*.entity{.ts,.js}', 'entities/**/*.schema{.ts,.js}'],
  synchronize: true,
  logging: false,
  // options: {
  //   encrypt: false,
  // },
});
