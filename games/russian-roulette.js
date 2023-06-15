/**
 * Russian Roulette game
 * Phantom Ozonix - https://github.com/Ishaan0132/Phantom-Ozonix
 *
 * @license MIT license
 */

"use strict";

const name = "Russian Roulette";
const description =
  "Players pick a number between 1-7 and gain points based on what number they pick. If you pick a lower number the higher your chance is of winning but the lower your points. 7 is an auto loss";
const id = Tools.toId(name);

class RussianRoulette extends Games.Game {
  constructor(room) {
    super(room);
    this.name = name;
    this.description = description;
    this.id = id;
    this.points = new Map();
  }

  getRandomOrdering(players) {
    let order = Tools.shuffle(Object.keys(players));
    let realOrder = [];
    for (let i = 0; i < order.length; i++) {
      realOrder.push(players[order[i]]);
    }
    return realOrder;
  }

  onStart() {
    this.nextRound();
  }

  onNextRound() {
    if (this.getRemainingPlayerCount() === 0) {
      this.say("Everyone was eliminated! Better luck next time.");
      this.end();
      return;
    }
    this.order = this.getRandomOrdering(this.getRemainingPlayers());
    this.say(
      "**Players (" +
        this.getRemainingPlayerCount() +
        "):** " +
        this.getPoints(this.getRemainingPlayers())
    );
    this.nextPlayer();
  }

  nextPlayer() {
    if (this.canBid) {
      this.say(this.curPlayer.name + " didn't bid and is eliminated!");
      this.curPlayer.eliminated = true;
    }
    if (this.order.length === 0) {
      this.nextRound();
    } else {
      this.curPlayer = this.order.shift();
      this.canBid = true;
      this.say(
        this.curPlayer.name + " you're up! Please bid a number between 1 and 6."
      );
      this.timeout = setTimeout(() => this.nextPlayer(), 30 * 1000);
    }
  }

  bid(target, user) {
    if (!this.canBid) return;
    let player = this.players[user.id];
    if (!player || player !== this.curPlayer) return;
    let bid = Math.floor(target);
    if (bid < 1 || bid > 6) return;
    this.canBid = false;
    let num = Math.floor(Math.random() * 7) + 1;
    clearTimeout(this.timeout);
    if (num <= bid) {
      this.say(
        "The randomly chosen number is " +
          num +
          "! RIP " +
          this.curPlayer.name +
          "."
      );
      this.curPlayer.eliminated = true;
      this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
    } else {
      let points = this.points.get(this.curPlayer) || 0;
      points += bid;
      if (points >= 15) {
        this.say(
          "The randomly chosen number is " +
            num +
            "! " +
            this.curPlayer.name +
            " has reached 15 points and wins!"
        );
        this.addBits(500, this.curPlayer);
        this.end();
        return;
      } else {
        this.say(
          "The randomly chosen number is " +
            num +
            "! " +
            this.curPlayer.name +
            " advances to " +
            points +
            " point" +
            (points > 1 ? "s" : "") +
            "."
        );
        this.points.set(this.curPlayer, points);
        this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
      }
    }
  }
}

exports.game = RussianRoulette;
exports.name = name;
exports.description = description;
exports.id = id;
exports.aliases = ["rr"];
