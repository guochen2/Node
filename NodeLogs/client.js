var net = require("net");
var serverconfig = {
    port: 3000,
    host:'192.168.20.194'
}
/* 客户端 */
var client = net.connect({ port: serverconfig.port,host:serverconfig.host }, function () {
    var testData = {
        "dbname" : "nodeweizhan",
        "tablename" : "Visit",
        "logtype":"visit",
        "data" : {"title":"访问","content":"","_serverIp":"139.129.116.48","_serverName":"iZ28zeaz5gjZ","UserID":"","TimeSpan":"0.1354","Url":"http://weiapi.dtcash.com:803/api/Safety/GetMobileVerifyCodeByType?mobile=18370440474&type=","UserHostAddress":"223.104.31.80","MajorVersion":"45","Platform":"WinNT","UserAgent":"mozilla/5.0 (windows nt 6.3; wow64) applewebkit/537.36 (khtml, like gecko) chrome/45.0.2454.99 safari/537.36","UserHostName":"10.165.48.161","Browsertype":"Chrome45","BrowserName":"Chrome","UrlReferrer":null,"CreateTime":"/Date(1458904811536)/","Site":null,"_id":{"Timestamp":1458876012,"Machine":15975972,"Pid":2568,"Increment":14725583,"CreationTime":"/Date(1458876012000)/"},"createtime":"2016-03-25T11:20:13.358Z"}
    }  
    // for(var i =0;i<5;i++){
    //     testData.data.title = "{123213123213}}"+i;
    //     testData.data.content = "{测}容"+i;
        // if(i > 5){
        //     client.write("asdasd");
        // }else{
        //     client.write("asdasdddd");
        //     // client.write(JSON.stringify(testData));
        // } 
    //     client.write("111");
    // } 
    client.write(JSON.stringify(testData));
    console.log("完成");
});

client.on('data', function (data) {
    console.log("client:" + data);
  //  client.destroy();
});
client.on('end', function () {
    console.log('客户端断开连接');
});