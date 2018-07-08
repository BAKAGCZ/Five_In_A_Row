module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_account', {
	    id: {
	        type: DataTypes.BIGINT(11), 
	        autoIncrement: true, 
	        primaryKey: true, 
	        unique: true
	    },
	    name: {
	        type: DataTypes.STRING,
	        unique: true
	    },
	    passcode: {
	        type: DataTypes.STRING
	    },
	    win: {
	    	type: DataTypes.INTEGER,
	    	defaultValue: 0
	    },
	    lose: {
	    	type: DataTypes.INTEGER,
	    	defaultValue: 0
	    }
	});
}