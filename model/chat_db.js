const redis = require('redis');
const client = redis.createClient();

const chat_key = 'chat_room';
const max_message = 200;

class ChatDB
{
	constructor() {}
	add(data) { 
        return new Promise(function(resolve, reject){
            client.lpush(chat_key, data, function(err, res) {
                if (err) throw err;
                else client.llen(chat_key, function(err, res) {
                    if (err) throw err;
                    else if (res > max_message) client.rpop(chat_key);
                });
            });             
        });

    }
	get(start, n) { 
		client.llen(chat_key, function(err, res) {
            if (err) throw err;
			else return client.lrange(chat_key, start>res?0:start, (start+n)>res?-1:(start+n));
		}); 
	}
}

module.exports = new ChatDB();