let express = require("express");
let app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
let co = require("co");

let config = require("./config");
let handler = require("./handler");

app.listen(config.post, function () {
    console.log("server start as post:" + config.post);
})

app.get("/getconfig/:id", function (req, res) {
    co(function* () {
        let d = { code: 0, data: '数据错误' };
        if (/^\d+$/.test(req.params.id)) {
            d.code = 1;
            d.data = yield handler.findhandlerid(req.params.id, req.query);
        } else {
            let id = req.params.id.toLowerCase();
            d.code = 1;
            d.data = yield handler.findhandler(id, req.query);
            if (id == "appversion" || id == "redpacketactiveproportion")//返回值特殊处理
            {
                res.jsonp(d.data);
                return;
            }
        }
        res.jsonp(d);
    })
})

app.post("/editconfig/:id", function (req, res) {
    co(function* () {
        let d = { code: 0, msg: '' };
        try {
            if (/^\d+$/.test(req.params.id)) {
                var result = yield handler.updatehandler(req.params.id, req.body);
                if (result && result.result.n == 0) {
                    d.code = 0;
                    d.msg = '不存在该数据';
                } else if (result && result.result.ok == 1) {
                    d.code = 1;
                    d.msg = '成功';
                } else {
                    d.msg = '更改失败';
                }
            }
        } catch (e) {
            console.log(e);
            d.code = -1;
            d.msg = '更改数据异常'
        }
        res.jsonp(d);
    })
})

app.get('/alisafelist', function (req, res) {
    co(function* () {
        var mobile = req.query.mobile;
        var name = req.query.name;
        var page = req.query.page;
        var size = req.query.size;
        var resdata = { code: 0, msg: '' };
        try {
            resdata.code = 1;
            resdata.data = yield handler.getAliSafeList(mobile, name, page, size);
        } catch (e) {
            console.log(e);
            resdata.code = -1;
            resdata.msg = '数据获取异常';
        }
        res.jsonp(resdata);
    })
})

app.get('/existalisafe', function (req, res) {
    co(function* () {
        var mobile = req.query.mobile;
        var resdata = { code: 0, msg: '' };
        try {
            var data = yield handler.getAliSafeList(mobile, '', 1, 1);
            if (data.total > 0) {
                resdata.code = 1;
            }
        } catch (e) {
            resdata.code = -1;
            resdata.msg = '数据获取异常';
            console.log(e);
        }
        res.jsonp(resdata);
    });
});

app.post('/addalisafe', function (req, res) {
    co(function* () {
        var resdata = { code: 0, data: {}, msg: '' };
        var mobile = req.body.mobile;
        var name = req.body.name;
        if (!mobile || !/^1[3|4|5|7|8]\d{9}$/.test(mobile)) {
            resdata.msg = '参数非法';
        } else {
            var alisafes = yield handler.getAliSafeList(mobile);
            if (alisafes && alisafes.total == 1) {
                resdata.msg = '手机号已存在';
            } else {
                var result = yield handler.addAliSafe(mobile, name);
                if (result && result.result.ok == 1) {
                    resdata.code = 1;
                    resdata.msg = '成功';
                } else {
                    resdata.msg = '添加失败';
                }
            }
        }
        res.jsonp(resdata);

    })
});

app.post('/removealisafe', function (req, res) {
    co(function* () {
        var resdata = { code: 0, data: {}, msg: '' };
        var mobile = req.body.mobile;
        if (!mobile || !/^1[3|4|5|7|8]\d{9}$/.test(mobile)) {
            resdata.msg = '参数非法';
        } else {
            var result = yield handler.removeAliSafe(mobile);
            if (result && result.result.n == 0) {
                resdata.code = 0;
                resdata.msg = '不存在该数据';
            } else if (result && result.result.ok == 1) {
                resdata.code = 1;
                resdata.msg = '成功';
            } else {
                resdata.msg = '删除失败';
            }
        }
        res.jsonp(resdata);
    });
})

app.get('/getconfiglist', function (req, res) {
    co(function* () {
        var resdata = { code: 0, msg: '' };
        try {
            resdata.code = 1;
            resdata.data = yield handler.getConfigList(req.query);
        } catch (e) {
            console.log(e);
            resdata.msg = '配置中心数据获取异常';
        }
        res.jsonp(resdata);
    })
})