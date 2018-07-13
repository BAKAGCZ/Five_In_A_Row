module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_rank', {
	    id: {
	        type: DataTypes.BIGINT(11), 
	        autoIncrement: true, 
	        primaryKey: true, 
	        unique: true
	    },
		winner: {
			type: DataTypes.STRING
		},
	    loser: {
	    	type: DataTypes.STRING
	    },
	    chessboard: {
	    	type: DataTypes.STRING,
	    	comments: '棋谱'
	    },
	    chesstype: {
	    	type: DataTypes.INTEGER,
	    	comments: '棋的类型'
	    }
	},{
		freezeTableName: true
	});
}