function BattleField() {
	this.row = 100;
	this.column = 100;
	this.battle_map;

	this.create = function() {
		this.battle_map = new Array(this.row);
		for (var i=0; i<this.row; i++)
			this.battle_map[i] = new Array(this.column);
	};
};

module.exports = BattleField;