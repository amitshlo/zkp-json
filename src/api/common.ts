import {client} from '../index';

export class CommonFunctions {
    static checkIfNodeExistAndRemove(path:string):Promise<Object> {
        return new Promise((resolve:any, reject:any) => {
            client.exists(
                path,
                async (error, stat) => {
                    if (error) {
                        reject(error);
                    } else if (stat) {
                        resolve(await CommonFunctions.deleteNodeWithChildren(path));
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
                        await CommonFunctions.dissembleDeletedNodeToChildren(path, children);
                    }
                    resolve(await CommonFunctions.deleteNode(path));
                }
            )
        });
    }

    private static dissembleDeletedNodeToChildren(path:string, children:string[]):Promise<Object> {
        return new Promise(async (resolve:any, reject:any) => {
            let proArr = [];
            for (let child of children) {
                proArr.push(CommonFunctions.deleteNodeWithChildren(`${path}/${child}`));
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