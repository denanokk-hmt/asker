'use strict'

const LOGDIR = './logs-hmt';	//log dir

var dateformat = require('dateformat');
var fs = require('fs');
var util = require('util');
var FileStreamRotator = require('file-stream-rotator');
 
//Make console log dir 
fs.existsSync(LOGDIR) || fs.mkdirSync(LOGDIR)

/*******************************
 * ACCESS LOG for morgan
 * Args
 * !!!TZ is UTC!!! UTC+9hours=JST
*******************************/
var accessLog = function () {
	//Overwrite console log
	var accessLogStream = FileStreamRotator.getStream({
		filename: LOGDIR + '/%DATE%_access.log',
		frequency: 'daily',
		verbose: false,
		date_format: "YYYYMMDD"
	});
	return accessLogStream;
};
module.exports.access = accessLog;

/*******************************
 * SYSTEM LOG
 * Args
 * prefix:[text] プレフィックス　INFO、etc
 * 	str:[string] ログ文言	
 * 	stdoutFlag:[boolean] true:画面出力をする
 * 	writeingFlag:[boolean] true:logファイルに書き込む
 *  date:[date] 省略可能
********************************/
var systemLog = function (prefix, str, stdoutFlag, writingFlag, date) {
	//date
	if (!date) {
		var date = dateformat(new Date(), 'yyyymmdd-HH:MM:ss:l');
	}
	//Message
	var msg = `${prefix}|${date}|${str}`;	
	//Logging
	if (stdoutFlag == true) {
		console.log(msg);
	}
	//Overwrite console log
	if (writingFlag == true) {
		var systemLogStream = FileStreamRotator.getStream({
			filename: LOGDIR + '/%DATE%_system.log',
			frequency: 'daily',
			verbose: false,
			date_format: "YYYYMMDD"
		});
		systemLogStream.write(util.format(msg) + '\n');
	}
};
module.exports.system = systemLog;

/*******************************
 * SYSTEM LOG
 * Args
 * 	str:[JSONArray] ログ文言	
 * 	stdoutFlag:[boolean] true:画面出力をする
 * 	writeingFlag:[boolean] true:logファイルに書き込む
 *  date:[date] 省略可能
********************************/
var JSONArrayLog = function (str, stdoutFlag, writingFlag, date) {
	//date
	if (!date) {
		var date = dateformat(new Date(), 'yyyymmdd-HH:MM:ss:l');
	}
	//Message
	var msg = '[INFO]|' + date + '|' + JSON.stringify(str, null, '\t');
	//Logging
	if (stdoutFlag == true) {
		console.log(msg);
	}
	//Overwrite console log
	if (writingFlag == true) {
		var systemLogStream = FileStreamRotator.getStream({
			filename: LOGDIR + '/%DATE%_system.log',
			frequency: 'daily',
			verbose: false,
			date_format: "YYYYMMDD"
		});
		systemLogStream.write(util.format(msg) + '\n');
	}
};
module.exports.systemJSON = JSONArrayLog;

/*******************************
 * ERROR LOG
 * Args
 * 	str:[string] ログ文言	
 * 	stdoutFlag:[boolean] true:画面出力をする
 * 	writeingFlag:[boolean] true:logファイルに書き込む
 *  date:[date] 省略可能
********************************/
var errorLog = function (str, stdoutFlag, writingFlag, date) {
	//date
	if (!date) {
		var date = dateformat(new Date(), 'yyyymmdd-HH:MM:ss:l');
	}
	//Message
	var msg = '[ERROR]|' + date + '|' + JSON.stringify(str, null, '\t');
	//Logging
	if (stdoutFlag == true) {
		console.error(msg);
	}
	//Overwrite console log
	if (writingFlag == true) {
		var errorLogStream = FileStreamRotator.getStream({
			filename: LOGDIR + '/%DATE%_error.log',
			frequency: 'daily',
			verbose: false,
			date_format: "YYYYMMDD"
		});
		errorLogStream.write(util.format(msg) + '\n');
	}
};
module.exports.error = errorLog;

/*******************************
 * APPLICATION LOG
********************************/
const appliLog = function (prefix, logiD, value, date) {
	//date
	const dt = (!date)? dateformat(new Date(), 'yyyymmdd-HH:MM:ss:l') : date
	//Message
	const msg = `[APPLI]|${logiD}|${dt}|${JSON.stringify(value, null, '\t')}`;
	//logout
	console.error(`=====${prefix} | ${msg}`)
};
module.exports.appli = appliLog;