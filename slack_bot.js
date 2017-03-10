var async = require('async');
var bunyan = require('bunyan');
var Botkit = require('botkit');
var Firebase = require('firebase-admin');

var EmployeeService = require('./services/employee-service');
var ReactionService = require('./utilities/reaction-service');
var RoleService = require('./services/role-service');
var ShutdownService = require('./services/shutdown-service');
var JokeService = require('./services/joke-service');
var TopicService = require('./services/topic-service');
var UptimeService = require('./services/uptime-service');
var InfoTips = require('./utilities/info-tips');
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
controller.hears(['hello', '^hi', '^greetings'], 'direct_message,direct_mention,mention', function(bot, message) {
    ReactionService.addReaction(bot, message, "robot_face");
    bot.reply(message, 'Hello! I am an OwlBot and I know a lot about Who.');
});

controller.hears(['what can you do'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        if (err) {
            logger.error(err.message);
        } else {
            convo.say('Here are some things I can do.');
            convo.say('First of all, I can\'t be in a channel unless I\'m invited. Like a vampire. But don\'t worry, ' +
                'I\'m not a vampire, I\'m a :robot_face:. So use "/invite."');
            for (var tip in InfoTips) {
                if (InfoTips.hasOwnProperty(tip)) {
                    convo.say(InfoTips[tip]);
                    convo.next();
                }
            }
        }

    });
});

// NEW ROLE
controller.hears(['teach you about a kind of employee', 'teach you a new role', 'save a role'],
    'direct_message,direct_mention,mention', function(bot, message) {
        RoleService.teachNewRole(Firebase, bot, message);
});

// NEW SKILL
controller.hears(['teach you about a skill', 'teach you a new skill', 'teach you a skill', 'save a skill'],
    'direct_message,direct_mention,mention', function(bot, message) {
        RoleService.teachSkill(Firebase, bot, message);
});

// NEW LINK
controller.hears(['add a link', 'save a link'], 'direct_message,direct_mention,mention', function(bot, message) {
    TopicService.addLink(Firebase, bot, message);
});

// GET LINKS
controller.hears(['get a link', 'get some links', 'get links', 'need links',
        'need a link', 'need some links', 'get some info'],
    'direct_message,direct_mention,mention', function(bot, message) {
        TopicService.getLinks(Firebase, bot, message);
});

// GET LIST OF TOPICS
controller.hears(['get topics', 'list topics'],
    'direct_message,direct_mention,mention', function(bot, message) {
            TopicService.getTopics(Firebase, bot, message);
});

// INTERVIEW ME
controller.hears(['interview me'],'direct_message,direct_mention,mention', function(bot,message) {
    InterviewService.handle(Firebase, bot, message);
});

// WHO KNOWS ABOUT
controller.hears(['who knows about'], 'direct_message,direct_mention,mention', function(bot, message) {
   EmployeeService.whoKnows(Firebase, bot, message);
});

// FIND EMPLOYEE
controller.hears(['find an employee'], 'direct_message,direct_mention,mention', function(bot, message) {
   EmployeeService.findAnEmployee(Firebase, bot, message);
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
        JokeService.handleTootsieRoll(Firebase, bot, message);
});

controller.hears(['favorite kind of math', 'do you like math', 'favorite subject'],
    'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'I like owlgebra. :school: :mortar_board:');
});

controller.hears(['favorite song', 'favorite kind of music', 'favorite music', 'do you like music'],
    'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, ':microphone: Owl you need is :heart: :notes:');
    });

controller.hears(['favorite kind of book', 'do you like books', 'favorite book'],
    'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'I like hoo-dunnits. :mag: :sleuth_or_spy:');
    });

controller.hears(['tell a joke', 'tell us a joke', 'do you know any jokes',
        'knock knock joke'], 'direct_message,direct_mention,mention',
    function(bot, message) {
        JokeService.knockKnockJoke(bot, message);
});

controller.hears(['do you know any dank memes', 'send me a dank meme', 'what is a dank meme'],
    'direct_message,direct_mention,mention',
    function(bot, message) {
        bot.reply(message, {
            text: "This video will explain: https://www.youtube.com/watch?v=i86FOvnahhA",
            unfurl_media: false
        });
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
