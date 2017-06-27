import * as ClientType from './client'
import * as CommandsType from './commands'
import * as ConfigType from './config-example'
import * as GamesType from './games'
import * as MessageParserType from './message-parser'
import * as RoomsType from './rooms'
import * as StorageType from './storage'
import * as ToolsType from './tools'
import * as UsersType from './users'

declare global {
	const Client: typeof ClientType
	const Commands: typeof CommandsType
	const Config: typeof ConfigType
	const Games: typeof GamesType.Games
	const MessageParser: typeof MessageParserType.MessageParser
	const Rooms: typeof RoomsType.Rooms
	const Storage: typeof StorageType
	const Tools: typeof ToolsType
	const Users: typeof UsersType.Users
	const toId: Function
}
