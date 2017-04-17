var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
if (cluster.isMaster) { //判断进程是否工作
    console.log('[master] ' + "start master...");
    for (var i = 0; i < numCPUs; i++) { //根据CPU通道 开启进程

        cluster.fork();

    }
    cluster.on('listening', function (worker, address) { //为cluster绑定listening事件

        console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);

    });
}
else {
    console.log('[worker] ' + "start worker ..." + cluster.worker.id);
    require("./httpserver");

    require("./netserver"); 

}