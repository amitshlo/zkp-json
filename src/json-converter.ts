import {isNull} from 'util';
import * as _ from 'lodash';
import * as express from 'express';
const zookeeper = require('node-zookeeper-client');

import {client} from './index';

export class JSONConverter {
    static init(app:express.Application) {
        app.get('/toJSON', JSONConverter.getTreeJson);
        app.post('/toJSON', JSONConverter.getTreeJsonFromPath)
    }

    static getTreeJson(req:express.Request, res:express.Response):void {
        JSONConverter.listChildren('/', '/')
            .then((data) => {
                    res.send(JSON.stringify(data));
                }
            ).catch((error) => {
                    console.log(error);
                }
        );
    }

    static getTreeJsonFromPath(req:express.Request, res:express.Response):void {
        if (req.body.path) {
            JSONConverter.listChildren(req.body.path, req.body.path)
                .then((data:Object) => {
                        res.send(JSON.stringify(data));
                    }
                );
        } else {
            console.log('Not path was supplied');
        }

    }

    static listChildren(path:string, basePath:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.getChildren(
                path,
                () => {},
                (error:any, children:any) => {
                    if (error) {
                        reject(error);
                    }
                    if (path === basePath) {
                        resolve(JSONConverter.dissembleToChildren(basePath, children, basePath));
                    } else if (children.length > 0) {
                        resolve(JSONConverter.dissembleToChildren(path, children, basePath));
                    } else {
                        JSONConverter.getData(path).then((data:Object) => {
                            let obj:Object = {};
                            obj[path.slice(path.lastIndexOf('/') + 1, path.length)] = data;
                            resolve(obj);
                        });
                    }
                }
            )
        });
    }

    static dissembleToChildren(path:string, children:string[], basePath:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(JSONConverter.listChildren(((path === '/' ? '' : path) + '/' + child), basePath));
            }
            JSONConverter.getData(path).then((nodeData) => {
                Promise.all(proArr).then((data:Object[]) => {
                    let obj:Object = {};
                    let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
                    obj[spot] = isNull(nodeData) ? {} : {_data: nodeData};
                    for (let child of data) {
                        obj[spot] = _.merge({}, obj[spot], child);
                    }
                    resolve(obj);
                });
            });
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

