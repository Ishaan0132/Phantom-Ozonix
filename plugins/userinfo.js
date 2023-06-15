/**
 * User Info
 * Phantom Ozonix - https://github.com/Ishaan0132/Phantom-Ozonix
 *
 * Fetches User information
 *
 * Base Code Credits : Sparky Child
 *
 * @license MIT license
 */

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
 function getEST(date) {
    function isDst(tarDate) {
        let deezNuts = new Date(tarDate);
        let deezMonth = deezNuts.getMonth() + 1;
        let deezDay = deezNuts.getDate() + 1;
        let deezDayofWeek = deezNuts.getDay();
        if (deezMonth > 11 || deezMonth < 3) {
            return false;
        }
        if (deezMonth === 3) {
            if (deezDay - deezDayofWeek > 7) {
                return true;
            }
            return false;
        }
        if (deezMonth === 11) {
            if (deezDay - deezDayofWeek > 0) {
                return true
            }
            return false;
        }
        return true;
    }
    let d = (date ? date : Date.now()) + (new Date().getTimezoneOffset() * 60 * 1000) - (1000 * 60 * 60 * 5);
    if (isDst(d)) d += 3600000;
    return new Date(d).toLocaleString();
}
  
 function getTimeAgo(time) {
        time = ~~((Date.now() - time) / 1000);

        let seconds = time % 60;
        let times = [];
        if (seconds) times.push(seconds + (seconds === 1 ? ' second' : ' seconds'));
        if (time >= 60) {
            time = ~~((time - seconds) / 60);
            let minutes = time % 60;
            if (minutes) times.unshift(minutes + (minutes === 1 ? ' minute' : ' minutes'));
            if (time >= 60) {
                time = ~~((time - minutes) / 60);
                let hours = time % 24;
                if (hours) times.unshift(hours + (hours === 1 ? ' hour' : ' hours'));
                if (time >= 24) {
                    time = ~~((time - hours) / 24);
                    let days = time % 365;
                    if (days) times.unshift(days + (days === 1 ? ' day' : ' days'));
                    if (time >= 365) {
                        let years = ~~((time - days) / 365);
                        if (days) times.unshift(years + (years === 1 ? ' year' : ' years'));
                    }
                }
            }
        }
        if (!times.length) return '0 seconds';
        return times.join(', ');
    }

exports.commands = {
    regdate: {
        command(target, room, user) {
        if (!room instanceof Users.User && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
      if (!target || target.length > 18) return this.say("Please enter a valid username");

        getUserInfo(target).then(data => {
            if (data.registertime === 0) return this.say("This alt is not registered.");
            
            let date = getEST(data.registertime * 1000);
            
            this.say("The userid '" + target + "' was registered on " + date + ".");
        });
        },
    },
    
    regtime: {
        command(target, room, user) {
        if (!room instanceof Users.User && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
        
        getUserInfo(target).then(data => {
            if (data.registertime === 0) return this.say("This alt is not registered.");
            
            let time = new Date(getEST(data.registertime * 1000)).getTime();
            
            this.say("The userid '" + target + "' was registered " + getTimeAgo(time) + " ago.");
        });
        },
    },
    
    rank: {
        command(target, room, user) {
       if (!room instanceof Users.User && !user.hasRank(room, '+')) return;
        
        target = Tools.toId(target) || user.userid;
        
        getUserInfo(target).then(data => {
            let ratings = data.ratings;
            let buffer = Object.keys(ratings).map(tier => `\`\`${tier}\`\` ${Math.round(ratings[tier].elo)} / ${ratings[tier].gxe}`);
            
            if (!buffer.length) return this.say(`The user '${target}' has not played any ladder games yet.`);
            this.say(`Ladder ratings for '${target}': ` + buffer.join(" | "));
        });
        },
    },
};
