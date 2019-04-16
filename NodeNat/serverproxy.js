
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

        lock.acquire("a", function (done) {
            co(function* () {
                common.log("等待主");
                var mainsocket;
                try {
                    mainsocket = yield waitmain();
                    common.log("往client通信通道发起新开连接请求");
                    mainsocket.write("open connect");
                    var clientdata = yield waitclient();
                    clientdata.emiter.on("selfdata", function (data) {
                        common.log("接收到client发上来的数据 准备往用户端发送");
                        clientSocket.write(data);
                    })
                    clientdata.emiter.on("selfend", function (data) {
                        common.log("clientend");
                        clientSocket.end();
                    })
                    clientdata.emiter.on("selferror", function (data) {
                        common.log("client error");
                        clientSocket.end();
                    })
                    clientSocket.on('data', function (msg) {
                        common.log("接收到用户端发上来的数据 准备往client发送");
                        clientdata.socket.write(msg);
                    });
                    clientSocket.on('end', function () {
                        common.log('用户端end');
                        clientdata.socket.end();
                    });
                    clientSocket.on('error', function (err) {
                        console.error('用户端 error : ', err);
                        clientdata.socket.end();
                    });
                } catch (e) {
                    common.log(e);
                    clientSocket.end();
                }
                done(null);
            })
        }, function (err, ret) {
            // lock released
        });


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
        var uuid = common.uuid();
        var emiter;
        clientSocket.on('data', function (msg) {
            //
            if (msg.toString() == "main connect") {
                common.log("获取到一个新的主通道");
                currmainsocket = clientSocket;
            } else if (msg.toString() == "client connect") {
                common.log("获取到一个新的副通道");
                emiter = new events.EventEmitter();
                currclientData.push({ uuid: uuid, socket: clientSocket, emiter: emiter, useing: false })
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
                if (emiter) {
                    emiter.emit("selfdata", msg);
                }

            }
        });
        clientSocket.on('end', function () {
            if (emiter) {
                emiter.emit("selfend");
            }
            common.log('== clientSocket disconnected from server');
        });
        clientSocket.on('error', function (err) {
            if (emiter) {
                emiter.emit("selferror", err);
            }
            console.error('== clientSocket has error : ', err);
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
function* waitclient() {
    return yield new Promise(function (resolve, reject) {
        var start = new Date();
        if (currclientData.length > 0 && currclientData[currclientData.length - 1].useing == false) {
            let d = currclientData[currclientData.length - 1];
            d.useing = true;
            resolve(d);
            return;
        }
        var inter = setInterval(function () {
            if (new Date().getTime() - start.getTime() > 10 * 1000) {
                //超时 10s
                reject("timeout");
                return;
            }
            if (currclientData.length > 0 && currclientData[currclientData.length - 1].useing == false) {
                let d = currclientData[currclientData.length - 1];
                d.useing = true;
                clearInterval(inter);
                resolve(d);
                return;
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
    listentcpproxy();
    listenclientproxy();
    common.log(`监听外部client:${ServerLOCAL_PORT}`);
    common.log(`监听client:${Proxy_PORT}`);
})

//清理无效链接
setInterval(function () {
    //清理无效的client连接
    var stopConnect = [];
    currclientData.forEach(d => {
        if (!d.socket._handle) {
            stopConnect.push(d.uuid);
        }
    })
    currclientData.forEach(d => {
        for (var i = 0; i < currclientData.length; i++) {
            if (currclientData[i].uuid == d.uuid) {
                common.log("已清理掉一个请求");
                currclientData.splice(i, 1);
            }
        }
    })
}, 2000);