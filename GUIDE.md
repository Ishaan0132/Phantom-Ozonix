Bot Commands
====================

Bot commands are in files of this path. Commands included in this repository are explained below.

Basic Commands
------------

Basic features and some information about the bot.

 - `about` - Basic bot info, with the link to this repo.
 - `git` or `help` - Link to this repo.
 - `mail` - Sends a message to a user. 

Chat Plugins
------------

Misc commands for multiple features:

 - `pick [option1], [option2], [...]` - Choose between multiple options.
 - `iq` - Get a random iq of the user.
 - `joke` - Generates a random joke.
 - `ping` - Pings the bot.
 - `judge` - Judges the user.
 - `calculate` - Calculate mathematics.
 - `roast` - Roast someone.
 - `helix` or `8ball` - Get a random answer.
 - `regdate (username)` - Get the register date of a Pokemon Showdown account.
 - `regtime (username)` - Get the age of a Pokemon Showdown account, useful for check if an account is autoconfirmed.


Commands for getting pokemon info:

 - `rpoke` - Get a random pokemon.
 - `rmove` - Get a random move.
 - `ritem` - Get a random item.
 - `rability` - Get a random ability.
 - `rtype` - Get a random pokemon type.
 - `rchar` - Get a random character.
 - `rloc` - Get a random location.

Commands for managing the local database of quotes:

 - `addquote [text]` - Add a new quote.
 - `delquote [text]` - Delete an existing quote.
 - `quotes` - Get the quotes list.
 
Administrative Commands
------------

Commands for controlling the bot

 - `custom` or `c` - Send something to the current room
 - `joinroom` or `jr` - Join chat room
 - `leaveroom` or `lr` - Leave chat room

Developing Commands
------------

Command for Information

 - `uptime` - Time since the last bot restart

Commands for developing 

 - `eval` or `js` - Execute arbitrary JavaScript
 
Command for terminating the process (for restarting the bot)

 - `kill` - End the process

Tournaments
------------

Commands for Tournaments feature

 - `tour` - Start a tournament
 - `tour start` - Force start a tornament
 - `tour end` - Force end a tornament
 - `settour` - Schedules a tournament for the particular room
 - `canceltour` - Cancels the Scheduled tour 

Commands for leaderboards system 
 
- `bits` or `points` - View users's points earned by winning games

Games
------------

General commands for managing games:

 - `signups [Game Name]` - Starts signups of a game
 - `cap` - Sets a Player Cap for the game
 - `join` - Enter the game
 - `leave` - Leave the game
 - `start` - Starts the particular game
 - `end` - Force end a game
