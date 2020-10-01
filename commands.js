/**
 * Commands
 * Phantom Ozonix - https://github.com/FlyingPhantom/Phantom-Ozonix
 *
 * This file contains the base commands for Phantom Ozonix.
 *
 * @license MIT license
 */

"use strict";

// Users who use the settour command when a tournament is already
// scheduled will be added here and prompted to reuse the command.
// This prevents accidentally overwriting a scheduled tournament.
/**@type {Map<string, string>} */
let overwriteWarnings = new Map();

/**@type {{[k: string]: Command | string}} */
let commands = {
  // Developer commands
  js: "eval",
  eval: {
    command(target, room, user) {
      try {
        target = eval(target);
        this.say(JSON.stringify(target));
      } catch (e) {
        this.say(e.name + ": " + e.message);
      }
    },
    developerOnly: true
  },
  custom: "c",
  c: {
    command(target, room, user) {
      this.say(target);
    },
    developerOnly: true
  },
  uptime: {
    command(target, room, user, pm) {
      let uptime = process.uptime();
      let uptimeText;
      if (uptime > 24 * 60 * 60) {
        let uptimeDays = Math.floor(uptime / (24 * 60 * 60));
        uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
        let uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
        if (uptimeHours)
          uptimeText +=
            ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
      } else {
        uptimeText = Tools.toDurationString(uptime * 1000);
      }
      this.say("Uptime: **" + uptimeText + "**");
    }
  },
  kill: {
    command(target, room, user) {
      console.log("Killed by " + user.name);
      process.exit(-1);
    },
    developerOnly: true
  },
  jr: "joinroom",
  joinroom: {
    command(target, room, user) {
      if (!target)
        return this.say(
          "Usage: " + Config.commandCharacter + "joinroom [room]"
        );
      this.say("/join " + target);
    },
    developerOnly: true
  },
  lr: "leaveroom",
  leaveroom: {
    command(target, room, user) {
      if (!target)
        return this.say(
          "Usage: " + Config.commandCharacter + "leaveroom [room]"
        );
      this.say("/leave " + target);
    },
    developerOnly: true
  },

  // General commands
  about: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      this.say(
        Config.username +
          " code: https://github.com/FlyingPhantom/Phantom-Ozonix"
      );
    }
  },
  guide: "help",
  help: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (!Config.guide) return this.say("There is no guide available.");
      this.say(Users.self.name + " guide: " + Config.guide);
    }
  },
  mail: {
    command(target, room, user) {
      if (!(room instanceof Users.User) || !Config.allowMail) return;
      let targets = target.split(",");
      if (targets.length < 2)
        return this.say("Please use the following format: .mail user, message");
      let to = Tools.toId(targets[0]);
      if (
        !to ||
        to.length > 18 ||
        to === Users.self.id ||
        to.startsWith("guest")
      )
        return this.say("Please enter a valid username");
      let message = targets
        .slice(1)
        .join(",")
        .trim();
      let id = Tools.toId(message);
      if (!id) return this.say("Please include a message to send.");
      if (message.length > (258 - user.name.length))
        return this.say("Your message is too long.");
      let database = Storage.getDatabase("global");
      if (to in database.mail) {
        let queued = 0;
        for (let i = 0, len = database.mail[to].length; i < len; i++) {
          if (Tools.toId(database.mail[to][i].from) === user.id) queued++;
        }
        if (queued >= 3)
          return this.say(
            "You have too many messages queued for " +
              Users.add(targets[0]).name +
              "."
          );
      } else {
        database.mail[to] = [];
      }
      database.mail[to].push({
        time: Date.now(),
        from: user.name,
        text: message
      });
      Storage.exportDatabase("global");
      this.say(
        "Your message has been sent to " + Users.add(targets[0]).name + "!"
      );
    }
  },

  // Misc Commands

  choose: "pick",
  pick: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (target.length < 3 || !~target.indexOf(","))
        return this.say("You must give at least 2 valid choices", room);
      let targets = target.split(",");
      let pick = targets[Math.floor(Math.random() * targets.length)];
      this.say("Random pick: " + pick);
    }
  },
  iq: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (!target) return this.say("You didn't specify a person");
      this.say(
        "Analysisng the IQ of the person. " + "Give me a few moments......."
      );
      var x = Math.floor((Math.random() * 200) + 1);
      this.say("The iq of " + target + " is :  " + x);
    }
  },
  ping: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      var rate = Math.floor((Math.random() * 10) + 1);
      if (rate == 1) {
        this.say("You win");
      } else if (rate == 4) {
        this.say("You lose");
      } else {
        this.say("Pong!");
      }
    }
  },
  j: "judge",
  judge: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      var judgement = [
        " is so cute",
        " is the worst!!!",
        " is um eh not bad ",
        " is the best",
        " is ok"
      ];
      var rand = Math.floor((Math.random() * 4) + 1);
      if (!["!", "/"].includes(target.charAt(0)))
        this.say(target.split("/") + judgement[rand]);
    }
  },
  vibe: {
    command(target, room, user){
      if (room instanceof Users.User || !user.hasRank(room, '+')) return;
      let rate = Math.floor(Math.random() * 100 + 1);
      let vibe = '<img src="https://cdn.discordapp.com/emojis/682731600479518730.gif" alt="vibe" height="60" width="60"/>';
      room.say("/adduhtml vibe, " + vibe.repeat(rate));
    },
  },
  timer: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      const id = Tools.toId(target);
      if (id === "off" || id === "end") {
        if (!room.timers || !(user.id in room.timers))
          return this.say("You do not have a timer running.");
        clearTimeout(room.timers[user.id]);
        delete room.timers[user.id];
        return this.say("Your timer has been turned off.");
      }

      let time;
      if (id.length === 1) {
        time = parseInt(id) * 60;
      } else {
        time = parseInt(id);
      }
      if (isNaN(time) || time > 1800 || time < 5)
        return this.say(
          "Please enter an amount of time between 5 seconds and 30 minutes."
        );
      time *= 1000;

      if (!room.timers) room.timers = {};
      if (user.id in room.timers) clearTimeout(room.timers[user.id]);
      room.timers[user.id] = setTimeout(() => {
        room.say(user.name + ": time is up!");
        delete room.timers[user.id];
      }, time);
      this.say(
        "Your timer has been set for: " + Tools.toDurationString(time) + "."
      );
    }
  },
  cal: "calculate",
  calculate: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      let alphabets = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "x",
        "y",
        "z"
      ];
      let cond = true;
      for (let i = 0; i < alphabets.length; i++) {
        if (target.includes(alphabets[i])) cond = false;
      }
      if (cond == true) return this.say(eval(target));
    }
  },
  reversio: {
    command(target, room, user) {
      let str = target;
      var n = str.includes("!");
      if (n) {
        return this.say("You cant use ! in your sentence");
      }
      var m = str.includes("/");
      if (m) {
        return this.say("You cant use / in your sentence");
      }
      var splitString = str.split("");
      var reverseArray = splitString.reverse();
      var joinArray = reverseArray.join("");

      if (joinArray == target) {
        return this.say("You spotted a Palindrome! " + joinArray);
      }
      return this.say(joinArray);
    }
  },
  joke: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      let jokes = [
        "What's the difference between a jeweler and a jailor? One sells watches, and the other watches cells!",
        "Why do seagulls fly over the sea? Because if they flew over the bay, they'd be bagels!",
        "Why is it a waste of time to talk to a cow? Because it just goes in one ear and out the udder!",
        "Why did the invisible man turn down the job offer? He couldn't see himself doing it.",
        "What do prisoners use to call each other? Cell phones!",
        "What do you call a bee that can't make up its mind? A maybe!",
        "What do you call a bee that lives in America? A USB!",
        "What do you call an everyday potato? A commentator!",
        "Why did the partially blind man fall down the well? Because he couldn't see that well.",
        "What's the difference between a dog and a marine biologist? One wags its tail, and the other tags a whale!",
        "Where do ants go when it's hot outside? **Ant**arctica!",
        "What happened when the oceans raced each other? They tide!",
        "What do you call a chicken that calculates how to cross the road? A mathemachicken!",
        "A woman in labor suddenly shouted, \"Shouldn't! Wouldn't! Couldn't! Didn't! Can't!\". \"Don't worry\", said the doctor, \"those are just contractions.\"",
        "Why did the sun not go to college? It already had three million degrees!",
        "What's the difference between a diameter and a radius? A radius!",
        "What did the scientist say when he found two isotopes of helium? HeHe",
        "Why do Marxists only drink bad tea? Because all proper tea is theft.",
        "What's a frog's favorite drink? Diet croak!",
        'As I handed Dad his 50th birthday card, he looked at me with tears in his eyes and said, "You know, one would have been enough."',
        "I'd tell you a Fibonacci joke, but it's probably as bad as the last two you've heard combined.",
        "Why don't Americans switch from using pounds to kilograms? Because there'd be a mass confusion.",
        "Where do fish go to work at? The offish!",
        "What do you call two friends who both like math? Algebros!",
        "What happened to the man that injested plutonium? He got atomicache!",
        "My sister bet me $100 I couldn't build a car out of spaghetti. You should have seen her face when I drove right pasta!",
        "Did you hear people aren't naming their daughters Karen nowadays? Soon there won't be a Karen the world.",
        "Why is justice best served cold? Because if it was served warm, it would be just water!",
        "Last week, I decided I was going to enter the Worlds Tightest Hat competition. I just hope I can pull it off...",
        "What do you call a beehive where bees can never leave? Un-bee-leaveable!",
        "How much does it cost for a pirate to get their ears pierced? A buccaneer!",
        "The minus button on my calculator is broken. On the plus side, it works.",
        "Gravity is one of the fundamental forces in the universe. If you removed it, you'd get gravy.",
        "Did you know that if you cut off your left arm, your right arm is left?",
        "The other day, I spotted an albino dalmatian. I figured it was the least I could do for him.",
        "What is the loudest pet? A trum**pet**!",
        "What's the best way to cook an alligator? In a crockpot!",
        "What's the best way to make a pirate angry? Remove the p!",
        "Last night, my wife was feeling pretty emotional, and she started coloring on my upper arm. I guess she just needed a shoulder to crayon.",
        "Did you hear about the marriage of the invisible man and the invisible woman? I'm just not sure what they saw in each other.",
        "Where do you take a boat when it gets sick? To the doc!",
        'My eye doctor called and said the results of my last appointment were finished. When I asked if I could see them, she said, "probably not".',
        'A priest, a pastor, and a rabbit walk into a bar. The rabbit says, "I must be a typo!"',
        "Why was the tennis club's website down? They had problems with their server.",
        "My wife told me to stop impersonating a flamingo. I had to put my foot down.",
        "I failed math so many times at school, I can’t even count.",
        "I was wondering why the frisbee kept getting bigger and bigger, but then it hit me.",
        "I heard there were a bunch of break-ins over at the car park. That is wrong on so many levels."
      ];
      this.say(Tools.sampleOne(jokes));
    }
  },
  roast: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      let roasts = [
        "If i wanted to die, I would climb to the top of " +
          target +
          "'s ego and jump to their IQ",
        target +
          ", I was going to give you a nasty look but I see that you’ve already got one.",
        target +
          ", you always bring me so much joy. As soon as you leave the room.",
        target + ", some day you'll go far - and i really hope you stay there.",
        "To call " + target + " a donkey would be an insult to the donkey.",
        target + ", You're the reason the gene pool needs a lifeguard",
        target +
          "'s breath is so bad, their dentist treats them over the phone.",
        "I tried making " +
          target +
          " my password but my computer said it was too weak.",
        "If laughter is the best medicine, " +
          target +
          "'s face must be curing the world.",
        target + ", you remind me of Kurt Angle. You suck!",
        target + ", your presence here is as bad as __OM Room__'s theme",
        target + ", you remind me of gold. You weigh a fuck ton.",
        target +
          ", your body looks like a kindergartners attempt to make a person out of playdoh",
        target +
          ", my mom asked me to take out the trash so what time should I pick you up?",
        "No, those __pants__ don't make " +
          target +
          " look fatter - how could they?",
        "If " +
          target +
          " is gonna be two-faced, why can't at least one of them be attractive?",
        "Accidents happen. LIKE YOU!",
        target + " is proof god has a sense of humor"
      ];
      this.say(Tools.sampleOne(roasts));
    }
  },
  helix: "8ball",
  "8ball": {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      let cases = [
        "Signs point to yes.",
        "Yes.",
        "Reply hazy,try again.",
        "Without a doubt.",
        "My sources say no.",
        "As I see it, yes.",
        "You may rely on it.",
        "Concentrate and ask again.",
        "Outlook not so good.",
        "It is decidedly so.",
        "Very doubtful.",
        "Better not tell you now.",
        "Yes - definitely.",
        "It is certain.",
        "Cannot predict now.",
        "Most likely.",
        "Ask again later.",
        "My reply is no.",
        "Outlook good.",
        "Don't count on it."
      ];
      this.say(Tools.sampleOne(cases));
    }
  },
  repeat: {
    command(target, room, user) {
      if (room instanceof Users.User || !user.hasRank(room, "%")) return;
      return this.say("You do not have permission to use this.");
      if (!target)
        return this.say(
          "Syntax: " + Config.commandCharacter + "repeat time, phrase"
        );
      if (target === "stop" && room.repeat) {
        clearInterval(room.repeat);
        delete room.repeat;
        return this.say("The repeat was stopped.");
      }
      if (room.repeat)
        return this.say("There is already a repeat in this room.");
      let opts = target.split(",");
      let time = parseInt(opts[0]);
      if (!time || isNaN(time) || time < 5)
        return this.say("The time must be a real number greater than 5");
      opts.splice(0, 1);
      let phrase = opts.join(",");
      function repeat() {
        room.say(phrase);
      }
      room.repeat = setInterval(repeat, time * 60000);
      this.say(
        "I will be repeating that message once every " + time + " minutes."
      );
    },
    chatOnly: true
  },
  pair: {
    command(target, room, user) {
    if (room instanceof Users.User && !user.hasRank(room, '+')) return;
        let splitStr = target.split(",");
        if (splitStr.length !== 2) return;
        let str1 = splitStr[0];
        let str2 = splitStr[1];
        var userr = str1;
        var pairing = str2;
        function toBase(num, base) {
            var symbols = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            var val;
            var total = 0;
 
            if (base > symbols.length || base <= 1) return false;
            let i;
            for (i = 0; i < num.length; i++) {
                val = symbols.indexOf(num[i]);
                total += ((val % base) * Math.pow(10, i)) + (Math.floor(val / base) * Math.pow(10, i + 1));
            }
            return parseInt(total);
        }
 
        userr = toBase(userr, 10);
        pairing = toBase(pairing, 10);
        var match = (userr + pairing) % 101;
 
        this.say( str1 + ' and ' + str2 + ' are ' + Math.abs(match) + '% compatible!');
    },
  },
  rpoke: "randompokemon",
  randpoke: "randompokemon",
  randp: "randompokemon",
  randompokemon: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (!target) {
        const species = Tools.getExistingPokemon(
          Tools.sampleOne(Object.keys(Tools.data.pokedex))
        ).name;
        {
          this.say("!dt " + species);
        }
        return;
      }
      this.say("!randpoke " + target);
    }
  },
  rmove: "randommove",
  randmove: "randommove",
  randommove: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      const move = Tools.getExistingMove(
        Tools.sampleOne(Object.keys(Tools.data.moves))
      ).name;
      this.say("!dt " + move);
    }
  },
  ritem: "randomitem",
  randitem: "randomitem",
  randomitem: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      const item = Tools.getExistingItem(
        Tools.sampleOne(Object.keys(Tools.data.items))
      ).name;
      this.say("!dt " + item);
    }
  },
  rability: "randomability",
  randability: "randomability",
  randomability: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      const abilities = Object.keys(Tools.data.abilities);
      let ability = Tools.getExistingAbility(Tools.sampleOne(abilities));
      while (ability.id === "noability") {
        ability = Tools.getExistingAbility(Tools.sampleOne(abilities));
      }
      this.say("!dt " + ability.name);
    }
  },
  rtype: "randomtype",
  randtype: "randomtype",
  randomtype: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      const types = Object.keys(Tools.data.typeChart);
      let type = Tools.sampleOne(types);
      if (Tools.random(2)) {
        types.splice(types.indexOf(type), 1);
        type += "/" + Tools.sampleOne(types);
      }
      this.say("Randomly generated type: **" + type + "**");
    }
  },
  randchar: "randomcharacter",
  rchar: "randomcharacter",
  randomcharacter: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      this.say(
        "Randomly generated character: **" +
          Tools.sampleOne(Tools.data.characters).trim() +
          "**"
      );
    }
  },
  randlocation: "randomlocation",
  rloc: "randomlocation",
  randloc: "randomlocation",
  randomlocation: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      this.say(
        "Randomly generated location: **" +
          Tools.sampleOne(Tools.data.locations).trim() +
          "**"
      );
    }
  },

  // Game commands
  signups: "creategame",
  creategame: {
    command(target, room, user) {
      if (!user.hasRank(room, "+")) return;
      if (!Config.games || !Config.games.includes(room.id))
        return this.say("Games are not enabled for this room.");
      let format = Games.getFormat(target);
      if (!format || format.inheritOnly)
        return this.say("The game '" + target + "' was not found.");
      if (format.internal)
        return this.say(format.name + " cannot be started manually.");
      Games.createGame(format, room);
      if (!room.game) return;
      room.game.signups();
    },
    chatOnly: true
  },
  start: "startgame",
  startgame: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (room.game) room.game.start();
    },
    chatOnly: true
  },
  cap: "capgame",
  capgame: {
    command(target, room, user) {
      if (room instanceof Users.User || !room.game || !user.hasRank(room, "+"))
        return;
      let cap = parseInt(target);
      if (isNaN(cap)) return this.say("Please enter a valid player cap.");
      if (cap < room.game.minPlayers)
        return this.say(
          room.game.name +
            " must have at least " +
            room.game.minPlayers +
            " players."
        );
      if (room.game.maxPlayers && cap > room.game.maxPlayers)
        return this.say(
          room.game.name +
            " cannot have more than " +
            room.game.maxPlayers +
            " players."
        );
      room.game.playerCap = cap;
      this.say("The game will automatically start at **" + cap + "** players!");
    },
    chatOnly: true
  },
  end: "endgame",
  endgame: {
    command(target, room, user) {
      if (!(room instanceof Users.User) && !user.hasRank(room, "+")) return;
      if (room.game) room.game.forceEnd();
    },
    chatOnly: true
  },
  join: "joingame",
  joingame: {
    command(target, room, user) {
      if (room instanceof Users.User || !room.game) return;
      room.game.join(user);
    },
    chatOnly: true
  },
  leave: "leavegame",
  leavegame: {
    command(target, room, user) {
      if (room instanceof Users.User || !room.game) return;
      room.game.leave(user);
    },
    chatOnly: true
  },
  bid: {
    command(target, room, user) {
      if (!room.game) return;
      if (typeof room.game.bid === "function") room.game.bid(target, user);
    },
    chatOnly: true
  },
 

  // Storage commands
  bits: "points",
  points: {
    command(target, room, user) {
      let targetUserid = target ? Tools.toId(target) : user.id;
      /**@type {Array<string>} */
      let points = [];
      user.rooms.forEach((rank, room) => {
        if (
          !(room.id in Storage.databases) ||
          !("leaderboard" in Storage.databases[room.id])
        )
          return;
        if (targetUserid in Storage.databases[room.id].leaderboard)
          points.push(
            "**" +
              room.id +
              "**: " +
              Storage.databases[room.id].leaderboard[targetUserid].points
          );
      });
      if (!points.length)
        return this.say(
          (target ? target.trim() + " does not" : "You do not") +
            " have points on any leaderboard."
        );
      this.say(points.join(" | "));
    },
    pmOnly: true
  },

  // Tournament commands
  tour: "tournament",
  tournament: {
    command(target, room, user) {
      if (
        room instanceof Users.User ||
        !Config.tournaments ||
        !Config.tournaments.includes(room.id)
      )
        return;
      if (!target) {
        if (!user.hasRank(room, "+")) return;
        if (!room.tour)
          return this.say(
            "I am not currently tracking a tournament in this room."
          );
        let info = "``" + room.tour.name + " tournament info``";
        if (room.tour.startTime) {
          return this.say(
            info +
              ": **Time**: " +
              Tools.toDurationString(Date.now() - room.tour.startTime) +
              " | **Remaining players**: " +
              room.tour.getRemainingPlayerCount() +
              "/" +
              room.tour.totalPlayers
          );
        } else if (room.tour.started) {
          return this.say(
            info +
              ": **Remaining players**: " +
              room.tour.getRemainingPlayerCount() +
              "/" +
              room.tour.totalPlayers
          );
        } else {
          return this.say(
            info +
              ": " +
              room.tour.playerCount +
              " player" +
              (room.tour.playerCount > 1 ? "s" : "")
          );
        }
      } else {
        if (!user.hasRank(room, "%")) return;
        let targets = target.split(",");
        let cmd = Tools.toId(targets[0]);
        let format;
        switch (cmd) {
          case "end":
            this.say("/tour end");
            break;
          case "start":
            this.say("/tour start");
            break;
          default:
            format = Tools.getFormat(cmd);
            if (!format) return this.say("**Error:** invalid format.");
            if (!format.playable)
              return this.say(
                format.name + " cannot be played, please choose another format."
              );
            let cap;
            if (targets[1]) {
              cap = parseInt(Tools.toId(targets[1]));
              if (cap < 2 || cap > Tournaments.maxCap || isNaN(cap))
                return this.say("**Error:** invalid participant cap.");
            }
            this.say(
              "/tour new " +
                format.id +
                ", elimination, " +
                (cap ? cap + ", " : "") +
                (targets.length > 2 ? ", " + targets.slice(2).join(", ") : "")
            );
        }
      }
    },
    chatOnly: true
  },
  settour: "settournament",
  settournament: {
    command(target, room, user) {
      if (
        room instanceof Users.User ||
        !Config.tournaments ||
        !Config.tournaments.includes(room.id) ||
        !user.hasRank(room, "%")
      )
        return;
      if (room.id in Tournaments.tournamentTimers) {
        let warned =
          overwriteWarnings.has(room.id) &&
          overwriteWarnings.get(room.id) === user.id;
        if (!warned) {
          overwriteWarnings.set(room.id, user.id);
          return this.say(
            "A tournament has already been scheduled in this room. To overwrite it, please reuse this command."
          );
        }
        overwriteWarnings.delete(room.id);
      }
      let targets = target.split(",");
      if (targets.length < 2)
        return this.say(
          Config.commandCharacter + "settour - tier, time, cap (optional)"
        );
      let format = Tools.getFormat(targets[0]);
      if (!format) return this.say("**Error:** invalid format.");
      if (!format.playable)
        return this.say(
          format.name + " cannot be played, please choose another format."
        );
      let date = new Date();
      let currentTime =
        (date.getHours() * 60 * 60 * 1000) +
        (date.getMinutes() * (60 * 1000)) +
        (date.getSeconds() * 1000) +
        date.getMilliseconds();
      let targetTime = 0;
      if (targets[1].includes(":")) {
        let parts = targets[1].split(":");
        let hours = parseInt(parts[0]);
        let minutes = parseInt(parts[1]);
        if (isNaN(hours) || isNaN(minutes))
          return this.say("Please enter a valid time.");
        targetTime = (hours * 60 * 60 * 1000) + (minutes * (60 * 1000));
      } else {
        let hours = parseFloat(targets[1]);
        if (isNaN(hours)) return this.say("Please enter a valid time.");
        targetTime = currentTime + (hours * 60 * 60 * 1000);
      }
      let timer = targetTime - currentTime;
      if (timer <= 0) timer += 24 * 60 * 60 * 1000;
      Tournaments.setTournamentTimer(
        room,
        timer,
        format.id,
        targets[2] ? parseInt(targets[2]) : 0
      );
      this.say(
        "The " +
          format.name +
          " tournament is scheduled for " +
          Tools.toDurationString(timer) +
          "."
      );
    },
    chatOnly: true
  },
  canceltour: "canceltournament",
  canceltournament: {
    command(target, room, user) {
      if (
        room instanceof Users.User ||
        !Config.tournaments ||
        !Config.tournaments.includes(room.id) ||
        !user.hasRank(room, "%")
      )
        return;
      if (!(room.id in Tournaments.tournamentTimers))
        return this.say("There is no tournament scheduled for this room.");
      clearTimeout(Tournaments.tournamentTimers[room.id]);
      this.say("The scheduled tournament was canceled.");
    },
    chatOnly: true
  }
};

module.exports = commands;
