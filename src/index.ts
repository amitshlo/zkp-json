import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import {JSONConverter} from './json-converter';

const zookeeper = require('node-zookeeper-client');

export const client = zookeeper.createClient('localhost:2181');

client.once('connected', () => {
    console.log('Connected to ZooKeeper.');
    const APPLICATION_PORT = 4000;
    const app = express();
    app.use(cors());
    app.use(bodyParser.json())
    JSONConverter.init(app);
    app.listen(APPLICATION_PORT, () => {
        console.log(`App is running on port ${APPLICATION_PORT}. Have Fun!`);
    });
});

client.connect();


