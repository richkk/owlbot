function TopicService() {
    // see prototype functions
}

TopicService.prototype.addLink = function(firebase, bot, message) {
    var askLink = function (response, convo) {
        var topic = response.text;
        convo.say('Okay, a new link about ' + topic + '.');
        convo.ask('What is the link?', function(response, convo) {
            var dbRef = firebase.database().ref('topics/' + topic + '/links');
            dbRef.push(response.text);
            convo.say(':bulb: Okay, I\'ll remember that link about ' + topic + '!');
            convo.next();
        });
    };
    
    var askTopic = function (error, convo) {
        if (!error) {
            convo.ask('What is the link about?', function (response, convo) {
                askLink(response, convo);
                convo.next();
            });
        }
    };

    bot.startConversation(message, askTopic);
};

TopicService.prototype.getLinks = function (firebase, bot, message) {
    var sendLinks = function(response, convo) {
        convo.say('I\'ll see if I have any links . . . ');
        var dbRef = firebase.database().ref('topics/' + response.text + '/links');
        dbRef.once('value', function(data) {
            if (data.val()) {
                data.forEach(function(link) {
                    convo.say(link.val());
                });
            } else {
                convo.say('Sorry, I don\'t know any links about that.')
            }
        }).then(function () {
            convo.next();
        })
    };

    var askTopic = function (error, convo) {
        if (!error) {
            convo.ask('What do you need info about?', function (response, convo) {
                convo.say('Okay, you want to know about ' + response.text + '.');
                sendLinks(response, convo);
                convo.next();
            });
        }
    };

    bot.startConversation(message, askTopic);
};

module.exports = new TopicService();