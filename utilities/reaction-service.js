function ReactionService() {
    //see prototype methods
}

ReactionService.prototype.addReaction = function (bot, message, reaction) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: reaction
    }, function(err) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });
};

module.exports = new ReactionService();