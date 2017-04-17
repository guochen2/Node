var dthmysql = require("dthmysql").dthmysql;
var co = require('co');
co(function* () {
    var data = yield dthmysql.query("select * from uservisitinfo where visittime BETWEEN '2017-4-11' and '2017-4-12' order by uservisitinfoid desc limit 0,10;select count(0)as total from uservisitinfo where visittime BETWEEN '2017-4-11' and '2017-4-12';");
    if (data && data.message == 'success') {
        var da = {};
        if (data.data[1].length == 1) {
            da.total = data.data[1][0].total;
        }
        if (data.data[0].length > 0) {
            da.data = data.data[0];
        }
        console.log(da);
    };
    var sql = "insert into  customstatis set ?";
    var result = yield dthmysql.insert(sql, { statistypeid: 6, userid: 123, visitinfotypeid: 3, statistime: '2016-1-1', customdata: "{}", createtime: '2017-1-1' });
    console.log(result);
    sql = "update customstatis set userid=456 where userid=?";
    var result = yield dthmysql.update(sql, [123]);
    console.log(result);

    sql = "delete from customstatis where customstatis=?";
    var result = yield dthmysql.remove(sql, [1547]);
    console.log(result);
}) 