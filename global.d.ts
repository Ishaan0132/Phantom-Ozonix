import * as ClientType from './client'
import * as CommandsType from './commands'
import * as ConfigType from './config-example'
import * as DataType from './tools-data'
import * as GamesType from './games'
import * as MessageParserType from './message-parser'
import * as RoomsType from './rooms'
import * as StorageType from './storage'
import * as ToolsType from './tools'
import * as TournamentsType from './tournaments'
import * as UsersType from './users'

declare global {
	const Client: typeof ClientType
	const Commands: typeof CommandsType
	const Config: typeof ConfigType
	const Games: typeof GamesType.Games
	const MessageParser: typeof MessageParserType.MessageParser
	const Plugins: Array<any> | undefined
	const Rooms: typeof RoomsType.Rooms
	const Storage: typeof StorageType
	const Tools: typeof ToolsType
	const Tournaments: typeof TournamentsType.Tournaments
	const Users: typeof UsersType.Users

	const Context: typeof MessageParserType.Context
	const Game: typeof GamesType.Game
	const Player: typeof GamesType.Player
	const Room: typeof RoomsType.Room
	const Tournament: typeof TournamentsType.Tournament
	const User: typeof UsersType.User

	const Ability: typeof DataType.Ability
	const Effect: typeof DataType.Effect
	const Format: typeof DataType.Format
	const Item: typeof DataType.Item
	const Move: typeof DataType.Move
	const Pokemon: typeof DataType.Pokemon
}
