"use strict";

var waterfall = require('async/waterfall');
var bunyan = require('bunyan');

var logger = bunyan.createLogger({name: "EmployeeService"});

function EmployeeService() {
	// see prototype methods
}

EmployeeService.prototype.getUserName = function(userId, bot, callback) {
	bot.api.users.info({user: userId}, function (error, response) {
		callback(null, response.user.name);
	});
};

EmployeeService.prototype.addEmployeeAndRole = function (employeeName, role, firebase, callback)
{
	logger.info("Adding employee " + employeeName + " with role " + role);
	addEmployee(employeeName, role, firebase, function ()
	{
		callback(null);
	});
};

//EmployeeService.prototype.getEmployee = function(employeeName, firebase, callback) {
//	var dbRef = firebase.database().ref("employees/"+ employeeName);
//	dbRef.once("value", function(snapshot) {
//		callback(null, snapshot.val());
//	});
//};

//var getEmployee = function(employeeName, firebase, callback) {
//	var dbRef = firebase.database().ref("employees/"+ employeeName);
//	dbRef.once("value", function(snapshot) {
//		console.log("Snapshot of employee " + snapshot.val());
//		callback(null, snapshot.val());
//	});
//};

var addEmployee = function(employeeName, role, firebase, callback) {
	var dbRef = firebase.database().ref('employees/' + employeeName + '/roles');
	dbRef.child(role).set('true');
	callback(null);
};


module.exports = new EmployeeService();