var redislock = require("./redislock");
var common = require("./common");

var co = require("co");
var handler = {
    add: function* (data) {
        if (!/^\d+$/.test(data.s)) {
            return "parmes s is error";
        }
        var result = checkpar({ k: data.k, v: data.v, s: data.s });
        if (result) { return result }
        try {
            result = yield (yield redislock.init()).add(data.k, data.v, data.s);
        } catch (ex) {
            return ex;
        }
        return result;
    },
    remove: function* (data) {
        var result = checkpar({ k: data.k, v: data.v });
        if (result) { return result }
        try {
            result = yield (yield redislock.init()).get(data.k);
            if (!result) {
                return "key not exists";
            }
            if (data.v == result) {
                result = yield (yield redislock.init()).remove(data.k);
            } else {
                return "key or value not correct";
            }
        } catch (e) {
            return e;
        }
        return result;
    },
    // get: function* (data) {
    //     var result = checkpar({ k: data.k });
    //     if (result) { return result }
    //     try {
    //         result = yield (yield redislock.init()).get(data.k);
    //     } catch (e) {
    //         return e;
    //     }
    //     return result;
    // },
    addnx: function* (data) {
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
            if ((yield (yield redislock.init()).add(data.k, data.v, data.s)) == "success") {
                return "success";
            } else {
                if ((new Date().getTime() - dt.getTime()) / 1000 > data.t) {
                    return "timeout at " + data.t + " s";
                }
                yield common.sleep(2);
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
var query = function* (url, data) {
    switch (url) {
        case "add": return yield handler.add(data); break;
        case "remove": return yield handler.remove(data); break;
        // case "get": return yield handler.get(data); break;
        case "addnx": return yield handler.addnx(data); break;
        default: return "operation error";
    }
};

exports.handler = query;