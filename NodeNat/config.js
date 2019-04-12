var config = {
    Server: {
        //监听调用方
        ServerLOCAL_PORT: 10000,
        //监听client
        Proxy_PORT: 10001
    },
    Client: {
        //防止线程退出得端口
        LOCAL_PORT: 333,
        //服务端地址
        ServerProxy_HOST: "阿里测试环境host",
        //服务端端口
        ServerProxy_POST: 10001,

        //反向代理远程服务器
        REMOTE_PORT: 5601,
        //反向代理地址
        REMOTE_HOST: "127.0.0.1",
    }
}

module.exports = { config: config };