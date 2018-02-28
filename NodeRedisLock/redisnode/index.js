var redislock = require("./redislock");
var common = require("./common");
var handler = {
    add: async function (data) {
        if (!/^\d+$/.test(data.s)) {
            return "parmes s is error";
        }
        var result = checkpar({ k: data.k, v: data.v, s: data.s });
        if (result) { return result }
        try {
            result = await (await redislock.init()).add(data.k, data.v, data.s);
        } catch (ex) {
            return ex;
        }
        return result;
    },
    remove: async function (data) {
        var result = checkpar({ k: data.k, v: data.v });
        if (result) { return result }
        try {
            result = await (await redislock.init()).get(data.k);
            if (!result) {
                return "key not exists";
            }
            if (data.v == result) {
                result = await (await redislock.init()).remove(data.k);
            } else {
                return "key or value not correct";
            }
        } catch (e) {
            return e;
        }
        return result;
    },
    get: async function (data) {
        //如果参数错误 直接异常 不进行try拦截 底层错误 异常直接往外面抛
        var result = checkpar({ k: data.k });
        if (result) { throw result; return; }
        result = await (await redislock.init()).get(data.k);
        return result;
    },
    addnx: async function (data) {
        if (!/^\d+$/.test(data.t)) {
            return "parmes t is error";
        } if (!/^\d+$/.test(data.s)) {
            return "parmes s is error";
        }
        data.t = parseInt(data.t);
        var result = checkpar({ k: data.k, v: data.v, s: data.s, t: data.t });
        if (result) { return result };
        var dt = new Date();
        while (true) {
            if ((await (await redislock.init()).add(data.k, data.v, data.s)) == "success") {
                return "success";
            } else {
                if ((new Date().getTime() - dt.getTime()) / 1000 > data.t) {
                    return "timeout at " + data.t + " s";
                }
                await common.sleep(2);
            }
        }
    },
}
var checkpar = function (data) {
    for (i in data) {
        if (!data[i]) {
            return "parmes " + i + " is error";
        }
    }
    return "";
};
var query = async function (url, data) {
    switch (url) {
        case "add": return await handler.add(data); break;
        case "remove": return await handler.remove(data); break;
        case "get": return await handler.get(data); break;
        case "addnx": return await handler.addnx(data); break;
        default: return "operation error";
    }
};

exports.handler = query;