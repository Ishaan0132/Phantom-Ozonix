"use strict";

const http = require("https");

function getUserInfo(userid) {
    let link = 'https://pokemonshowdown.com/users/' + userid + '.json';
    return new Promise((resolve, reject) => {
        http.get(link, res => {
            var data = '';
            res.on('data', function(part) {
                data += part;
            });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        });
    });
}

exports.commands = {
    regdate: function(target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
      if (!target || target.length > 18) return this.say("Please enter a valid username");

        getUserInfo(target).then(data => {
            if (data.registertime === 0) return this.say("This alt is not registered.");
            
            let date = Tools.getEST(data.registertime * 1000);
            
            this.say("The userid '" + target + "' was registered on " + date + ".");
        });
    },
    
    regtime: function (target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
        
        getUserInfo(target).then(data => {
            if (data.registertime === 0) return this.say("This alt is not registered.");
            
            let time = new Date(Tools.getEST(data.registertime * 1000)).getTime();
            
            this.say("The userid '" + target + "' was registered " + Tools.getTimeAgo(time) + " ago.");
        });
    },
    
    rank: function (target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
        
        getUserInfo(target).then(data => {
            let ratings = data.ratings;
            let buffer = Object.keys(ratings).map(tier => `\`\`${tier}\`\` ${Math.round(ratings[tier].elo)} / ${ratings[tier].gxe}`);
            
            if (!buffer.length) return this.say(`The user '${target}' has not played any ladder games yet.`);
            this.say(`Ladder ratings for '${target}': ` + buffer.join(" | "));
        });
    },
};
