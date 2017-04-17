var config = require("./config");
var sockets=[];//socket对象
var serversockt={
    init:function(emit){
        serversockt.emitter=emit;//添加监听对象
        var io= require("socket.io").listen(config.serverconfig.socketserver.port);//启动监听
        io.on('connection', function (socket) {
            console.log(socket.id);
            sockets.push({id:socket.id,socket:socket});                
            //客户端关闭 移除
            socket.on('disconnect', function () {
                SpliceSocket(socket);
            });
        });
        serversockt.emitter.on("addlog",function(data){
            SendAllSocket("addlog",data);
        })
    },
}
function SpliceSocket(socket){
	var k=-1;
	for (var i = 0; i < sockets.length; i++) {
		 if(sockets[i].id==socket.id){
		  k=i;
	   }
	}
	if(k>=0){
		 sockets.splice(sockets[k], 1);
	}
}
function SendAllSocket(funcname, data) {
    for (var i = 0; i < sockets.length; i++) { 
		try {
			sockets[i].socket.emit(funcname, data);
		}
		catch (ex) {
			console.log("推送出现异常:" + ex);
		} 
    }
}
exports.serversockt=serversockt;