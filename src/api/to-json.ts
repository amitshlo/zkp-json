import {isNull} from 'util';
import * as _ from 'lodash';
import * as express from 'express';
import winston = require('winston');
let parse = require('parse-types');

import {client} from '../index';

//TODO - refactor!!!!
export class ToJsonAPI {
    static init(app:express.Application) {
        app.get('/toJSON', ToJsonAPI.getTreeJson);
        app.post('/toJSON', ToJsonAPI.getTreeJsonFromPath)
    }

    private static async getTreeJson(req:express.Request, res:express.Response):Promise<any> {
        try {
            winston.info(`Got 'toJSON' request from ${req.ip} with path: '/'.`);
            res.send(await ToJsonAPI.listChildren('/', '/'));
        } catch (error) {
            winston.error(`Got error trying to handle 'toJSON' request from ${req.ip} with path: '/'. Error: ${error.message}.`, error);
            res.status(500).send(`Error: ${error}`);
        }
    }

    private static async getTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.path) {
            try {
                winston.info(`Got 'toJSON' request from ${req.ip} with path: '${req.body.path}'.`);
                res.send(await ToJsonAPI.listChildren(req.body.path, req.body.path));
            } catch (error) {
                winston.error(`Got error trying to handle 'toJSON' request from ${req.ip} with path: '${req.body.path}'. Error: ${error.message}.`, error);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            winston.error(`Got error trying to handle 'toJSON' request from ${req.ip}. Error: No path was supplied`);
            res.status(400).send(`Error: No path was supplied`);
        }

    }

    static listChildren(path:string, basePath:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getChildren(
                path,
                async (error:any, children:any) => {
                    if (error) {
                        reject(error);
                    }
                    if (path === basePath) {
                        resolve(ToJsonAPI.dissembleToChildren(basePath, children, basePath));
                    } else if (children.length > 0) {
                        resolve(ToJsonAPI.dissembleToChildren(path, children, basePath));
                    } else {
                        let obj:Object = {};
                        obj[path.slice(path.lastIndexOf('/') + 1, path.length)] = await ToJsonAPI.getData(path);
                        resolve(obj);
                    }
                }
            )
        });
    }

    private static dissembleToChildren(path:string, children:string[], basePath:string):Promise<Object> {
        return new Promise(async (resolve:any, reject:any) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(ToJsonAPI.listChildren(((path === '/' ? '' : path) + '/' + child), basePath));
            }
            let nodeData = await ToJsonAPI.getData(path);
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

    private static getData(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getData(
                path,
                (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    let obj:Object = {};
                    let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
                    obj[spot] = ToJsonAPI.parseNodeData(data.toString());
                    resolve(obj[spot] !== '' ? obj[spot] : null);
                }
            )
        });
    }

    private static parseNodeData(data:string):any {
        //TODO - can parse library be used for all of this?
        let isNumber = /^\d+$/.test(data);
        let isJson = ToJsonAPI.isJSON(data);
        let isArray = data.charAt(0) === '[' && data.charAt(data.length-1) === ']';
        let isBoolean = data === 'true' || data === 'false';
        if (isJson && !isNumber && !isArray && !isBoolean) {
            return Object.assign({}, JSON.parse(data.toString()), {nodeData: true});
        } else if (isNumber) {
            return parseInt(data);
        } else if (isArray) {
            return parse(data);
        } else if (isBoolean) {
            return data === 'true';
        } else {
            return data.toString();
        }
    }

    private static isJSON(str:string):boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}

