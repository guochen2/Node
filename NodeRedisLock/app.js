var log = require("./log4");
var qstring = require("querystring");
var config = require("./config");
var http = require("http");
var redisnode = require("./redisnode/index");
var co = require("co");
var fs = require("fs");
var common = require("./lab/common");
http.createServer(function (req, res) {
    if (req.url.indexOf("/redisnode/") == 0) {
        var s = common.time.timestart();
        co(function* () {
            var result = yield redisnode.handler(req.url.split("?")[0].replace("/redisnode/", ""), qstring.parse(req.url.split("?")[1]));
            res.end(result);
            log.logger.visit(`${common.getreqip(req)} ${common.time.timestop(s)}ms  ${req.url}`);
        })
        return;
    }
    fs.readFile(__dirname + "/read.me", "utf-8", function (err, d) {
        if (err) {
            res.end(err);
        } else {
            res.end(d.toString());
        }
    })
}).listen(config.config.port, '0.0.0.0');