var async = require('async');
var bunyan = require('bunyan');
var Botkit = require('botkit');
var Firebase = require('firebase-admin');

var ReactionService = require('./utilities/reaction-service');
var ShutdownService = require('./services/shutdown-service');
var TootsieRollService = require('./services/tootsie-roll-service');
var UptimeService = require('./services/uptime-service');

var logger = bunyan.createLogger({name: "owlbot"});
var bot = null;
var controller = null;

// APPLICATION STARTUP
async.waterfall([
        initializeCredentials,
        initializeFirebase,
        initializeController
    ], function(error) {
        if (error) {
            logger.error("Fatal error during application startup: " + error.message);
            process.exit(1);
        }
        logger.info("Completed startup tasks.");
    }
);

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    ReactionService.addReaction(bot, message, "robot_face");
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello! I am an OwlBot and I know a lot about Who.');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user
            };
        }
        user.name = name;
        controller.storage.users.save(user, function() {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function() {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {
    ShutdownService.handle(bot, message);
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {
        UptimeService.handle(bot, message);
    });

controller.hears(['how many licks', 'tootsie roll'], 
    'direct_message,direct_mention,mention', function(bot, message) {
        TootsieRollService.handle(Firebase, bot, message);
});

function initializeCredentials(callback) {
    if (!process.env.SLACK_TOKEN  || !process.env.FIREBASE_PRIVATE_KEY) {
        // try loading from a .env file since they didn't load automatically
        var env = require('node-env-file');
        env(__dirname + '/.env');
        if(!process.env.SLACK_TOKEN  || !process.env.FIREBASE_PRIVATE_KEY) {
            // still nothing so error out
            logger.error("Missing required environment variables. Check .env file.");
            process.exit(1);
        }
    }
    return callback();
}

function initializeFirebase(callback) {
    Firebase.initializeApp({
        credential: Firebase.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        databaseURL: "https://owlbot-f19f7.firebaseio.com"
    });
    return callback();
}

function initializeController(callback) {
    controller = Botkit.slackbot({
        debug: true
    });

    bot = controller.spawn({
        token: process.env.SLACK_TOKEN
    }).startRTM();
    return callback();
}
