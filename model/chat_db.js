const chat_key = 'chat_message';
const max_message = 200;

class ChatDB
{
	constructor(client) {
        ChatDB.client = client;
        // client.flushdb();
    }

	add(data) { 
        return new Promise(function(resolve, reject)
        {
            ChatDB.client.lpush(chat_key, data, function(err, res) 
            {
                // 保存对象对应的key
                if (err) reject(err);
                else ChatDB.client.llen(chat_key, function(err, res)
                { 
                    if (err) reject(err);
                    else if (res > max_message) ChatDB.client.rpop(chat_key, function(err, res)
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
            ChatDB.client.llen(chat_key, function(err, msglistlen) {
                if (err) reject(err);
                else ChatDB.client.lrange(chat_key, offset>msglistlen?0:offset, (offset+n)>msglistlen?-1:(offset+n), function(err, res){
                    if (err) reject(err);
                    else resolve(res);
                });
            });             
        });

	}
}
ChatDB.client = {};

module.exports = ChatDB;