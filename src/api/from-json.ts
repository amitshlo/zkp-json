import * as express from 'express';
import winston = require('winston');

import {client} from '../index';

export class FromJsonAPI {
    static init(app:express.Application) {
        app.post('/fromJSON', FromJsonAPI.setTreeJsonFromPath)
    }

    private static async setTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.path && req.body.data) {
            try {
                winston.info(`Got 'fromJSON' request from ${req.ip} with path: '${req.body.path}'.`);
                await FromJsonAPI.createTree(req.body.path, req.body.data, true);
                winston.info(`Successfully executed 'fromJSON' request from ${req.ip} with path: '${req.body.path}'.`);
                res.send('Created Successfully');
            } catch (error) {
                winston.error(`Got error trying to handle 'fromJSON' request from ${req.ip} with path: '${req.body.path}'. Error: ${error.message}.`, error);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            winston.error(`Got error trying to handle 'fromJSON' request from ${req.ip}. Error: No path was supplied`);
            res.status(400).send(`Error: Not path or data was supplied`);
        }

    }

    static createTree(path:string, data:any, isBase:boolean):Promise<any> {
        return new Promise(async (resolve:any, reject:any) => {
            let proArr:Promise<any>[] = [];
            for (let property in data) {
                if (data.hasOwnProperty(property)) {
                    if (isBase) {
                        await FromJsonAPI.checkIfNodeExistAndRemove(`${path === '/' ? '' : path}/${property}`);
                    }
                    if (property !== '_data') {
                        proArr.push(FromJsonAPI.createNode(`${path === '/' ? '' : path}/${property}`, data[property]));
                    }
                }
            }
            try {
                resolve(await Promise.all(proArr));
            } catch (error) {
                reject(`Error: ${error}`);
            }
        });
    }

    private static createNode(path:string, data:any):Promise<any> {
        return new Promise((resolve:any, reject:any) => {
            client.create(
                path,
                new Buffer(''),
                async (error, path) => {
                    try {
                        if (error) {
                            reject(error);
                        }
                        if (data['_data'] || typeof data === 'string' || typeof data === 'number'
                            || Array.isArray(data) || (typeof data === 'object' && data.nodeData)
                            || data === false || data === true) {
                            await FromJsonAPI.setDataInNode(path, data['_data'] ? data['_data'] : data);
                        }
                        if (typeof data === 'object' && !Array.isArray(data) && !data.nodeData) {
                            await FromJsonAPI.createTree(path, data, false);
                        }
                        resolve(true);

                    } catch (error) {
                        reject(`Error: ${error}`);
                    }
                }
            )
        });
    }

    private static setDataInNode(path:string, data:any):Promise<any> {
        return new Promise((resolve:any, reject:any) => {
            client.setData(
                path,
                new Buffer(typeof data === 'string' ? data : JSON.stringify(data)),
                (error, stat) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(stat);
                }
            )
        });
    }

    private static checkIfNodeExistAndRemove(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.exists(
                path,
                async (error, stat) => {
                    if (error) {
                        reject(error);
                    } else if (stat) {
                        resolve(await FromJsonAPI.deleteNodeWithChildren(path));
                    } else {
                        resolve(true);
                    }
                }
            )
        });
    }

    private static deleteNodeWithChildren(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getChildren(
                path,
                () => {},
                async (error:any, children:any) => {
                    if (error) {
                        reject(error);
                    }
                    if (children.length !== 0) {
                        await FromJsonAPI.dissembleDeletedNodeToChildren(path, children);
                    }
                    resolve(await FromJsonAPI.deleteNode(path));
                }
            )
        });
    }

    static dissembleDeletedNodeToChildren(path:string, children:string[]):Promise<Object> {
        return new Promise(async (resolve:any, reject:any) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(FromJsonAPI.deleteNodeWithChildren(`${path}/${child}`));
            }
            resolve(await Promise.all(proArr));
        });
    }

    private static async deleteNode(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.remove(
                path,
                (error) => error ? reject(error) : resolve(true)
            )
        });
    }
}

