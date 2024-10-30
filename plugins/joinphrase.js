"use strict";

exports.commands = {
  addjp: "addjoinphrase",
  addphrase: "addjoinphrase",
  setjp: "addjoinphrase",
  addjoinphrase: function(target, room, user) {
      if(room instanceof Users.User && !user.hasRank(room, "+")) return;
      let u = user.id;
      let jp = target;
      if(target.includes(",")) {
        let opts = target.split(",");
        u = Tools.toId(opts[0]);
        jp = opts.slice(1).join(",") 
      }
    let database = Storage.getDatabase(room)
     if (!database.jps) database.jps = {};
      database.jps[u] = jp;
      Storage.exportDatabase(room.id);  
    this.say("Your join phrase has been set to: " + jp)
  },
  
 deletejp: "removephrase",
  remphrase: "removephrase",
  remjp: "removephrase",
  removephrase: function(target, room, user) {
      let u = user.id;
      if(target) {
       if(room instanceof Users.User && !user.hasRank(room, "%")) return;
        u = Tools.toId(target);
      }
      if(!Storage.databases[room.id].jps) Storage.databases[room.id].jps = {};
      if(!Storage.databases[room.id].jps[u]) return room.say("This user does not have any joinphrase");
delete Storage.databases[room.id].jps[u]
      Storage.exportDatabase(room.id); 
    this.say("Your join phrase has been deleted.")
  },
  jp: "joinphrase",
  joinphrase: function(target, room, user) {
    if (room instanceof Users.User && !user.hasRank(room, "+")) return;
    let database = Storage.getDatabase(room);
    if (!target && user.id in database.jps) {
      return this.say(
          "Your current join phrase for this room is: " +
             database.jps[user.id]
        );
      return;
    }
    if (!target && !(user.id in database.jps)) {
      return this.say(
          "You don't have any join phrase"
        );
      return;
    }
  }
};
