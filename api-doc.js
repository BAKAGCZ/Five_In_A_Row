/* ----- 自动匹配 ----- */
function 自动匹配()
{
	进入自动匹配:
		发送 'notify_join_automatch' 参数:空
		返回 'confirm_join_automatch' 参数:用户名

	退出自动匹配:
		发送 'notify_leave_automatch' 参数:空
		返回 'confirm_leave_automatch' 参数:用户名


	/* ----- 房间 ----- */
	创建房间:
		发送 'notify_create_room' 参数:房间名
		返回 'confirm_create_room' 参数:房间ID

	加入房间:
		发送 'notify_join_room' 参数:房间ID
		返回 'confirm_join_room' 参数:房间ID

	离开房间:
		发送 'notify_leave_room' 参数:空
		返回:
			if (认输退出) 返回'confirm_play_defeat' 参数:棋子颜色
			都返回 'notify_game_over' 参数:空
			都返回 'confirm_leave_room' 参数:空
}

/* ----- 游戏 ----- */
function 游戏()
{
	玩家准备:
		发送 'notify_game_ready' 参数:空
		返回:
			if (双方都准备) 返回 'notify_game_start' 参数:空

	游戏开始:
		监听 'notify_game_start'
		发送 'confirm_game_start' 参数:空
		返回: 空
		注释: 主要用于服务器状态同步, 客户端按要求监听发送即可

	游戏结束:
		监听 'notify_game_over' 参数:空
		发送 'confirm_game_over' 参数:空
		注释: 主要用于服务器状态同步, 客户端按要求监听发送即可

	玩家下一步棋:
		发送 'notify_play_one' 参数: {
									chess: 棋子颜色,
									x: x坐标,
									y: y坐标
								}

		返回:
			'confirm_play_one' 参数: {
			                		chess: 棋子颜色,
					                state: 游戏状态(-1=>下棋失败, 6=>胜利, 9=>继续下),
					                x: x坐标,
									y: y坐标
								}
			if (游戏结束) 返回 'notify_game_over' 参数:空

	玩家认输:
		发送 'notify_play_defeat' 参数:空
		返回:
			返回 'confirm_play_defeat' 参数:棋子颜色
			返回 'notify_game_over' 参数:空

	玩家失去链接
		发送 'disconnect' 参数:空
		注释: 自动完成, 客户端不需要考虑

}

/* ----- 信息获取 ----- */
function 信息获取()
{
	*房间信息对象结构 {
	    white: '',  // 白方玩家用户名
	    black: '',  // 黑方玩家用户名
	    player: [], // 玩家用户名数组
	    visitor: [], // 观众用户名数组
	    room_number: 0, // 房间号码
	    room_name: roomname, // 房间名字
	    room_id: roomid // 房间id (服务器)
	}

	*玩家信息对象结构 {
	    uname: username,
	    enemyname: '', // 如果有对手
	    roomid: null,
	    chess: 0, 		// 棋子颜色 默认值为0
	    score: 0,		// 玩家分数
	    win: 0, 		// 玩家胜利场数
	    lose: 0,		// 玩家失败场数
	    status: Status.GAME_VISIT // 玩家状态 默认处于VISIT
	}

	获取自己所在房间信息:
		发送 'get_my_room' 参数:空
		返回 'get_my_room' 参数: *房间信息对象结构
		注释: 出现错误返回-1

	获取指定房间信息:
		发送 'get_room_info' 参数:房间ID
		返回 'get_my_room' 参数: *房间信息对象结构
		注释: 出现错误返回-1

	获取自己信息:
		发送 'get_my_info' 参数: 空
		返回 'get_my_info' 参数: *玩家信息对象结构

	获取指定玩家信息:
		发送 'get_player_info' 参数: 玩家用户名
		返回 'get_player_info' 参数: *玩家信息对象结构
		注释: 出现错误返回-1

	获取房间列表:
		发送 'get_room_list' 参数: {
									currentPage: 0,  // 第几页 
									countPerPage: 10 // 每页页数
								}
		返回 'get_room_list' 参数: *房间信息对象结构[] 数组
		注释: 出现错误返回-1

	获取玩家排行榜:
		发送 'get_player_rank' 参数: {
									currentPage: 0,  // 第几页 
									countPerPage: 10 // 每页页数
								}
		返回 'get_player_rank' 参数: {
									name:, // 玩家用户名
									score:, // 玩家分数
									win:, // 玩家胜场
									lose  // 玩家输场
								}

}

/* ----- 通讯 ----- */
function 通讯()
{
	房间内通讯:
		发送 'room_chat_message' 参数: 自定
		返回 'room_chat_message' 参数: 自定(同发送参数)

	公共通讯:
		发送 'chat_message' 参数: 字符串(对象序列化)
		返回 'chat_message' 参数: 字符串(对象序列化)

	获取历史聊天记录:
		发送 'get_chat_history' 参数: {
									currentPage: 0,  // 第几页 
									countPerPage: 10 // 每页页数
								}
		返回 'get_chat_history' 参数: 字符串(对象序列化)[] 数组
}


/* ----- 登录注册 ----- */
function 登录注册()
{
	注册:
		发送 'notify_registr' 参数: {
									username: , // 用户名
									email: ,  	// 邮箱
									vcode: 		// 邮箱验证码
								}
		返回 'confirm_register' 参数: {
									status: ,  // 状态 -1 => username 重复; -2 => mail 重复; 1 =>　注册成功
									sessionid: // 如果注册失败, 该项值为undefined
								}
		注释: 应将sessionid存入本地, 以作每次免登录验证身份, logout操作会刷新


	登录:
		发送 'notify_login' 参数: {
								email: , // 邮箱
								vcode:   // 发到邮箱的验证码
							}
		返回 'confirm_login' 参数: {
								status:, // 登录状态 true => 登录成功; false => 登录失败
								sessionid: // 如果登录失败, 该值为undefined
							}

	注销(退出登录):
		发送 'notify_logout' 参数: sessionid
		返回 'notify_logout'


	验证登录:
		发送 'notify_login_valid' 参数: sessionid
		返回:
			if (验证成功) 返回 'confirm_login_valid' 参数: true
			else 返回 'confirm_login_valid' 参数: false

	发送邮件
		发送 'notify_sendmail' 参数: email
		返回 'confirm_sendmail' 参数: 空
}