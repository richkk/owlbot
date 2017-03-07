var waterfall = require('async/waterfall');
var RoleService = require('./role-service');
var os = require("os");

function InterviewService() {
	// see prototype methods
}

InterviewService.prototype.handle = function(firebase, bot, message) {

	waterfall([
			//Get all Roles in db
			function(callback)
			{
				RoleService.getRoles(firebase, function(err, roles)
				{
					callback(null, roles);
				});
			},
			//Ask user for their role. Let them add new role if not listed.
			function(roles, callback) {
				var askMsg = "Choose the number of your primary role. If need to enter new role then enter 'new'. Press 'Q' to quit." + os.EOL;
				for(i=0; i<roles.length; i++) {
					askMsg += i+1 + ") " + roles[i] + os.EOL;
				}
				bot.startConversation(message, function(err, convo) {
					convo.ask(askMsg, [
						{
							pattern: '^[1-9][0-9]*$',
							callback: function(response, convo) {
								var n = response.text
								if (n <= roles.length) {
									convo.say('Hi ' + roles[n-1]);
									convo.next();
								} else {
									convo.say("Invalid choice " + n + ". Try again or enter 'Q'");
									convo.repeat();
									convo.next();
								}
							}
						},
						{
							pattern: 'new',
							callback: function(response, convo) {
								RoleService.teachNewRole(firebase, bot, message);
								convo.say("bye");
								convo.next();
							}
						},
						{
							pattern: 'q',
							callback: function(response, convo) {
								convo.say("bye");
								// stop the conversation. this will cause it to end with status == 'stopped'
								convo.stop();
							}
						},
						{
							default: true,
							callback: function(response, convo) {
								convo.say("Invalid choice " + response.text + ". Try again or enter 'Q'");
								convo.repeat();
								convo.next();
							}
						}
					]);
				});
			},
		    function(error) {
				if (error) {
					logger.error("Fatal error during getting user role: " + error.message);
					process.exit(1);
				}
			}
	]);

}

module.exports = new InterviewService();
