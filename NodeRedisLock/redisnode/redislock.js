var redis = require("redis");
var initfinish = false;
var config = require("../config");
var log = require("../log4");
var client;
var clientoption = { host: config.config.redis.host, port: config.config.redis.port, password: config.config.redis.password };
client = redis.createClient(clientoption);
client.on("ready", function (err) {
    // redis.debug_mode = true;
    if (err) {
        console.log(err);
    } else {
        console.log("redis read ok");
        log.logger.info("redis read ok");
    }
});
client.on("error", function (err) {
    // console.log(err, "出异常了");
    log.logger.error(err);
})
var handler = {
    //添加 若成功返回success 失败返回faild 异常直接抛
    add: async function (key, value, second) {
        return new Promise(function (resolve, reject) {
            if (!key) {
                reject("key is not empty");
                return;
            } if (!value) {
                reject("valuekey is not empty");
                return;
            } if (!second || parseInt(second) <= 0) {
                reject("second is not empty");
                return;
            }
            client.set(key, value, "nx", "ex", second, function (err, result) {
                if (err) { reject(err); }
                else {
                    if (!result) {
                        resolve("faild");
                    }
                    else if (result == "OK") {
                        resolve("success");
                    }
                    else {
                        reject("未知异常" + result);
                    }
                }
            })
        })
    },
    remove: async function (key) {
        return new Promise(function (resolve, reject) {
            if (!key) {
                reject("key is not empty");
                return;
            }
            client.del(key, function (err, result) {
                if (err) { reject(err); }
                else {
                    resolve("success");
                }
            })
        })
    }, get: async function (key) {
        return new Promise(function (resolve, reject) {
            if (!key) {
                reject("key is not empty");
                return;
            }
            client.get(key, function (err, result) {
                if (err) { reject(err); }
                else {
                    resolve(result);
                }
            })
        })
    }
}

///初始化 此处使用async 为了后续扩展
var init = async function () {
    return handler;
}

exports.init = init;
