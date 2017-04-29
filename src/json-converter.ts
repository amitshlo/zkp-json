import {isNull} from 'util';
import {merge} from 'lodash';
const zookeeper = require('node-zookeeper-client');

import {client} from './index';

export class JSONConverter {
    static init(app) {
        app.get('/toJSON', JSONConverter.getTreeJson);
        app.post('/toJSON', JSONConverter.getTreeJsonFromPath)
    }

    static getTreeJson(req, res) {
        JSONConverter.listChildren('/', '/')
            .then((data) => {
                    res.send(JSON.stringify(data));
                }
            ).catch((error) => {
                    res.error(error);
                }
        );
    }

    static getTreeJsonFromPath(req, res) {
        if (req.body.path) {
            JSONConverter.listChildren(req.body.path, req.body.path)
                .then((data) => {
                        res.send(JSON.stringify(data));
                    }
                );
        } else {
            res.error('Not path was supplied');
        }

    }

    static listChildren(path, basePath):any {
        return new Promise((resolve, reject) => {
            client.getChildren(
                path,
                () => {},
                (error, children) => {
                    if (error) {
                        reject(error);
                    }
                    if (path === basePath) {
                        resolve(JSONConverter.dissembleToChildren(basePath, children, basePath));
                    } else if (children.length > 0) {
                        resolve(JSONConverter.dissembleToChildren(path, children, basePath));
                    } else {
                        JSONConverter.getData(path).then((data) => {
                            let obj = {};
                            obj[path.slice(path.lastIndexOf('/') + 1, path.length)] = data;
                            resolve(obj);
                        });
                    }
                }
            )
        });
    }

    static dissembleToChildren(path, children, basePath) {
        return new Promise((resolve, reject) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(JSONConverter.listChildren(((path === '/' ? '' : path) + '/' + child), basePath));
            }
            JSONConverter.getData(path).then((nodeData) => {
                Promise.all(proArr).then((data) => {
                    let obj = {};
                    let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
                    obj[spot] = isNull(nodeData) ? {} : {_data: nodeData};
                    for (let child of data) {
                        obj[spot] = merge({}, obj[spot], child);
                    }
                    resolve(obj);
                });
            });
        });
    }

    static getData(path) {
        return new Promise((resolve, reject) => {
            client.getData(
                path,
                () => {},
                (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    let obj = {};
                    let spot = path.slice(path.lastIndexOf('/') + 1, path.length);
                    obj[spot] = JSONConverter.isJSON(data.toString()) ? JSON.parse(data.toString()) : data.toString();
                    resolve(obj[spot] !== '' ? obj[spot] : null);
                }
            )
        });
    }

    static isJSON(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}

