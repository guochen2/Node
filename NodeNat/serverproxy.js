
var net = require('net');
var co = require("co");
var AsyncLock = require('async-lock');
var lock = new AsyncLock();
var fs = require("fs");
const path = require("path");
//服务监听
var ServerLOCAL_PORT, Proxy_PORT;
var common = require("./common").common;

//主要是在监听到client端打开的链接时用
const events = require('events');
const emiter = new events.EventEmitter();

//初始化配置 默认命令行优先级比config高
function init(callback) {
    fs.exists(path.join(__dirname, "config.js"), function (exists) {
        if (process.argv.length > 2) {
            //命令行参数 sh:ServerProxy_HOST,sp:ServerProxy_POST,rh:REMOTE_HOST,rp:REMOTE_PORT
            try {
                var option = {};
                for (var i = 2; i < process.argv.length; i++) {
                    option[process.argv[i].split("=")[0]] = process.argv[i].split("=")[1];
                }
                if (option.sp && option.pp) {
                    initsetting({
                        ServerLOCAL_PORT: option.sp,
                        Proxy_PORT: option.pp,
                    })
                    callback();
                    return;
                }
            } catch (e) {

            }
        } else if (exists) {
            var config = require("./config").config;
            initsetting({
                ServerLOCAL_PORT: config.Server.ServerLOCAL_PORT,
                Proxy_PORT: config.Server.Proxy_PORT,
            });
            callback();
            return;
        }
        var result = "配置异常，请使用config配置或者命令行参数(sp:ServerLOCAL_PORT,pp:Proxy_PORT) sp=  pp=  默认命令行优先级比config高";
        common.log(result);
        throw new Error(result);
    })
}
//设置配置
function initsetting(option) {
    ServerLOCAL_PORT = option.ServerLOCAL_PORT;
    Proxy_PORT = option.Proxy_PORT;
}

function listentcpproxy() {
    //接收调用方的请求
    var tcpProxyServer = net.createServer(function (clientSocket) {

        // lock.acquire("a", function (done) {
        // co(function* () {
        if (!currmainsocket) {
            clientSocket.write("not exist client proxy");
            clientSocket.end();
            return;
        }
        // common.log("等待主");
        // var mainsocket;
        try {
            // mainsocket = yield waitmain();
            common.log("往client通信通道发起新开连接请求");
            var uuid = common.uuid();
            let selfdata = function (data) {
                common.log("接收到client发上来的数据 准备往用户端发送");
                clientSocket.write(data);
            };
            let selfend = function (data) {
                common.log("clientend", uuid);
                clientSocket.end();
                emiter.off("selfend_" + uuid, selfend);
                emiter.off("selfdata_" + uuid, selfdata);
            };
            let selferror = function (data) {
                common.log("client error", uuid);
                clientSocket.end();
                emiter.off("selferror_" + uuid, selferror);
            };
            emiter.on("selfdata_" + uuid, selfdata).on("selfend_" + uuid, selfend).on("selferror_" + uuid, selferror);
            // emiter.on("selfend_" + uuid, function (data) {
            //     common.log("clientend");
            //     clientSocket.end();
            //     emiter.off("selfend_" + uuid);
            //     emiter.off("selfdata_" + uuid);
            // })
            // emiter.on("selferror_" + uuid, function (data) {
            //     common.log("client error");
            //     clientSocket.end();
            //     emiter.off("selferror_" + uuid);

            // })
            emiter.once("socket_" + uuid, function (socket) {
                // let clientdata = yield waitclient(uuid);
                clientSocket.on('data', function (msg) {
                    common.log("接收到用户端发上来的数据 准备往client发送");
                    socket.write(msg);
                });
                clientSocket.on('end', function () {
                    common.log('用户端end');
                    socket.end();
                });
                clientSocket.on('error', function (err) {
                    console.error('用户端 error : ', err);
                    socket.end();
                });
            })
            currmainsocket.write("openconnect_" + uuid);

        } catch (e) {
            common.log(e);
            clientSocket.end();
        }
        // done(null);
        // })
        // }, function (err, ret) {
        //     // lock released
        // });


    });
    tcpProxyServer.on('error', function (error) {
        console.error('== startListenRequest has error : ', error);
    });

    //创建反向代理服务
    tcpProxyServer.listen(ServerLOCAL_PORT, function () {
        var addr = tcpProxyServer.address();
        common.log(`用户端 ${addr.address}:${addr.port} listing`);
    });

}

function listenclientproxy() {
    //接收主动发来的客户端的请求 nodeclient端
    var clientProxyServer = net.createServer(function (clientSocket) {
        // var uuid = common.uuid();
        // var emiter;
        var uuid;
        clientSocket.on('data', function (msg) {
            //
            if (msg.toString() == "main connect") {
                common.log("获取到一个新的主通道");
                currmainsocket = clientSocket;
            } else if (msg.toString().indexOf("clientconnect_") == 0 && common.regexuuid(msg.toString())) {
                uuid = common.getuuidbyregex(msg.toString());
                common.log("获取到一个新的副通道", uuid);
                // emiter = new events.EventEmitter();
                // currclientData.push({ uuid: uuid, socket: clientSocket, useing: false })
                emiter.emit("socket_" + uuid, clientSocket);
            } else if (msg.toString() == "main connecting") {
                common.log("接收到client的测试main请求");
                if (currmainsocket) {
                    // common.log("main存在");
                } else {
                    common.log("main 不存在 将当前socket赋值");
                    currmainsocket = clientSocket;
                }
            } else {
                // var clients = currclientData.filter(a => a.uuid = uuid);
                // if (clients.length > 0)
                //     clients[0].emiter.emit("selfdata", msg);
                if (uuid) {
                    emiter.emit("selfdata_" + uuid, msg);
                }

            }
        });
        clientSocket.on('end', function () {
            if (uuid) {
                emiter.emit("selfend_" + uuid);
                common.log('== clientSocket disconnected from server');
            } else {
                common.log('main == clientSocket disconnected from server');
                currmainsocket = undefined;
            }
        });
        clientSocket.on('error', function (err) {
            if (uuid) {
                emiter.emit("selferror_" + uuid, err);
                console.error('== clientSocket has error : ', err);
            } else {
                console.error('main == clientSocket has error : ', err);
                currmainsocket = undefined;
            }
        });
    });
    clientProxyServer.on('error', function (error) {
        console.error('== startListenRequest has error : ', error);
    });

    //创建反向代理服务
    clientProxyServer.listen(Proxy_PORT, function () {
        var addr = clientProxyServer.address();
        common.log(`client端 ${addr.address}:${addr.port} listing`);
    });
}

var currclientData = [];//{ socket: null, emiter: null, useing: false }
var currmainsocket;//和客户端通信的唯一通道

//等待子连接
function* waitclient(uuid) {
    return yield new Promise(function (resolve, reject) {
        var start = new Date();
        if (currclientData.length > 0) {
            // let d = currclientData[currclientData.length - 1];
            // d.useing = true;
            var d = currclientData.filter(a => a.uuid == uuid);
            if (d.length > 0) {
                resolve(d[0]);
                return;
            }
        }
        var inter = setInterval(function () {
            if (new Date().getTime() - start.getTime() > 10 * 1000) {
                //超时 10s
                reject("timeout");
                return;
            }
            if (currclientData.length > 0) {
                var d = currclientData.filter(a => a.uuid == uuid);
                if (d.length > 0) {
                    clearInterval(inter);
                    resolve(d[0]);
                    return;
                }
            }
        }, 10)
    })
}

//等待主连接
function* waitmain() {
    var start = new Date();
    return yield new Promise(function (resolve, reject) {
        if (currmainsocket) {
            resolve(currmainsocket);
            return;
        }
        var inter = setInterval(function () {
            if (new Date().getTime() - start.getTime() > 10 * 1000) {
                //超时 10s
                reject("timeout");
                return;
            }
            if (currmainsocket) {
                clearInterval(inter);
                resolve(currmainsocket);
            }
        }, 10)
    })
}


init(function () {
    //监听异常
    emiter.setMaxListeners(10000);//可以同时监听10000个
    emiter.on("error", a => {
        console.log("emiter异常".a);
    });
    listentcpproxy();
    listenclientproxy();
    common.log(`监听外部client:${ServerLOCAL_PORT}`);
    common.log(`监听client:${Proxy_PORT}`);
})

// 清理无效链接
// setInterval(function () {
//     //清理无效的client连接
//     // var stopConnect = [];
//     // currclientData.forEach(d => {
//     //     if (!d.socket._handle) {
//     //         stopConnect.push(d.uuid);
//     //     }
//     // })
//     // currclientData.forEach(d => {
//     //     for (var i = 0; i < currclientData.length; i++) {
//     //         if (currclientData[i].uuid == d.uuid) {
//     //             common.log("已清理掉一个请求");
//     //             currclientData.splice(i, 1);
//     //         }
//     //     }
//     // })
//     // console.log(`当前总共${emiter.listenerCount()}`);
// }, 2000);
setInterval(function () {
    if (currmainsocket) {
        currmainsocket.write("main connecting")
    }
}, 5000)