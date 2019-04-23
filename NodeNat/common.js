var uuid = require('node-uuid');
var uuidreg = /([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/;
var common = {
    uuid: function () {
        return uuid.v1();
    },
    log: function () {
        var d = arguments;
        var arr = [];
        for (k in d) {
            arr.push(d[k]);
        }
        console.log(new Date(), arr)
    },
    regexuuid: function (data) {
        return uuidreg.test(data);
    },
    getuuidbyregex: function (data) {
        if (uuidreg.test(data)) {
            return uuidreg.exec(data)[1];
        }
        return undefined;
    }
}

module.exports = { common: common };
// console.log(common.regexuuid("openconnect_cb521ad0-659c-11e9-9da6-0b8170f75772"));