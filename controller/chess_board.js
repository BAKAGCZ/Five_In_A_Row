const CBInfo = {
    // 游戏状态
    // -1下棋失败 6胜利 9继续下
    play_fail: -1,
    play_win: 6,
    play_keep: 9,
    // 角色
    visitor: 0,
    white: 1,
    black: 2
}

class ChessBoard {
    constructor() {
        this.row = 15;
        this.column = 18;
        this.chess_board = [];
        this.chess = CBInfo.black; // 黑棋先下
        this.direct = [
            [-1,-1,1,1],
            [-1,0,1,0],
            [0,-1,0,1],
            [1,-1,-1,1]
        ];        
    }


    reset() {
        this.chess = CBInfo.black;
        for (var i=0; i<this.row; i++)
            for (var j=0; j<this.column; j++)
                this.chess_board[i][j]=0;
    };

	create() {
		this.chess_board = new Array(this.row);
		for (var i=0; i<this.row; i++)
			this.chess_board[i] = new Array(this.column);
        this.reset();
	};

    /**
        * @param chess
        * @param x(row)
        * @param y(col)
        * @return int
    */
    play(chess, x, y) {
        if (this.chess_board[x][y] != 0 || this.chess != chess 
            || x < 0 || x > this.row - 1 
            || y < 0 || y > this.column - 1) return CBInfo.play_fail;
        this.chess = this.chess == CBInfo.white ? CBInfo.black : CBInfo.white;
        this.chess_board[x][y]=chess;
        if (this.judge(x, y))
            return CBInfo.play_win;
        return CBInfo.play_keep;
    };

    judge(x, y) {
        var c = this.chess_board[x][y];
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
                if (c != this.chess_board[nx][ny]) break;
                count++;
            }

            nx = x; ny = y;
            while (true)
            {
                nx += this.direct[i][2];
                ny += this.direct[i][3];
                if (nx<0 || nx>this.row-1 || ny<0 || ny>this.column-1) break;
                if (c != this.chess_board[nx][ny]) break;
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

ChessBoard.config = CBInfo;

module.exports = ChessBoard;