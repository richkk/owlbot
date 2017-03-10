"use strict";

var waterfall = require('async/waterfall');
var os = require("os");

function TopicService() {
    // see prototype functions
}

TopicService.prototype.addLink = function(firebase, bot, message) {
    var askLink = function (response, convo) {
        var topic = response.text;
        convo.say('Okay, a new link about ' + topic + '.');
        convo.ask('What is the link?', function(response, convo) {
            var dbRef = firebase.database().ref('topics/' + topic + '/links');
            dbRef.push(response.text.toLowerCase());
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
        var dbRef = firebase.database().ref('topics/' + response.text.toLowerCase() + '/links');
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

TopicService.prototype.getTopics = function(firebase, bot, message) {
    waterfall([
        //Get all Topics in db
        function (callback)
        {
            getTopicsFromDb(firebase, function(err, topics)	{
                callback(null, topics);
            });
        },
        //List topics in channel
        function (topics, callback){
            bot.reply(message, buildTopicsListMsg(topics));
        }
    ], function (err) {
        if (err) {
            logger.error("Fatal error during get topics: " + err);
        }
    });
}

function getTopicsFromDb(firebase, callback) {
    var topics = [];
    var dbRef = firebase.database().ref("topics").orderByKey();
    dbRef.once("value").then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            topics.push(childSnapshot.key)
        })
        return callback(null, topics);
    });
}

function buildTopicsListMsg(topics) {
    var msg = "Here are the Topics we have:" + os.EOL;
    for(var i=1; i<= topics.length; i++) {
        msg += " " + i + ") " + topics[i-1] + os.EOL;
    }
    return msg;
}

module.exports = new TopicService();