function InfoTips() {
    this.links = 'I can save an informative link about a topic for you or other users. Say "save a link" or "add a link" to save a link. ' +
        'Say "get a link" or "need a link" to ask if I have links saved about a particular topic. ' +
        'Say "get topics" or "list topics" to see a list of topics. ';
    this.teach = 'You can teach me about new kinds of employees and skills. Say "teach you a new role" or "teach you a new skill". ' +
            'Then I\'ll remember them and other users can ask who knows those skills.';
    this.interview = 'If you want I can interview you to find out what role and skills you have. Say "interview me" to start.';
    this.jokes = 'I know a few good jokes. Try asking me about my favorite book or music, or ask me to tell a joke.';
    this.uptime = 'If you say "who are you" I will tell you a little about my server and uptime.';
    this.shutdown = 'You can tell me to "shutdown" but then I will be a :disappointed: :robot_face: and you\'ll need to get one ' +
        'of my human caretakers to restart me.'
}

module.exports = new InfoTips();