"use strict";
var net = require("net");
var fs = require("fs"); 
//获取配置文件
var serverconfig = require("./config").serverconfig;
var mongodbhandler = require("mongodbhandler").mongodbhandler;
var emitter = new (require('events')).EventEmitter();
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
//是否启用websocket监听
var socketserver={enable:false};
if(serverconfig.socketserver&&serverconfig.socketserver.enable){   
    socketserver.server=require('./socketserver');
    socketserver.enable=true;
}
var server = net.Server(function (socket) {
    /* 获取远程IP */
    var remoteAddress = socket.remoteAddress;
    var addsplit = remoteAddress.split(":");
    if (addsplit && addsplit.length > 0) {
        remoteAddress = addsplit[addsplit.length - 1];
    }
    socket.on("data", function (d) {        
        var clientData = d.toString("utf-8").trim(); 
        var clientDataArr = clientData.match(/(\{.+?\})(?={|$)/g); 
        var errDatar = clientData.replace(/(\{.+?\})(?={|$)/g,"");
        console.log(clientData);
        try{
                if(clientDataArr && clientDataArr.length>0){
                for(var i = 0;i<clientDataArr.length;i++){
                    if (clientDataArr[i]) {
                        var dataJson = JSON.parse(clientDataArr[i]);console.log(dataJson);
                    // console.log(dataJson);
                        try { 
                            if (dataJson) {
                                var databasepath = serverconfig.logpath + "\\" + dataJson.dbname + "\\" + dataJson.tablename;
                                LogHandler("log", databasepath, dataJson, remoteAddress);
                                 if(socketserver.enable){        //进行websocket消息推送
                                   emitter.emit("addlog",{data:dataJson,address:remoteAddress});
                                }
                            }
                        } catch (e) {  
                            /*写入错误日志,此日志不写入数据库，写入errorlog文件夹目录下*/
                            // var databasepath = serverconfig.errorpath + "\\" + dataJson.dbname + "\\" + dataJson.tablename;
                            LogHandler("nodeerror", serverconfig.errorpath , {data:{ex:e,Data:clientData}}, remoteAddress);
                        }
                    }
                }
            } 
        }       
        catch(e){
            errDatar=e;
        }
        if(errDatar){
            LogHandler("nodeerror", serverconfig.errorpath ,{data:{errDatar:errDatar}} , remoteAddress); 
        }
    }); 
    /* 关闭时 */
    socket.on("close", function (socket) {
        var remoteAddress = socket.remoteAddress;  
    });
    /* 结束 */
    socket.on("end", function () { 
    });
    
    /* 错误时 */
    socket.on("error", function (e) {
        if (e.code == "EADDRINUSE") {
            console.log('地址被占用，重试中...');
            setTimeout(function () {
                server.close();
                server.listen(serverconfig.netport);
            }, 1000);
        }
    });
  socket.setTimeout(1000*serverconfig.nettimeout,function(){ 
      socket.destroy();
  });
});

server.listen(serverconfig.netport, function (e) {
    console.log("服务器端口：" + serverconfig.netport + "开启");
});

/* 设0 */
function setZero(d) {
    if (d < 10) {
        d = '0' + d;
    }
    return d;
}
/* 时间转换 */
var dataConvert = function (date) {
    var ymd = date.getFullYear() + "-" + setZero(date.getMonth() + 1) + "-" + setZero(date.getDate());
    var hms = setZero(date.getHours()) + ":" + setZero(date.getMinutes()) + ":" + setZero(date.getSeconds());
    return ymd + " " + hms;
}

/* 日志写入操作 */
function LogHandler(type, path, data, remoteAddress) {
    var now = new Date();
    var filepath = path + "\\" + now.getFullYear() + "\\" + (now.getMonth() + 1)+"\\"+now.getDate() ; /*文件路径*/
    var filename = (type == "log" ? data.logtype : "nodeerror")+"-"+ now.getHours() + ".txt"; /*文件名*/
    var fullpath = filepath + "\\" + filename;/*完整路径*/
    /*写入日志格式*/
    var dataformat = dataConvert(new Date()) + "，localhost:" + remoteAddress + "，data :" + (JSON.stringify(data.data)); 
    /* 正常日志写入 */
    if (type == "log") { 
        /* 写入mongodb */
        var config = {
            basename: data.dbname,
            tablename: data.tablename,
            auth: false
        };
        
        data.data.createtime = mongodbhandler.getmongodate();
        if(data.data._id){
            delete data.data._id;
        }
        mongodbhandler.set(config, data.data, function (err, result) { 
            if (!err && result.state == 1) { 
                if (fs.existsSync(filepath)) {
                    fs.appendFileSync(fullpath, dataformat + "\r\n");
                } else {
                    //如果不存在文件夹则创建  
                    createpath(filepath, serverconfig.logpath, function () {
                        fs.appendFileSync(fullpath, dataformat + "\r\n");
                    });
                }
            } else {
                dataformat = dataformat + " error : " + err;
                if (fs.existsSync(filepath)) {
                    fs.appendFileSync(fullpath, dataformat + "\r\n");
                } else {
                    //如果不存在文件夹则创建  
                    createpath(filepath, serverconfig.errorpath, function () {
                        fs.appendFileSync(fullpath, dataformat + "\r\n");
                    });
                }
            }
        });
    }
    /* 错误日志写入 */
    else if (type == "nodeerror") {
        if (fs.existsSync(filepath)) {
            fs.appendFileSync(fullpath, dataformat + "\r\n");
        } else {
            //如果不存在文件夹则创建  
            createpath(filepath, serverconfig.errorpath, function () {
                fs.appendFileSync(fullpath, dataformat + "\r\n");
            });
        }
    }
}
/* 创建路径path, 从cpath开始创建，以免创建c盘之前的无用路径 */
function createpath(path, cpath, callbcak) {
    var patharr = path.split("\\");
    var temppath = "";
    var iscreate = false;
    for (let i = 0; i < patharr.length; i++) {
        if (i == 0) {
            temppath = patharr[i];
        } else {
            temppath = temppath + "\\" + patharr[i];
        }
        if (temppath == cpath || iscreate) {
            iscreate = true;
            if (fs.existsSync(temppath)) {
            } else {
                fs.mkdirSync(temppath);
            }
        }
        /* 最后回调一次 */
        if (i == (patharr.length - 1)) {
            setTimeout(function () {
                callbcak();
            }, 50);
        }
    }
}

function senddata(req, res, data) {
    if (req.query.callback) {
        res.send(req.query.callback + '(' + JSON.stringify(data) + ')');
    }
    else {
        res.send(data);
    }
}