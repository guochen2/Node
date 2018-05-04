这是redislock项目 
/redisnode/add 参数k(key) v(value) s(设置的过期秒数)  如果key存在 返回失败 不存在 并add成功 返回成功
/redisnode/addnx 参数k(key) v(value) s(设置的过期秒数) t(接口的超时时间) 如果成功 返回success 否则失败
/redisnode/remove 参数k(key) v(value)