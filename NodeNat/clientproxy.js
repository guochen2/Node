
var net = require('net');
var common = require("./common").common;
var fs = require("fs");
const path = require("path");

var ServerProxy_HOST, ServerProxy_POST, REMOTE_PORT, REMOTE_HOST;

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
                if (option.sh && option.sp && option.rh && option.rp) {
                    initsetting({
                        ServerProxy_HOST: option.sh,
                        ServerProxy_POST: option.sp,
                        REMOTE_PORT: option.rp,
                        REMOTE_HOST: option.rh,
                    })
                    callback();
                    return;
                }
            } catch (e) {

            }
        } else if (exists) {
            var config = require("./config").config;
            initsetting({
                ServerProxy_HOST: config.Client.ServerProxy_HOST,
                ServerProxy_POST: config.Client.ServerProxy_POST,
                REMOTE_PORT: config.Client.REMOTE_PORT,
                REMOTE_HOST: config.Client.REMOTE_HOST,
            });
            callback();
            return;
        }
        var result = "配置异常，请使用config配置或者命令行参数(sh:ServerProxy_HOST,sp:ServerProxy_POST,rh:REMOTE_HOST,rp:REMOTE_PORT) sh=  sp=  rh=  rp= 默认命令行优先级比config高";
        common.log(result);
        throw new Error(result);
    })
}
function initsetting(option) {
    ServerProxy_HOST = option.ServerProxy_HOST;
    ServerProxy_POST = option.ServerProxy_POST;
    REMOTE_PORT = option.REMOTE_PORT;
    REMOTE_HOST = option.REMOTE_HOST;
}

//服务监听 
// var LOCAL_PORT = config.Client.LOCAL_PORT;
// var ServerProxy_HOST = config.Client.ServerProxy_HOST;
// var ServerProxy_POST = config.Client.ServerProxy_POST;

// //反向代理远程服务器
// var REMOTE_PORT = config.Client.REMOTE_PORT;
// //反向代理地址
// var REMOTE_HOST = config.Client.REMOTE_HOST;
//读取命令行配置 优先配置行命令

//防止线程退出
// net.createServer(function (clientSocket) {
//     common.log(" TCP main server accepting connection on port: " + LOCAL_PORT);
// }).listen(LOCAL_PORT);

var maininterval = null;
//主通道连接 向服务端发起
function firstconnect() {
    var serviceSocket = new net.Socket();
    serviceSocket.connect(ServerProxy_POST, ServerProxy_HOST, function () {
        common.log('首次链接 这个通信通道永不关闭 若关闭了 重新开一个通道  并发送代码  main connect');
        serviceSocket.write("main connect");
    });
    serviceSocket.on("data", function (data) {
        // common.log('<< From remote to proxy', data.toString());
        if (data.toString() == "open connect") {//打开新的链接
            openserverconnect();
        } else if (data.toString() == "main connecting") {
            common.log("接收到server的测试main请求");
        }
        else {
            common.log("通信通道接收到错误数据", data.toString());
        }
        // common.log('invokeTime : ', invokeTime++)
    });
    serviceSocket.on('end', function () {
        common.log('通信链接通道关闭 需要重新发起');
        firstconnect();
    });
    //服务端连接出问题，断开客户端
    serviceSocket.on('error', function (err) {
        common.log('通信链接通道关闭 需要重新发起');
        firstconnect();
    });
    if (maininterval) clearInterval(maininterval);
    setTimeout(function () {
        maininterval = setInterval(function () {
            serviceSocket.write("main connecting");
        }, 5000)
    }, 1000)
}

//新开一个与服务端通信的通道
function openserverconnect() {
    var proxySocket = new net.Socket();
    proxySocket.connect(ServerProxy_POST, ServerProxy_HOST, function () {
        common.log("客户端创建一个新通道")
        proxySocket.write("client connect");
    });
    proxySocket.on("data", function (data) {
        var clientSocket = null;
        if ((clientSocket = proxySocket.clientSocket)) {
            // common.log('<<  proxy has created ....', msg.toString());
            common.log("往客户端配置的待请求地址发送请求1")
            clientSocket.write(data);
        } else {
            openproxyconnect(proxySocket, data)
        }
    });
    proxySocket.on('end', function () {
        common.log('客户端与服务端的副请求socket end');
        if (proxySocket.clientSocket) proxySocket.clientSocket.end();
    });
    //服务端连接出问题，断开客户端
    proxySocket.on('error', function (err) {
        common.log('客户端与服务端的副请求socket err', err);
        if (proxySocket.clientSocket) proxySocket.clientSocket.end();
    });
}

//若服务端与client链接关闭 则client与目标通信也要关闭
//存储副通道与目标通道的数据


//与目标地址通信的通道
function openproxyconnect(proxySocket, data) {
    common.log("打开客户端配置的待请求地址socket")
    var clientSocket = new net.Socket();
    proxySocket.clientSocket = clientSocket;
    clientSocket.connect(REMOTE_PORT, REMOTE_HOST, function () {
        common.log("往客户端配置的待请求地址发送请求2")
        // common.log('>> From proxy to remote', msg.toString());
        clientSocket.write(data);
    });
    clientSocket.on("data", function (data) {
        common.log("往服务端发送数据去");
        // common.log('<< From remote to proxy', data.toString());
        proxySocket.write(data);
        // common.log('invokeTime : ', invokeTime++)
    });
    clientSocket.on('end', function () {
        common.log('客户端与配置的请求地址socket end');
        proxySocket.end();
    });
    //服务端连接出问题，断开客户端
    clientSocket.on('error', function (err) {
        console.error('客户端与配置的请求地址socket error ', err);
        proxySocket.end();
    });
}
init(function () {
    common.log(`配置请求端:${REMOTE_HOST}:${REMOTE_PORT}`);
    common.log(`配置服务端:${ServerProxy_HOST}:${ServerProxy_POST}`);
    //打开主通道
    firstconnect();
});//初始化