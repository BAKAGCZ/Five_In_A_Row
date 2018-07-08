module.exports = function(sequelize, DataTypes) {
	return sequelize.define('player_rank', {
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
		score: {
			type: DataTypes.BIGINT, 
			defaultValue: 0
		}
	});
}