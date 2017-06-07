import {isNull} from 'util';
import * as _ from 'lodash';
import * as express from 'express';

import {client} from '../index';

export class FromJsonAPI {
    static init(app:express.Application) {
        app.post('/fromJSON', FromJsonAPI.setTreeJsonFromPath)
    }

    static async setTreeJsonFromPath(req:express.Request, res:express.Response):Promise<any> {
        if (req.body.path) {
            try {
                //TODO - as of now only delete previous tree. In dev!!!!!!
                res.send(await FromJsonAPI.checkIfNodeExistAndRemove(req.body.path));
            } catch (error) {
                console.log(`Error: ${error}`);
                res.status(500).send(`Error: ${error}`);
            }
        } else {
            console.log('Error: Not path was supplied');
            res.status(400).send(`Error: Not path was supplied`);
        }

    }

    private static checkIfNodeExistAndRemove(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.exists(
                path,
                async (error, stat) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (stat) {
                            resolve(await FromJsonAPI.deleteNodeWithChildren(path));
                        }
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
                        await FromJsonAPI.dissembleToChildren(path, children);
                    }
                    resolve(await FromJsonAPI.deleteNode(path));
                }
            )
        });
    }

    static dissembleToChildren(path:string, children:string[]):Promise<Object> {
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

