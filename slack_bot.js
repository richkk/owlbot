var async = require('async');
var bunyan = require('bunyan');
var Botkit = require('botkit');
var Firebase = require('firebase-admin');

var ReactionService = require('./utilities/reaction-service');
var RoleService = require('./services/role-service');
var ShutdownService = require('./services/shutdown-service');
var TootsieRollService = require('./services/tootsie-roll-service');
var TopicService = require('./services/topic-service');
var UptimeService = require('./services/uptime-service');
var InterviewService = require('./services/interview-service');

var logger = bunyan.createLogger({name: "owlbot"});
var bot = null;
var controller = null;

// ****APPLICATION STARTUP****
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

// ****CONTROLLER****

// HELLO
controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    ReactionService.addReaction(bot, message, "robot_face");
    bot.reply(message, 'Hello! I am an OwlBot and I know a lot about Who.');
});

// NEW ROLE
controller.hears(['teach you about a new kind of employee'],
    'direct_message,direct_mention,mention', function(bot, message) {
        RoleService.teachNewRole(Firebase, bot, message);
});

// NEW SKILL
controller.hears(['teach you about a skill'],
    'direct_message,direct_mention,mention', function(bot, message) {
        RoleService.teachSkill(Firebase, bot, message);
});

// NEW LINK
controller.hears(['add a link'], 'direct_message,direct_mention,mention', function(bot, message) {
    TopicService.addLink(Firebase, bot, message);
});

// GET LINKS
controller.hears(['get a link', 'get links', 'need links', 'need some links'],
    'direct_message,direct_mention,mention', function(bot, message) {
        TopicService.getLinks(Firebase, bot, message);
});

// INTERVIEW ME
controller.hears(['interviewtime', 'ime'],'direct_message,direct_mention,mention', function(bot,message) {
    InterviewService.handle(Firebase, bot, message);
});

// SHUTDOWN
controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {
    ShutdownService.handle(bot, message);
});

// UPTIME AND HOST
controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {
        UptimeService.handle(bot, message);
    });

// JOKES
controller.hears(['how many licks', 'tootsie roll'], 
    'direct_message,direct_mention,mention', function(bot, message) {
        TootsieRollService.handle(Firebase, bot, message);
});

// ****STARTUP FUNCTIONS****
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
