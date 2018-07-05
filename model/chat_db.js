const redis = require('redis');
const client = redis.createClient();

const chat_key = 'chat_room';

class ChatDB
{
	constructor() {}
	add(data) { return client.lpush(chat_key, data); }
	get(start, n) { 
		return client.llen(chat_key, function(err, res){
			if (err) throw err;
			else client.lrange(chat_key, start, (start+n)>res?-1:(start+n));
		}); 
	}
}