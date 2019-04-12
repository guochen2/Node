var config = {
    Server: {
        ServerLOCAL_PORT: 555,
        Proxy_PORT: 444
    },
    Client: {
        LOCAL_PORT: 333,
        ServerProxy_HOST: "127.0.0.1",
        ServerProxy_POST: 444,

        //反向代理远程服务器
        REMOTE_PORT: 80,
        //反向代理地址
        REMOTE_HOST: "127.0.0.1",
    }
}

module.exports = { config: config };