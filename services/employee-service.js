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

EmployeeService.prototype.addEmployeeAndRoleAndSkills = function (employeeName, role, skills, firebase, done)
{
	logger.info("Adding employee " + employeeName + " with role " + role);
	waterfall([
	    //Add role for employee
		function (callback)
		{
			addEmployeeRole(employeeName, role, firebase, callback);
		},

		//Get employees's current skills so that we do not add duplicates
		function (callback) {
			getEmployeeSkills(employeeName, firebase, callback);
		},

		//Add new skills for employee
		function (currentSkills, callback)
		{
			var newSkills = []
			for (var i = 0; i < skills.length; i++) {
				var found = false;
				for (var j = 0; j < currentSkills.length; j++) {
					if (skills[i] == currentSkills[j]) {
						found = true;
					}
				}
				if (!found) {
					newSkills.push(skills[i]);
				}
			}
			if (newSkills.length > 0) {
				addEmployeeSkills(employeeName, newSkills, firebase, callback);
			}
		}
	], function(err, data1, data2) {
		if (err)
		{
			logger.error("Fatal error during addEmployeeAndRoleAndSkills: " + err);
		}
		done(null);
	});
};

var addEmployeeRole = function(employeeName, role, firebase, callback) {
	var dbRef = firebase.database().ref('employees/' + employeeName + '/roles');
	dbRef.child(role).set('true');
	logger.info("Added employee " + employeeName + " with role " + role);
	callback(null);
};

var addEmployeeSkills = function(employeeName, skills, firebase, callback) {
	var dbRef = firebase.database().ref('employees/' + employeeName);
	for (var i = 0; i < skills.length; i++)
	{
		dbRef.child('skills').push(skills[i]);
		logger.info("Added employee " + employeeName + " with skill " + skills[i]);
	}
	callback(null);
};

function getEmployeeSkills(employeeName, firebase, callback) {
	var skills = []
	var dbRef = firebase.database().ref('employees/' + employeeName + '/skills');
	dbRef.once("value", function(snapshot) {
		if (snapshot.val()) {
			snapshot.forEach(function(childSnapshot) {
				skills.push(childSnapshot.val())
			})
		}
		callback(null, skills);
	});
}

module.exports = new EmployeeService();