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
	var roleSkills;
	var userName;
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

			//if User indicated an existing role, then let's get the skills associated to that role.
			//If no role specified, break from waterfall. If new role then skip getting skills since n/a.
			function (roleSelected, isNewRole, callback) {
				role = roleSelected;
				if (role != null)
				{
					if (!isNewRole) {
						RoleService.getSkills(role, firebase, function(err, skills)	{
							callback(null, skills);
						});
					} else {
						callback(null, []); //no skills
					}
				} else {
					callback('break')
				}
			},

			//Let's ask user what skills they have. Let them add new ones not in db.
			function (skills, callback) {
				roleSkills = skills;
				getUsersSkills(roleSkills, firebase, bot, message, function(err, userSkills) {
					callback(null, userSkills);
				});
			},

			//if User indicated skills, then add user to employee and add their role and skills
			function (userSkills, callback) {
				if (userSkills != null && userSkills.length > 0)
				{
					EmployeeService.addEmployeeAndRoleAndSkills(userName, role, userSkills, firebase, function (err)
					{
						callback(null, userSkills);
					});
				} else {  //no skills specified, save nothing
					callback('break')
				}
			},

			//Tell user their role was added and add role and skills (if new) to roles db
		    function (userSkills, callback) {
				bot.reply(message, "Added you to employee db with user name " + userName + " and role " + role + " and skills specified.");

				//Now add new role and skills to roles db
				for (var i = 0; i < userSkills.length; i++) {
					var found = false;
					for (var j = 0; j < roleSkills.length; j++) {
						if (userSkills[i] == roleSkills[j]) {
							found = true;
						}
					}
					if (!found) {
						RoleService.addRoleAndSkill(role, userSkills[i], firebase);
					}
				}
			}

	], function (err)
	{
		if (err) {
			if (err != 'break')	{
				logger.error("Fatal error during getting user role: " + err);
			}
			else {
				err = null;
			}
		}
		callback(err);
	});
}

var getUsersRole = function (roles, firebase, bot, message, callback) {
	var askMsg = buildAskRoleMsg(roles);
	bot.startConversation(message, function(err, convo) {
		convo.ask(askMsg, [
			{
				pattern: '^[1-9][0-9]*$',
				callback: function(response, convo) {
					var n = response.text
					if (n <= roles.length) {
						callback(null, roles[n-1], false );
						convo.stop();
					} else {
						convo.say("Invalid choice " + n + ". Try again or enter 'quit'");
						convo.repeat();
						convo.next();
					}
				}
			},
			{
				pattern: '^quit',
				callback: function(response, convo) {
					callback(null, null, false );
					convo.stop();
				}
			},
			{
				default: true,
				callback: function(response, convo) {
					//User entered new role, so use it.
					callback(null, response.text.toLowerCase(), true); //Indicate new role
					convo.stop();
				}
			}
		]);
	});
}

var getUsersSkills = function (roleSkills, firebase, bot, message, callback) {
	var userSkills = [];
	var askSkillsMsg = buildAskSkillsMsg(roleSkills);
	bot.startConversation(message, function (err, convo)
	{
		convo.ask(askSkillsMsg, [
			{
				pattern: '^[1-9][0-9]*$',
				callback: function (response, convo)
				{
					var n = response.text
					if (n <= roleSkills.length) {
						userSkills.push(roleSkills[n - 1]);
					} else {
						convo.say("Invalid choice " + n + ". Try again or enter 'quit'");
					}
					convo.repeat();
					convo.next();
				}
			},
			{
				pattern: '^quit',
				callback: function (response, convo)
				{
					callback(null, userSkills);
					convo.stop();
				}
			},
			{
				default: true,
				callback: function (response, convo)
				{
					//User entered new role, so add to user's skill set
					userSkills.push(response.text);
					convo.repeat();
					convo.next();
				}
			}
		]);
	});
}

function buildAskRoleMsg(roles)
{
	var askMsg = "Choose the number of your primary role:" + os.EOL;
	for(var i=0; i< roles.length; i++) {
		askMsg += i+1 + ") " + roles[i] + os.EOL;
	}
	askMsg += " OR enter a new role if you don't see yours." + os.EOL;
	askMsg += " OR enter 'quit' if you want to quit the interview without saving."
	return askMsg;
}

function buildAskSkillsMsg(skills) {
	var askMsg;
	if (skills != null && skills.length > 0)
	{
		askMsg = "Choose the number of your skill:" + os.EOL;
		for (var i = 0; i < skills.length; i++)
		{
			askMsg += i + 1 + ") " + skills[i] + os.EOL;
		}
		askMsg += " OR enter a new skill if you don't see yours." + os.EOL;
	} else {
		askMsg = "Enter a skill associated with your role." + os.EOL;
	}
	askMsg += " OR enter 'quit' if you are done entering your skills set."
	return askMsg;
}

module.exports = new InterviewService();
