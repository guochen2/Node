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
    add: function* (key, value, second) {
        return yield new Promise(function (resolve, reject) {
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
    remove: function* (key) {
        return yield new Promise(function (resolve, reject) {
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
    }, get: function* (key) {
        return yield new Promise(function (resolve, reject) {
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

///初始化
var init = function* () {
    return handler;
}

exports.init = init;
