
let common = require("./common");
let findhandler = function* (option, params) {
    if (option == "currdateholiday") {//根据法定节假日 计算提现倍数
        let d = yield common.findData("config", { operationtype: 4 });
        let dd = new Date();
        let newDate = dd.pattern("yyyy-MM-dd");
        let multiple = 0;//倍数
        let value = d.value.toJson();
        for (var i in value) {
            if (value[i].date == newDate) {
                multiple = value[i].multiple;
                break;
            }
        }
        if (multiple == 0) {
            if (new Date().getDay() == 5 || new Date().getDay() == 6 || new Date().getDay() == 0) {
                multiple = 3;
            }
        }
        if (multiple == 0) {
            multiple = 1;
        }
        d.value = multiple;
        return d;
    }
    else if (option == "appversion") {
        let d = yield common.findData("config", { operationtype: 8 });
        let value = d.value.toJson();
        return value;
    }
    else if (option == "getappinit") {
        let d = yield common.findData("config", { operationtype: 7 });
        let value = d;
        return value;
    }
    else if (option == "redpacketactiveproportion") {
        var loanPeriod = params.lp;
        var type = params.type;
        var unit = params.unit;
        var resdata = { code: 0, msg: '', data: 0 };
        try {
            var result = yield common.findData("config", { operationtype: 14 });
            if (result.operationstatus == 1) {
                var value = JSON.parse(result.value);
                var propor = value.find(function (item) { return item.type == type });
                if (propor && propor[unit]) {
                    var config = propor[unit].sort(function (a, b) { a - b });
                    var curPropor = config.find(function (item) { return loanPeriod <= item.max });
                    if (curPropor) {
                        resdata.code = 1;
                        resdata.data = curPropor.value;
                    }
                }
            }
        } catch (e) {
            console.log(e);
            resdata.msg = '配置中心数据获取异常';
        }
        return resdata;
    }
    return 'option error';
}
let findhandlerid = function* (id, params) {
    let d = yield common.findData("config", { operationtype: parseInt(id) });
    return d;
}
let updatehandler = function* (id, params) {
    var udata = { value: params.value };
    if (params.starttime) {
        udata.starttime = params.starttime;
    }
    if (params.endtime) {
        udata.endtime = params.endtime;
    }
    if (params.value) {
        udata.value = params.value;
    }
    if (params.desc) {
        udata.desc = params.desc;
    }
    let d = yield common.updateData("config", { operationtype: parseInt(id) }, { $set: udata });
    return d;
}

var addAliSafe = function* (mobile, name) {
    if (!mobile) {
        return null;
    }
    return yield common.insertData('fraud', { mobile, name, createtime: new Date() });
}

var removeAliSafe = function* (mobile) {
    if (!mobile) {
        return null;
    }
    return yield common.removeData('fraud', { mobile });
}

var getAliSafeList = function* (mobile, name, page, size) {
    var page = parseInt(page || 1);
    var size = parseInt(size || 20);
    var query = {};
    if (mobile) {
        query.mobile = mobile;
    } if (name) {
        query.name = name;
    }
    var data = { list: [], total: 0 };
    data.list = yield common.find('fraud', query, size, (page - 1) * size);
    data.total = yield common.findCount('fraud', query);
    return yield new Promise(function (resolve) {
        resolve(data);
    });
}

var getConfigList = function* (query) {
    var page = parseInt(query.page || 1);
    var size = parseInt(query.size || 20);
    var data = { list: [], total: 0 };
    data.list = yield common.find('config', {}, size, (page - 1) * size);
    data.total = yield common.findCount('config', {});
    return yield new Promise(function (resolve) {
        resolve(data);
    });
}
//var updateWhileList
module.exports = {
    findhandler: findhandler,
    findhandlerid: findhandlerid,
    updatehandler: updatehandler,
    getAliSafeList: getAliSafeList,
    addAliSafe,
    removeAliSafe,
    getConfigList
}