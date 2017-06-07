import {isNull} from 'util';
import * as _ from 'lodash';
import * as express from 'express';

import {client} from '../index';

export class JSONConverter {
    static init(app:express.Application) {
        app.get('/toJSON', JSONConverter.getTreeJson);
        app.post('/toJSON', JSONConverter.getTreeJsonFromPath)
    }

    static async getTreeJson(req:express.Request, res:express.Response):Promise<any> {
        try {
            res.send(await JSONConverter.listChildren('/', '/'));
        } catch (error) {
            console.log(`Error: ${error}`);
            res.status(500).send(`Error: ${error}`);
        }
    }

    static async getTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.path) {
            try {
                res.send(await JSONConverter.listChildren(req.body.path, req.body.path));
            } catch (error) {
                console.log(`Error: ${error}`);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            console.log('Error: Not path was supplied');
            res.status(400).send(`Error: Not path was supplied`);
        }

    }

    static listChildren(path:string, basePath:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getChildren(
                path,
                () => {},
                async (error:any, children:any) => {
                    if (error) {
                        reject(error);
                    }
                    if (path === basePath) {
                        resolve(JSONConverter.dissembleToChildren(basePath, children, basePath));
                    } else if (children.length > 0) {
                        resolve(JSONConverter.dissembleToChildren(path, children, basePath));
                    } else {
                        let obj:Object = {};
                        obj[path.slice(path.lastIndexOf('/') + 1, path.length)] = await JSONConverter.getData(path);
                        resolve(obj);
                    }
                }
            )
        });
    }

    static dissembleToChildren(path:string, children:string[], basePath:string):Promise<Object> {
        return new Promise(async (resolve:any, reject:any) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(JSONConverter.listChildren(((path === '/' ? '' : path) + '/' + child), basePath));
            }
            let nodeData = await JSONConverter.getData(path);
            let data = await Promise.all(proArr);
            let obj:Object = {};
            let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
            obj[spot] = isNull(nodeData) ? {} : {_data: nodeData};
            for (let child of data) {
                obj[spot] = _.merge({}, obj[spot], child);
            }
            resolve(obj);
        });
    }

    static getData(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getData(
                path,
                () => {},
                (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    let obj:Object = {};
                    let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
                    obj[spot] = JSONConverter.isJSON(data.toString()) ? JSON.parse(data.toString()) : data.toString();
                    resolve(obj[spot] !== '' ? obj[spot] : null);
                }
            )
        });
    }

    static isJSON(str:string):boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}

