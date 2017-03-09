"use strict";

var waterfall = require('async/waterfall');
var RoleService = require('./role-service');
var EmployeeService = require('./employee-service');
var os = require("os");
var bunyan = require('bunyan');

var logger = bunyan.createLogger({name: "InterviewService"});

function InterviewService() {
	// see prototype methods
}

InterviewService.prototype.handle = function(firebase, bot, message) {
	var role;
	var userName;
	var isNewRole;
	waterfall([
			//Get user name from user id stored in message
			function (callback) {
				EmployeeService.getUserName(message.user, bot, callback)
			},
			//Get all Roles in db
			function (username, callback)
			{
				userName = username;
				RoleService.getRoles(firebase, function(err, roles)	{
					callback(null, roles);
				});
			},
			//Ask user for their role. Let them add new role if not listed.
			function ( roles, callback) {
				getUsersRole(roles, firebase, bot, message, function(err, role, isNewRole) {
					callback(null, role, isNewRole);
				});
			},
			//if User indicated a role, then add user to employee and add their role
			function (role, isNewRole, callback) {
				if (role != null)
				{
					logger.info("User " + userName + " chose role " + role + " which is new role:" + isNewRole);
					EmployeeService.addEmployeeAndRole(userName, role, firebase, function (err)
					{
						callback(null, role, isNewRole);
					});
				}
			},
			//Tell user their role was added
		    function (role, isNewRole, callback) {
				bot.reply(message, "Added employee " + userName + " with role " + role);
				if (isNewRole) {
					RoleService.addRole(role, firebase);
				}
			} //,
			//function(role, isNewRole, callback) {
			//	if (isNewRole) {
			//		RoleService.addRole(role);
			//	}
			//}

	],  function (err) { // the "complete" callback of `async.waterfall`
		if ( err ) {
			logger.error("Fatal error during getting user role: " + err);
		}
		callback(err);
	});
}

var getUsersRole = function (roles, firebase, bot, message, callback) {
	var role;
	var askMsg = "Choose the number of your primary role:" + os.EOL;
	for(var i=0; i< roles.length; i++) {
		askMsg += i+1 + ") " + roles[i] + os.EOL;
	}
	askMsg += " OR enter a new role if you don't see yours." + os.EOL;
	askMsg += " OR enter 'quit' if you want to quit the interview without saving."
	bot.startConversation(message, function(err, convo) {
		convo.ask(askMsg, [
			{
				pattern: '^[1-9][0-9]*$',
				callback: function(response, convo) {
					var n = response.text
					if (n <= roles.length) {
						role =  roles[n-1];
						callback(null, role, false );
						convo.stop();
					} else {
						convo.say("Invalid choice " + n + ". Try again or enter 'quit'");
						convo.repeat();
						convo.next();
					}
				}
			},
			//{
			//	pattern: 'new',
			//	callback: function(response, convo) {
			//		convo.stop();
			//		RoleService.teachNewRole(firebase, bot, message);
			//	}
			//},
			{
				pattern: '^quit',
				callback: function(response, convo) {
					callback(null, role, false );
					convo.stop();
				}
			},
			{
				default: true,
				callback: function(response, convo) {
					//User entered new role, so use it. TODO would be to verify w/user if they really meant to
					role =  response.text.toLowerCase();
					callback(null, role, true); //Indicate new role so we add it to Roles
					convo.stop();
				}
			}
		]);
	});
}

module.exports = new InterviewService();
