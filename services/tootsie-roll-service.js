function TootsieRollService() {
    // see prototype methods
}

TootsieRollService.prototype.handle = function (firebase, bot, message) {
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

module.exports = new TootsieRollService();