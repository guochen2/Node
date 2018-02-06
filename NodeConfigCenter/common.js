//////
//单表操作 增删改查
//auth:guo
//time:2017年10月26日17:03:33
///////
var MongoClient = require('mongodb').MongoClient;
var config = require("./config");
var DB_CONN_STR = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.post + '/' + config.mongodb.dbname;

var insertData = function* (tablename, data) {
    return yield new Promise(function (resolve) {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            console.log("连接成功！");
            //连接到表 site
            var collection = db.collection(tablename);
            //插入数据 
            collection.insertOne(data, function (err, result) {
                if (err) {
                    console.log('Error:' + err);
                    return;
                }
                db.close();
                resolve(result);
            });
        });
    })
}
var updateData = function* (tablename, query, data) {
    return yield new Promise(function (resolve) {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            console.log("连接成功！");
            //连接到表 site
            var collection = db.collection(tablename);
            //插入数据 
            collection.updateOne(query, data, function (err, result) {
                if (err) {
                    console.log('Error:' + err);
                    return;
                }
                db.close();
                resolve(result);
            });
        });
    })
}
var findData = function* (tablename, query) {
    return yield new Promise(function (resolve) {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            console.log("连接成功！");
            //连接到表 site
            var collection = db.collection(tablename);
            //插入数据 
            collection.findOne(query, function (err, result) {
                if (err) {
                    console.log('Error:' + err);
                    return;
                }
                db.close();
                resolve(result);
            });
        });
    })
}

var removeData = function* (tablename, query) {
    var collection = yield getCollection(tablename);
    return new Promise(function (resolve, reject) {
        collection.remove(query, function (err, result) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                collection.close();
                resolve(result);
            }
        });
    });
}

var findCount = function* (tablename, query) {
    var collection = yield getCollection(tablename);
    return new Promise(function (resolve, reject) {
        collection.count(query, function (err, result) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                collection.close();
                resolve(result);
            }
        });
    });
}

var find = function* (tablename, query, limit, skip) {
    var collection = yield getCollection(tablename);
    return new Promise(function (resolve, reject) {
        collection.find(query).limit(limit).skip(skip).toArray(function (err, result) {
            if (err) {
                reject(err);
            } else {
                collection.close();
                resolve(result);
            }
        });
    });

}

var getCollection = function* (tablename) {
    var db = yield getConnect();
    return new Promise(function (resolve) {
        var collection = db.collection(tablename);
        collection.close = db.close.bind(db);
        resolve(collection);
    });
}

var getConnect = function* () {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            if (!err)
                resolve(db);
            else
                reject(err);
        })
    });
}

Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份        
        "d+": this.getDate(), //日        
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时        
        "H+": this.getHours(), //小时        
        "m+": this.getMinutes(), //分        
        "s+": this.getSeconds(), //秒        
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度        
        "S": this.getMilliseconds() //毫秒        
    };
    var week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};
String.prototype.toJson = function () {
    return eval('(' + this + ')');
};

module.exports = {
    insertData: insertData,
    updateData: updateData,
    findData, findData,
    find,
    removeData,
    findCount
}