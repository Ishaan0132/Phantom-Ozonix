/**
 * Commands
 * Phantom Ozonix - https://github.com/PowerHitter0418/Phantom-Ozonix
 *
 * This file contains the base commands for Phantom Ozonix.
 *
 * @license MIT license
 */

 /**var request = require("request");

         let data;**/


'use strict';

// Users who use the settour command when a tournament is already
// scheduled will be added here and prompted to reuse the command.
// This prevents accidentally overwriting a scheduled tournament.
/**@type {Map<string, string>} */
let overwriteWarnings = new Map();

/**@type {{[k: string]: Command | string}} */
let commands = {
	// Developer commands
	js: 'eval',
	eval: function (target, room, user) {
		if (!user.isDeveloper()) return;
		try {
			target = eval(target);
			this.say(JSON.stringify(target));
		} catch (e) {
			this.say(e.name + ": " + e.message);
		}
	},
	custom: 'c',
	c: function (target, room, user) {
		if (!user.isDeveloper() || !target) return;
		this.say(target);
	},
	uptime: function (target, room, user, pm) {
		let uptime = process.uptime();
		let uptimeText;
		if (uptime > 24 * 60 * 60) {
			let uptimeDays = Math.floor(uptime / (24 * 60 * 60));
			uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
			let uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
			if (uptimeHours) uptimeText += ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
		} else {
			uptimeText = Tools.toDurationString(uptime * 1000);
		}
		this.say("Uptime: **" + uptimeText + "**");
	},
	kill: function (target, room, user) {
    if (!user.isDeveloper()) return false;
	  console.log('Killed by ' + user.name);
	  process.exit(-1);
        },
	jr: 'joinroom',
        joinroom: function (target, room, user, pm) {
		if (!user.isDeveloper()) return false;
		if (!target) return this.say("Usage: " + Config.commandCharacter + "joinroom [room]");
		this.say("/join " + target);
	},
        lr: 'leaveroom',
        leaveroom: function (target, room, user, pm) {
		if (!user.isDeveloper()) return false;
                if (!target) return this.say("Usage: " + Config.commandCharacter + "leaveroom [room]");
		this.say("/leave " + target);
	},

	// General commands
	about: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say(Config.username + " code by A Flying Phantom: https://github.com/PowerHitter0418/Phantom-Ozonix");
	},
	guide: 'help',
	help: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (!Config.guide) return this.say("There is no guide available.");
		this.say(Users.self.name + " guide: " + Config.guide);
	},
	choose: 'pick',
	pick: function (target, room, user, pm) {
		if (target.length < 3 || !~target.indexOf(',')) return this.say("You must give at least 2 valid choices", room);
		let targets = target.split(',');
		let pick = targets[Math.floor(Math.random() * targets.length)];
		this.say("Random pick: " + pick);
	},
	mail: function (target, room, user) {
		if (!(room instanceof Users.User) || !Config.allowMail) return;
		let targets = target.split(',');
		if (targets.length < 2) return this.say("Please use the following format: .mail user, message");
		let to = Tools.toId(targets[0]);
		if (!to || to.length > 18 || to === Users.self.id || to.startsWith('guest')) return this.say("Please enter a valid username");
		let message = targets.slice(1).join(',').trim();
		let id = Tools.toId(message);
		if (!id) return this.say("Please include a message to send.");
		if (message.length > (258 - user.name.length)) return this.say("Your message is too long.");
		let database = Storage.getDatabase('global');
		if (to in database.mail) {
			let queued = 0;
			for (let i = 0, len = database.mail[to].length; i < len; i++) {
				if (Tools.toId(database.mail[to][i].from) === user.id) queued++;
			}
			if (queued >= 3) return this.say("You have too many messages queued for " + Users.add(targets[0]).name + ".");
		} else {
			database.mail[to] = [];
		}
		database.mail[to].push({time: Date.now(), from: user.name, text: message});
		Storage.exportDatabase('global');
		this.say("Your message has been sent to " + Users.add(targets[0]).name + "!");
	},

	// Game commands
	signups: 'creategame',
	creategame: function (target, room, user) {
		if (room instanceof Users.User) return;
		if (!user.hasRank(room, '+')) return;
		if (!Config.games || !Config.games.includes(room.id)) return this.say("Games are not enabled for this room.");
		let format = Games.getFormat(target);
		if (!format || format.inheritOnly) return this.say("The game '" + target + "' was not found.");
		if (format.internal) return this.say(format.name + " cannot be started manually.");
		Games.createGame(format, room);
		if (!room.game) return;
		room.game.signups();
	},
	start: 'startgame',
	startgame: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (room.game) room.game.start();
	},
	cap: 'capgame',
	capgame: function (target, room, user) {
		if (room instanceof Users.User || !room.game || !user.hasRank(room, '+')) return;
		let cap = parseInt(target);
		if (isNaN(cap)) return this.say("Please enter a valid player cap.");
		if (cap < room.game.minPlayers) return this.say(room.game.name + " must have at least " + room.game.minPlayers + " players.");
		if (room.game.maxPlayers && cap > room.game.maxPlayers) return this.say(room.game.name + " cannot have more than " + room.game.maxPlayers + " players.");
		room.game.playerCap = cap;
		this.say("The game will automatically start at **" + cap + "** players!");
	},
	end: 'endgame',
	endgame: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (room.game) room.game.forceEnd();
	},
	join: 'joingame',
	joingame: function (target, room, user) {
		if (room instanceof Users.User || !room.game) return;
		room.game.join(user);
	},
	leave: 'leavegame',
	leavegame: function (target, room, user) {
		if (room instanceof Users.User || !room.game) return;
		room.game.leave(user);
	},

	// Storage commands
	bits: 'points',
	points: function (target, room, user) {
		if (room !== user) return;
		let targetUserid = target ? Tools.toId(target) : user.id;
		/**@type {Array<string>} */
		let points = [];
		user.rooms.forEach((rank, room) => {
			if (!(room.id in Storage.databases) || !('leaderboard' in Storage.databases[room.id])) return;
			if (targetUserid in Storage.databases[room.id].leaderboard) points.push("**" + room.id + "**: " + Storage.databases[room.id].leaderboard[targetUserid].points);
		});
		if (!points.length) return this.say((target ? target.trim() + " does not" : "You do not") + " have points on any leaderboard.");
		this.say(points.join(" | "));
	},

	// Tournament commands
	tour: 'tournament',
	tournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id)) return;
		if (!target) {
			if (!user.hasRank(room, '+')) return;
			if (!room.tour) return this.say("I am not currently tracking a tournament in this room.");
			let info = "``" + room.tour.name + " tournament info``";
			if (room.tour.startTime) {
				return this.say(info + ": **Time**: " + Tools.toDurationString(Date.now() - room.tour.startTime) + " | **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
			} else if (room.tour.started) {
				return this.say(info + ": **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
			} else {
				return this.say(info + ": " + room.tour.playerCount + " player" + (room.tour.playerCount > 1 ? "s" : ""));
			}
		} else {
			if (!user.hasRank(room, '%')) return;
			let targets = target.split(',');
			let cmd = Tools.toId(targets[0]);
			let format;
			switch (cmd) {
			case 'end':
				this.say("/tour end");
				break;
			case 'start':
				this.say("/tour start");
				break;
			default:
				format = Tools.getFormat(cmd);
				if (!format) return this.say('**Error:** invalid format.');
				if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
				let cap;
				if (targets[1]) {
					cap = parseInt(Tools.toId(targets[1]));
					if (cap < 2 || cap > Tournaments.maxCap || isNaN(cap)) return this.say("**Error:** invalid participant cap.");
				}
				this.say("/tour new " + format.id + ", elimination, " + (cap ? cap + ", " : "") + (targets.length > 2 ? ", " + targets.slice(2).join(", ") : ""));
			}
		}
	},
	settour: 'settournament',
	settournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
		if (room.id in Tournaments.tournamentTimers) {
			let warned = overwriteWarnings.has(room.id) && overwriteWarnings.get(room.id) === user.id;
			if (!warned) {
				overwriteWarnings.set(room.id, user.id);
				return this.say("A tournament has already been scheduled in this room. To overwrite it, please reuse this command.");
			}
			overwriteWarnings.delete(room.id);
		}
		let targets = target.split(',');
		if (targets.length < 2) return this.say(Config.commandCharacter + "settour - tier, time, cap (optional)");
		let format = Tools.getFormat(targets[0]);
		if (!format) return this.say('**Error:** invalid format.');
		if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
		let date = new Date();
		let currentTime = (date.getHours() * 60 * 60 * 1000) + (date.getMinutes() * (60 * 1000)) + (date.getSeconds() * 1000) + date.getMilliseconds();
		let targetTime = 0;
		if (targets[1].includes(':')) {
			let parts = targets[1].split(':');
			let hours = parseInt(parts[0]);
			let minutes = parseInt(parts[1]);
			if (isNaN(hours) || isNaN(minutes)) return this.say("Please enter a valid time.");
			targetTime = (hours * 60 * 60 * 1000) + (minutes * (60 * 1000));
		} else {
			let hours = parseFloat(targets[1]);
			if (isNaN(hours)) return this.say("Please enter a valid time.");
			targetTime = currentTime + (hours * 60 * 60 * 1000);
		}
		let timer = targetTime - currentTime;
		if (timer <= 0) timer += 24 * 60 * 60 * 1000;
		Tournaments.setTournamentTimer(room, timer, format.id, targets[2] ? parseInt(targets[2]) : 0);
		this.say("The " + format.name + " tournament is scheduled for " + Tools.toDurationString(timer) + ".");
	},
	canceltour: 'canceltournament',
	canceltournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
		if (!(room.id in Tournaments.tournamentTimers)) return this.say("There is no tournament scheduled for this room.");
		clearTimeout(Tournaments.tournamentTimers[room.id]);
		this.say("The scheduled tournament was canceled.");
	},
	
	// Other commands
	
	iq: function (arg, user, room) {
          if (!arg) return this.say('You didn\'t specify a person');
          this.say('Analysisng the IQ of the person. ' + 'Give me a few moments.......')
          var x = Math.floor((Math.random() * 200) + 1);
          this.say('The iq of ' + arg + 'is :  ' +   x );
         
        },
	/*generation: function (arg, user, room) {
        var url = "http://pokeapi.co/api/v2/generation/"+arg;
        let self=this;
        request(url, function(err, resp, body){
            if(!err && resp.statusCode == 200){
             data = JSON.parse(body);
             var htmltext = "!addhtmlbox <ul>"
             data["pokemon_species"].sort().forEach(function(pokemon){
                 htmltext+= '<li>' +  pokemon.name  + '</li>' }) 
           
            htmltext+="</ul>";
                               
            self.say(htmltext)   
            }
        });                      
      },*/
          ping: function (target, room, user) {
          if(!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
          var rate = Math.floor((Math.random() * 10) + 1);
          if(rate == 1){
          this.say("You win");
    } 

          else if(rate == 4){
          this.say("You lose");
        //  this.say("/mute " + user.id + ", fuck u");
    }
    else{
      this.say("Pong!");

  }},
	randtype: 'type',
        type: function (target, user, room) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		let types = ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"];
                this.say("Randomly generated type:" + "**" + Tools.sampleOne(types) + "**");
  },
	j: 'judge',
        judge:  function (target, room, user) {
        var judgement = [" is so cute"," is the worst!!!"," is um eh not bad "," is the best"," is ok"];
        var rand = Math.floor((Math.random() * 4) + 1); 
        if (!["!", "/"].includes(target.charAt(0))) 
        this.say(target.split('/') + judgement[rand]);
  },
        cal : 'calculate',
        calculate: function(target, room, user){
        let alphabets = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z'];
        let cond = true;
        for(let i = 0;i < alphabets.length;i++){
        if(target.includes(alphabets[i])) cond = false;
  }
        if(cond == true) return this.say(eval(target));
  },
      reversio: function(target, room, user){
     let str = target;
    
     var n = str.includes("!");
     if(n)
     {return this.say("you cant use ! in your sentence");
    }
        var m = str.includes("/");
     if(m)
     {return this.say("you cant use / in your sentence");
    }
     var splitString = str.split("");
     var reverseArray = splitString.reverse();
      var joinArray = reverseArray.join("");
    
      if(joinArray == target) {
        return this.say("You spotted a palindrome! " + joinArray);}
      return this.say(joinArray);
  },
	roast: function (target, user, room) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		let roasts = ["If i wanted to die, I would climb to the top of " + target + "'s ego and jump to their IQ", target + ", I was going to give you a nasty look but I see that you’ve already got one.", target + ", you always bring me so much joy. As soon as you leave the room.", target + ", some day you'll go far - and i really hope you stay there.", "To call " + target + " a donkey would be an insult to the donkey.", target + ", You're the reason the gene pool needs a lifeguard", target + "'s breath is so bad, their dentist treats them over the phone.", "I tried making " + target + " my password but my computer said it was too weak.", "If laughter is the best medicine, " + target + "'s face must be curing the world.", target + ", you remind me of Kurt Angle. You suck!", target + ', your presence here is as bad as __OM Room__\'s theme', target + ", you remind me of gold. You weigh a fuck ton.", target + ", your body looks like a kindergartners attempt to make a person out of playdoh", target + ", my mom asked me to take out the trash so what time should I pick you up?", "No, those __pants__ don't make " + target + " look fatter - how could they?", "If " + target + " is gonna be two-faced, why can't at least one of them be attractive?", "Accidents happen. LIKE YOU!", target + " is proof god has a sense of humor"];
		this.say(Tools.sampleOne(roasts));
	},
	 voice: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '@')) return;
		if (room.id = !Games) return;
		this.say("/roomvoice " + user.id);
	},
        devoice: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '@')) return;
		if (room.id = !Games) return;
		this.say("/roomdevoice " + user.id);
	},

	/**joke: function (arg, user, room)
             {

                var jokesAPI = "https://api.icndb.com/jokes?escape=javascript";
                let self=this;
                request(jokesAPI, function(err, resp, body){
                    if(!err && resp.statusCode == 200){
                     data = JSON.parse(body);
                     var jokes = [];
                     for (var i = 0; i < data.value.length; i++) {
                        jokes.push(data.value[i].joke);
                      }
                      var random = Math.floor(Math.random() * jokes.length);
                      self.say(jokes[random]);
                    }
              });
               
              
                               
          },**/
	
};

module.exports = commands;
