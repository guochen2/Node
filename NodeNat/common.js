var uuid = require('node-uuid');
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
    }
}

module.exports = { common: common };