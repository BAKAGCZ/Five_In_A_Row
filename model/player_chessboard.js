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
	    }
	},{
		freezeTableName: true
	});
}