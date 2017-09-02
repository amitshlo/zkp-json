import * as express from 'express';
import {FromJsonAPI} from './from-json';
import {ToJsonAPI} from './to-json';

export class ToolsAPI {
    static init(app:express.Application) {
        app.post('/tools/dupEnv', ToolsAPI.setTreeJsonFromPath)
    }

    private static async setTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.baseNode && req.body.targetNode) {
            try {
                let basePath = '/' + req.body.baseNode;
                let dataToDup = await ToJsonAPI.listChildren(basePath, basePath);
                let newData = {};
                newData[req.body.targetNode] = dataToDup[req.body.baseNode];
                await FromJsonAPI.createTree('/', newData, true);
                res.send('Created Successfully');
            } catch (error) {
                console.log(`Error: ${error}`);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            console.log('Error: Not path or data was supplied');
            res.status(400).send(`Error: Not path or data was supplied`);
        }

    }

}

