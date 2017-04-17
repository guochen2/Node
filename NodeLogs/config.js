exports.serverconfig = {
    socketserver:{
        enable:false,
        port:3004,
    },
    httpport: 3005,
    netport:3003,
    errorpath: __dirname + "\\errorlog", /*node 错误日志文件路径*/
    logpath: __dirname + "\\log" /*正常日志文件路径*/
    nettimeout:60*60,//秒
}//服务端配置