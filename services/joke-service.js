function JokeService() {
    // see prototype methods
}

JokeService.prototype.handleTootsieRoll = function (firebase, bot, message) {
    var dbRef = firebase.database().ref("tootsieCounter");
    dbRef.transaction(function(currentCount) {
        return (currentCount || 0) + 1;
    }).then(function (result) {
        var newCount = result.snapshot.val();
        bot.reply(message,
            ':robot_face: I have been asked about licks, tootsies and so forth ' + newCount +
            ' times and I am still not amused. :-1:');
    });
};

JokeService.prototype.knockKnockJoke = function(bot, message) {
    var owls = function(response, convo) {
      convo.ask('Owls', function (response, convo) {
          if (response.text.toLowerCase().indexOf('owls who') > -1) {
              convo.say('That\'s right! Owls HOO! :laughing:');
              convo.next();
          } else {
              convo.say('You\'re supposed to say "Owls who?"');
              owls(response, convo);
              convo.next();
          }
      })
    };

    var knockKnock = function (error, convo) {
        convo.ask(':fist: Knock knock.', function (response, convo) {
            if (response.text.toLowerCase().indexOf('who\'s there') > -1) {
                owls(response, convo);
                convo.next();
            } else {
                convo.say('You\'re supposed to say "Who\'s there?"!');
                knockKnock(null, convo);
                convo.next();
            }
        })
    };

    bot.startConversation(message, knockKnock);
};

module.exports = new JokeService();