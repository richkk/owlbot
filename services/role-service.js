function RoleService() {
    // See prototype methods
}

RoleService.prototype.teachNewRole = function (firebase, bot, message) {

    var askSkill = function (response, convo) {
        var roleToAdd = response.text;
        convo.ask("What is something " + roleToAdd + " employees know about?", function(response, convo) {
            var dbRef = firebase.database().ref("roles/" + roleToAdd);
            dbRef.child('skills').push(response.text);
            convo.say(':bulb: Okay, I\'ll remember that ' + roleToAdd + ' employees know about ' + response.text + '.');
            convo.say('Thanks for the new information!');
            convo.next();
        });
    };

    var askRole = function (error, convo) {
        if (!error) {
            convo.ask('What is the new kind of employee role?', function (response, convo) {
                var dbRef = firebase.database().ref("roles/" + response.text);
                dbRef.once("value", function(data) {
                    if (data.val()) {
                        convo.say('Thanks but I already know about the ' + response.text + ' role.');
                        convo.next();
                    } else {
                        convo.say(':thinking_face: Okay, I don\'t know about ' + response.text + ' employees yet.');
                        askSkill(response, convo);
                        convo.next();
                    }
                });
            });
        }
    };

    bot.startConversation(message, askRole);
};

RoleService.prototype.teachSkill = function(firebase, bot, message) {
    var askSkill = function (response, convo) {
        var roleToUpdate = response.text;
        convo.ask("What is a skill " + roleToUpdate + " employees know about?", function(response, convo) {
            var dbRef = firebase.database().ref("roles/" + roleToUpdate);
            dbRef.child('skills').once("value", function(data) {
                var inDb = data.forEach(function(skill) {
                    if (skill.val() === response.text) {
                        convo.say("Thanks, but I already knew that.");
                        convo.next();
                        return true;
                    }
                });
                if (!inDb) {
                    dbRef.child('skills').push(response.text);
                    convo.say(':bulb: Okay, I\'ll remember that ' + roleToUpdate + ' employees know about ' + response.text + '.');
                    convo.next();
                }
            });
            convo.next();
        });
    };

    var askRole = function (error, convo) {
        if (!error) {
            convo.ask('What employee role knows about the skill?', function (response, convo) {
                var dbRef = firebase.database().ref("roles/" + response.text);
                dbRef.once("value", function(data) {
                    if (data.val()) {
                        convo.say('Okay, let\'s talk about ' + response.text + ' employees.');
                        askSkill(response, convo);
                        convo.next();
                    } else {
                        convo.say(':frowning: I don\'t know about the ' + response.text + ' role.');
                        convo.say('Please teach me about that first.');
                        convo.next();
                    }
                });
            });
        }
    };

    bot.startConversation(message, askRole);
};

module.exports = new RoleService();