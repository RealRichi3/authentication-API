import dotenv from 'dotenv';
import { NodeENV } from './types';
import winston from 'winston/lib/winston/config';

/**
 * Set env config based on current node environment
 * i.e
 * if NODE_ENV = 'dev' use .env.dev file
 * if NODE_ENV = 'prod' use .env.prod
 * if NODE_ENV = 'test' use .env.prod
 */
const NODE_ENV = process.env.NODE_ENV as NodeENV;

const path = NODE_ENV ? `${__dirname}/.env.${NODE_ENV}` : `${__dirname}/.env`;
dotenv.config({ path });

import { connectToDatabase } from './database';
import { startExpressServer } from './app';

async function startServer() {
    try {
        await connectToDatabase();

        startExpressServer();
    } catch (error) {
        console.log(error);
    }
}

startServer();
