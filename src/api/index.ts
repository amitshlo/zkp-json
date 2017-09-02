import * as express from 'express';
import {ToJsonAPI} from './to-json';
import {FromJsonAPI} from './from-json';
import {ToolsAPI} from './tools';

export class JsonAPI {
    static init(app:express.Application):void {
        ToJsonAPI.init(app);
        FromJsonAPI.init(app);
        ToolsAPI.init(app);
    }
}