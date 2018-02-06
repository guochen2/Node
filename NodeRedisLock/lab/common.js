var time = {
    arr: {},
    timestart: function () {
        var g = newGuid();
        time.arr[g] = process.uptime() * 1000;
        return g;
    },
    timestop: function (k) {
        if (!time.arr[k]) {
            throw "time not init";
            return;
        }
        var t = process.uptime() * 1000 - time.arr[k];
        delete time.arr[k];
        return t.toFixed(0);
    }
};
function newGuid() {
    var guid = "";
    for (var i = 1; i <= 32; i++) {
        var n = Math.floor(Math.random() * 16.0).toString(16);
        guid += n;
        if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
            guid += "-";
    }
    return guid;
}

function getReqRemoteIp(req) {
    var ipAddress;
    var headers = req.headers;
    var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
    forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
};

exports.time = time;
exports.getreqip = getReqRemoteIp;