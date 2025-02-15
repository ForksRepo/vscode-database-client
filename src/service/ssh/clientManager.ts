import * as vscode from 'vscode';
import { Client, SFTPWrapper } from "ssh2";
import { existsSync, readFileSync } from 'fs';
import { SSHConfig } from '@/model/interface/sshConfig';

class SSH {
    client: Client;
    sftp: SFTPWrapper;
}

export class ClientManager {

    private static activeClient: { [key: string]: SSH } = {};

    public static getSSH(sshConfig: SSHConfig,withSftp:boolean=true): Promise<SSH> {

        const key = `${sshConfig.host}_${sshConfig.port}_${sshConfig.username}`;
        if (this.activeClient[key]) {
            return Promise.resolve(this.activeClient[key]);
        }
        if (sshConfig.privateKeyPath) {
            sshConfig.privateKey = readFileSync(sshConfig.privateKeyPath)
        }

        const client = new Client();
        return new Promise((resolve, reject) => {
            client.on('ready', () => {
                if(withSftp){
                    client.sftp((err, sftp) => {
                        if (err) throw err;
                        this.activeClient[key] = { client, sftp };
                        resolve(this.activeClient[key])
                    })
                }else{
                    resolve({ client, sftp:null })
                }
                
            }).on('error', (err) => {
                vscode.window.showErrorMessage(err.message)
                reject(err)
            }).on('end', () => {
                this.activeClient[key] = null
            }).connect({ ...sshConfig, readyTimeout: 1000 * 10 });
            // https://blog.csdn.net/a351945755/article/details/22661411
        })

    }

}