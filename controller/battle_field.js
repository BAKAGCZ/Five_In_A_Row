function BattleField() {
	this.row = 15;
	this.column = 18;
	this.battle_map = [];
    this.chess = 2; // 黑棋先下
    this.direct = [
        [-1,-1,1,1],
        [-1,0,1,0],
        [0,-1,0,1],
        [1,-1,-1,1]
    ];

    this.reset = function() {
        for (var i=0; i<this.row; i++)
            for (var j=0; j<this.column; j++)
                this.battle_map[i][j]=0;
    };

	this.create = function() {
		this.battle_map = new Array(this.row);
		for (var i=0; i<this.row; i++)
			this.battle_map[i] = new Array(this.column);
        this.reset();
	};

    /**
        * @param chess  1白棋 2黑棋
        * @param x(row)
        * @param y(col)
        * @return int: // -1下棋失败 6胜利 9继续下
    */
    this.play = function(chess, x, y) {
        if (this.battle_map[x][y] != 0 || this.chess != chess 
            || x < 0 || x > this.row - 1 
            || y < 0 || y > this.column - 1) return -1;
        this.chess = this.chess == 1 ? 2 : 1;
        this.battle_map[x][y]=chess;
        if (this.judge(x, y))
            return 6;
        return 9;
    };

    this.judge = function(x, y) {
        var c = this.battle_map[x][y];
        var flag = 0;
		//四个方向
        for (var i=0; i<this.direct.length; i++)
        {
            var count = 1;
            var nx = x, ny = y;
            while (true)
            {
                nx += this.direct[i][0];
                ny += this.direct[i][1];
                if (nx<0 || nx>this.row-1 || ny<0 || ny>this.column-1) break;
                if (c != this.battle_map[nx][ny]) break;
                count++;
            }

            nx = x; ny = y;
            while (true)
            {
                nx += this.direct[i][2];
                ny += this.direct[i][3];
                if (nx<0 || nx>this.row-1 || ny<0 || ny>this.column-1) break;
                if (c != this.battle_map[nx][ny]) break;
                count++;
            }

            if (count >= 5)
            {
                flag = 1;
                break;
            }
        }
        return flag;
    };
};

module.exports = BattleField;