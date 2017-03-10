"use strict";

var roleService = require('./role-service');
var async = require('async');
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
    async.waterfall([
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

EmployeeService.prototype.getEmployee = function (firebase, bot, message) {
    var getEmployee = function(response, convo) {
        var userName = response.text;
        var dbEmployeeRef = firebase.database().ref("employees/" + userName);
        dbEmployeeRef.once('value', function(snapshot) {
            if (snapshot.val()) {
                convo.say("We do have an employee with the user name " + snapshot.key);
                getEmployeeRoles(firebase, userName);
                convo.next();
            } else {
                convo.say('Sorry, I don\'t know any employees by that username.');
                convo.next();
            }
        })
    };

    var whoToLookUp = function (error, convo) {
        if (!error) {
            convo.ask('Who do you want to know about?', function (response, convo) {
                getEmployee(response, convo);
                convo.next();
            });
        }
    };

    bot.startConversation(message, whoToLookUp);
};

EmployeeService.prototype.findAnEmployee = function (firebase, bot, message) {
    var findEmployee = function(response, convo) {
        var theRole = response.text;
        var theEmployees = [];

        async.waterfall([
            function(callback) {
                getEmployees(firebase, callback);
            },
            function(employees, callback) {
                theEmployees = employees;

                // loop through employees and get roles
                async.eachSeries(theEmployees, function(employee, innerCallback) {
                    getEmployeeRoles(firebase, employee, function(err, results) {
                        if (err) {
                            return innerCallback(err);
                        }
                        // loop through employee roles
                        for (var x = 0; x < results.length; x++) {
                            // if it is the role i'm looking for, return the employee with role
                            if (theRole == results[x]) {
                                return callback(null, employee);
                            }
                        }
                        innerCallback(null);
                    });
                },callback);
            }
        ], function (err, employee) {
            if (err) {
                console.log("something went wrong");
            }

            bot.startConversation(message, function(err, convo) {
                convo.say(employee + " knows a lot about " + theRole);
            });
        });
    };

    var whatToLookUp = function (error, convo) {
        if (!error) {
            convo.ask('What role do you want to know about?', function (response, convo) {
                findEmployee(response, convo);
                convo.next();
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
};

function getEmployeeRoles (firebase, userName, done) {
    var roles = [];
    var dbRef = firebase.database().ref("employees/" + userName + "/roles");
    dbRef.once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            roles.push(childSnapshot.key);
        });
        done(null, roles);
    });
};

function getEmployees (firebase, done) {
    var employees = [];
    var dbRef = firebase.database().ref("employees").orderByKey();
    dbRef.once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            employees.push(childSnapshot.key)
        });
        done(null, employees);
    });
};

module.exports = new EmployeeService();