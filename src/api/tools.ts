import * as express from 'express';
import {FromJsonAPI} from './from-json';
import {ToJsonAPI} from './to-json';
import winston = require('winston');
import {CommonFunctions} from './common';

export class ToolsAPI {
    static init(app:express.Application) {
        app.post('/tools/dupEnv', ToolsAPI.setTreeJsonFromPath);
        app.post('/tools/delete', ToolsAPI.deleteTree);
    }

    private static async setTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.baseNode && req.body.targetNode) {
            try {
                winston.info(`Got duplicate env request from ${req.ip} from path: '${req.body.baseNode}' to path: '${req.body.targetNode}'.`);
                let basePath = '/' + req.body.baseNode;
                let dataToDup = await ToJsonAPI.listChildren(basePath, basePath);
                let newData = {};
                newData[req.body.targetNode] = dataToDup[req.body.baseNode];
                await FromJsonAPI.createTree('/', newData, true);
                winston.info(`Successfully executed duplicate env request from ${req.ip} from path: '${req.body.baseNode}' to path: '${req.body.targetNode}'.`);
                res.send('Created Successfully');
            } catch (error) {
                winston.error(`Got error trying to handle duplicate env request from ${req.ip} with path: '${req.body.path}'. Error: ${error.message}.`, error);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            winston.error(`Got error trying to handle duplicate env request from ${req.ip}. Error: No path was supplied`);
            res.status(400).send(`Error: Not path or data was supplied`);
        }
    }

    private static async deleteTree(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.path) {
            try {
                winston.info(`Got 'delete' request from ${req.ip} with path: '${req.body.path}'.`);
                await CommonFunctions.checkIfNodeExistAndRemove(req.body.path === '/' ? '' : req.body.path);
                winston.info(`Successfully executed 'delete' request from ${req.ip} with path: '${req.body.path}'.`);
                res.send('Deleted Successfully');
            } catch (error) {
                winston.error(`Got error trying to handle 'delete' request from ${req.ip} with path: '${req.body.path}'. Error: ${error.message}.`, error);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            winston.error(`Got error trying to handle 'delete' request from ${req.ip}. Error: No path was supplied`);
            res.status(400).send(`Error: No path was supplied`);
        }
    }

}

