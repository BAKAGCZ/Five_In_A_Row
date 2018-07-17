module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_rank', {
	    id: {
	        type: DataTypes.BIGINT(11), 
	        autoIncrement: true, 
	        primaryKey: true, 
	        unique: true
	    },
		name: {
			type: DataTypes.STRING(64),
	        unique: true
		},
		score: {
			type: DataTypes.BIGINT, 
			defaultValue: 0
		},
	    win: {
	    	type: DataTypes.INTEGER,
	    	defaultValue: 0
	    },
	    lose: {
	    	type: DataTypes.INTEGER,
	    	defaultValue: 0
	    }
	},{
		freezeTableName: true
	});
}