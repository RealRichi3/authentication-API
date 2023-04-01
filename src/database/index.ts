import Mongoose from 'mongoose';
import { NodeENV } from '../types';
import * as config from '../config';

function getDBConnectionString(env: NodeENV): string {
    switch (env) {
        case 'test':
            return config.MONGO_URI_TEST;
        case 'dev':
            return config.MONGO_URI_DEV;
        case 'prod':
            return config.MONGO_URI_PROD;
        default:
            return '';
    }
}

export async function connectToDatabase() {
    const mongo_url: string = getDBConnectionString(config.NODE_ENV);

    Mongoose.set('strictQuery', false);
    await Mongoose.connect(mongo_url);

    console.log(`Connection to ${Mongoose.connection.name} database successful`);
}
