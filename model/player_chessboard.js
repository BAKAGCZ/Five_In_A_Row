module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_rank', {
	    id: {
	        type: DataTypes.BIGINT(11), 
	        autoIncrement: true, 
	        primaryKey: true, 
	        unique: true
	    },
		winner: {
			type: DataTypes.STRING(64)
		},
	    loser: {
	    	type: DataTypes.STRING(64)
	    },
	    chessboard: {
	    	type: DataTypes.TEXT,
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