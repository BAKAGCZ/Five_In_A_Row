module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_account', {
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
	    email: {
	    	type: DataTypes.STRING(64),
	    	validate: {
	    		isEmail: true
	    	},
	    	unique: true
	    }
	},{
		freezeTableName: true
	});
}