const redis = require('redis');
const client = redis.createClient();

const chat_key = 'chat_room';
const max_message = 200;

class ChatDB
{
	constructor() {}
	add(data) { 
        client.lpush(chat_key, data, function(err, res){
            if (err) throw err;
            else
            { 
                client.llen(chat_keym function(err, res){
                    if (err) throw err;
                    else if (res > max_message)
                        client.rpop(chat_key);
                });
            }
        }); 
    }
	get(start, n) { 
		client.llen(chat_key, function(err, res){
			if (err) throw err;
			else return client.lrange(chat_key, start, (start+n)>res?-1:(start+n));
		}); 
	}
}