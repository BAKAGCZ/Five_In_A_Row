var redisclient = require('../model').redis;
const chat_key = 'chat_message';
const max_message = 200;

class Chat
{
	constructor() {
        // redisclient.flushdb();
    }

	add(data) { 
        return new Promise(function(resolve, reject)
        {
            redisclient.lpush(chat_key, data, function(err, res) 
            {
                // 保存对象对应的key
                if (err) reject(err);
                else redisclient.llen(chat_key, function(err, res)
                { 
                    if (err) reject(err);
                    else if (res > max_message) redisclient.rpop(chat_key, function(err, res)
                    { 
                        // 如果长度过长删除最后一个
                        if (err) reject(err);
                        else resolve();
                    });
                    resolve();
                });
            });
        });
    }

	get(offset, n) { 
        offset = offset < 0 ? 0 : offset;
        return new Promise(function(resolve, reject){
            redisclient.llen(chat_key, function(err, msglistlen) {
                if (err) reject(err);
                else redisclient.lrange(chat_key, offset>msglistlen?0:offset, (offset+n)>msglistlen?-1:(offset+n), function(err, res){
                    if (err) reject(err);
                    else resolve(res);
                });
            });             
        });
	}
}


module.exports = new Chat(); 