"use strict";

var http = require('http');
var config = require("./config");
var serverconfig = config.serverconfig;
var url = require("url");
var mongodbhandler = require("mongodbhandler").mongodbhandler;
var fs = require("fs");


/**
 * 简单配置个路由 用来检测无用的请求 仅符合路由规则的才能被接受
 * 自己可以按照需要定义
 * @type {{/: string, favicon: string, user: string, login: string, biz: string}}
 */
var route = {
    '/': "/log/addlog"
};

/**
 * 上述路由的简单判断规则
 * @param reqPath
 * @returns {boolean}
 */
var isValid = function (reqPath) {
    for (var key in route) {
        if (route[key] == reqPath) {
            return true;
        }
    }
    return false;
};

/**
 * 照样输出json格式的数据
 * @param query
 * @param res
 */
var writeOut = function (dataJson) {
    var remoteAddress = "";
    try { 
        dataJson = JSON.parse(dataJson);
        remoteAddress = dataJson.ServerIP;
        if (dataJson) {
            var databasepath = serverconfig.logpath + "\\" + dataJson.dbname + "\\" + dataJson.tablename;
            LogHandler("log", databasepath, dataJson, remoteAddress);
        }
    } catch (e) {
        /*写入错误日志,此日志不写入数据库，写入errorlog文件夹目录下*/
        // var databasepath = serverconfig.errorpath + "\\" + dataJson.dbname + "\\" + dataJson.tablename;
        LogHandler("nodeerror", serverconfig.errorpath, { data: { ex: e, Data: dataJson } }, remoteAddress);
    } 
}

/** 
 * createServer内侧为回调函数：
 * ...可看作java servlet中的 onService(HttpRequest,HttpResponse)
 * ...或者（doGet、doPost）
 */
http.createServer(function (req, res) {

    if (!isValid(url.parse(req.url).pathname)) {
        res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
        res.write("{'errcode':404,'errmsg':'404 页面不见啦'}");
        res.end();
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
        if (req.method.toUpperCase() == 'POST') {
            var postData = "";
            /**
             * 因为post方式的数据不太一样可能很庞大复杂，
             * 所以要添加监听来获取传递的数据
             * 也可写作 req.on("data",function(data){});
             */
            req.addListener("data", function (data) {
                postData += data;
            });
            /**
             * 这个是如果数据读取完毕就会执行的监听方法
             */
            req.addListener("end", function () {
                res.end();
                writeOut(postData);
            });
        }else{
            res.end("method is not post");
        }
    }

}).listen(serverconfig.httpport, function () {
    console.log("httpserver listen on port " + serverconfig.httpport);
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
function LogHandler(type, path, data, remoteAddress, callback) {
    var now = new Date();
    var filepath = path + "\\" + now.getFullYear() + "\\" + (now.getMonth() + 1) + "\\" + now.getDate(); /*文件路径*/
    var filename = (type == "log" ? data.logtype : "nodeerror") + "-" + now.getHours() + ".txt"; /*文件名*/
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
            if (callback) {
                callback();
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
        if (callback) {
            callback();
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

