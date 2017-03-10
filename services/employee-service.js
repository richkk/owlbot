"use strict";

var async = require('async');
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

EmployeeService.prototype.whoKnows = function(firebase, bot, message) {
	var tokenizedMessage = message.text.match(/(\S+)\s*(who knows about)\s*(\S+)/)[0].split(" ");
	var role = tokenizedMessage[0];
	var skill = tokenizedMessage[tokenizedMessage.length - 1];

	var lookup = function(error, convo) {
		convo.say('Okay, you need a ' + role + ' who knows about ' + skill + '.');
		var dbRef = firebase.database().ref('employees');
		// dbRef.orderByChild('skills').on("child_added", function (snapshot) {
		// 	snapshot.forEach(function (employee) {
		// 		convo.say(employee.key);
		// 		convo.next();
		// 	})
		// });
		dbRef.once("value", function(employees) {
			employees.forEach(function(employee) {
				if (employee.val().roles[role]) {
					var skills = employee.val().skills;
					for (var item in skills) {
						if (skills.hasOwnProperty(item) && skills[item] === skill) {
							convo.say(employee.key + ' knows ' + skill);
							convo.next();
						}
					}
				}
			})
		})
	};

	bot.startConversation(message, lookup);
};

EmployeeService.prototype.findAnEmployee = function (firebase, bot, message) {

	var findEmployee = function(response, convo) {
		var theRole = response.text;
        var foundSome = false;
        convo.say('Okay, I\'ll look for '  + theRole + ' role employees.');
        var dbRef = firebase.database().ref('employees');
        dbRef.once("value", function (snapshot) {
            snapshot.forEach(function(employee) {
                if (employee.val().roles[theRole]) {
                    foundSome = true;
                    convo.say(employee.key + ' is a ' + theRole + '.');
                }
            })
        }).then(function() {
            if (foundSome) {
                convo.say('That\'s all I can find.');
            } else {
                convo.say('I could not find any.');
            }
            convo.next();
        });
	};

	var whatToLookUp = function (error, convo) {
		if (!error) {
			convo.ask('What role do you want to know about?', function (response, convo) {
				findEmployee(response, convo);
			});
		}
	};

	bot.startConversation(message, whatToLookUp);
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
	var skills = [];
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