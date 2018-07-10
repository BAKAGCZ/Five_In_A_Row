const CBInfo = {
    // 游戏状态
    // -1下棋失败 6胜利 9继续下
    play_fail: -1,
    play_win: 6,
    play_keep: 9,
    // 角色
    none: 0,
    white: 1,
    black: 2,
    // 棋盘属性
    row: 15,
    column: 18,
    direct: [
        [-1,-1,1,1],
        [-1,0,1,0],
        [0,-1,0,1],
        [1,-1,-1,1]
    ]
}

var chess_boards = {};

class ChessBoard {
    constructor() { }

    has(roomid) { return chess_boards[roomid] != undefined; }

    reset(roomid) {
        let cur_cb = chess_boards[roomid];
        cur_cb.chess = CBInfo.black;
        cur_cb.chess_manual = [];
        for (let i=0; i<CBInfo.row; i++)
            for (let j=0; j<CBInfo.column; j++)
                cur_cb.cb[i][j]=0;
    };

	create(roomid) {
        chess_boards[roomid] = {};
        let cur_cb = chess_boards[roomid];
        cur_cb.chess = CBInfo.black;
        cur_cb.chess_manual = [];

		cur_cb.cb = new Array(CBInfo.row);
		for (let i=0; i<CBInfo.row; i++)
			cb[i] = new Array(CBInfo.column);
        this.reset(roomid);
	};

    /**
        * @param chess
        * @param x(row)
        * @param y(col)
        * @return int
    */
    play(roomid, chess, x, y) {
        let cur_cb = chess_boards[roomid];
        if (cur_cb.cb[x][y] != 0 || cur_cb.chess != chess 
            || x < 0 || x > CBInfo.row - 1 
            || y < 0 || y > CBInfo.column - 1) return CBInfo.play_fail;
        cur_cb.chess = cur_cb.chess == CBInfo.white ? CBInfo.black : CBInfo.white;
        cur_cb.cb[x][y] = chess;
        cur_cb.chess_manual.push({x:x, y:y});
        if (this.judge(x, y))
            return CBInfo.play_win;
        return CBInfo.play_keep;
    };

    judge(roomid, x, y) {
        let cur_cb = chess_boards[roomid];
        let c = cur_cb.cb[x][y];
        let flag = 0;
		//四个方向
        for (let i=0; i<CBInfo.direct.length; i++)
        {
            let count = 1;
            let nx = x, ny = y;
            while (true)
            {
                nx += CBInfo.direct[i][0];
                ny += CBInfo.direct[i][1];
                if (nx<0 || nx>CBInfo.row-1 || ny<0 || ny>CBInfo.column-1) break;
                if (c != cur_cb.cb[nx][ny]) break;
                count++;
            }

            nx = x; ny = y;
            while (true)
            {
                nx += CBInfo.direct[i][2];
                ny += CBInfo.direct[i][3];
                if (nx<0 || nx>CBInfo.row-1 || ny<0 || ny>CBInfo.column-1) break;
                if (c != cur_cb.cb[nx][ny]) break;
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

    getChessManual(roomid) { return chess_boards[roomid].chess_manual; }
};

ChessBoard.config = CBInfo;

module.exports = new ChessBoard();