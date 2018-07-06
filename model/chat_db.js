const redis = require('redis');
const client = redis.createClient();

const chat_key = 'chat_message';
const max_message = 200;

class ChatDB
{
	constructor() {
        // client.flushdb();
    }
	add(data) { 
        return new Promise(function(resolve, reject)
        {
            client.lpush(chat_key, data, function(err, res) 
            {
                // 保存对象对应的key
                if (err) reject(err);
                else client.llen(chat_key, function(err, res)
                { 
                    if (err) reject(err);
                    else if (res > max_message) client.rpop(chat_key, function(err, res)
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

	get(start, n) { 
        return new Promise(function(resolve, reject){
            client.llen(chat_key, function(err, msglistlen) {
                if (err) reject(err);
                else client.lrange(chat_key, start>msglistlen?0:start, (start+n)>msglistlen?-1:(start+n), function(err, res){
                    if (err) reject(err);
                    else resolve(res);
                });
            });             
        });

	}
}

module.exports = new ChatDB();