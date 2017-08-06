import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as zookeeper from 'node-zookeeper-client';
import {JsonAPI} from './api/index';

const zookeeperURL = process.env.ZOOKEEPER_URL ? process.env.ZOOKEEPER_URL : 'localhost:2181';
export const client = zookeeper.createClient(`${zookeeperURL}`);

client.once('connected', () => {
    console.log('Connected to ZooKeeper.');
    const APPLICATION_PORT = process.env.ZOOKEEPER_JSON_PORT ? process.env.ZOOKEEPER_JSON_PORT : 9010;
    const app:express.Application = express();
    app.use(cors());
    app.use(bodyParser.json());
    JsonAPI.init(app);
    app.listen(APPLICATION_PORT, () => {
        console.log(`App is running on port ${APPLICATION_PORT}. Have Fun!`);
    });
});

client.connect();


