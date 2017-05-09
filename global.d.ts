import * as ClientType from './client'
import * as CommandParserType from './command-parser'
import * as CommandsType from './commands'
import * as ConfigType from './config-example'
import * as GamesType from './games'
import * as RoomsType from './rooms'
import * as StorageType from './storage'
import * as ToolsType from './tools'
import * as UsersType from './users'

declare global {
    const Client:typeof ClientType
    const CommandParser:typeof CommandParserType
    const Commands: typeof CommandsType
    const Config:typeof ConfigType
    const Games:typeof GamesType
    const Rooms:typeof RoomsType
    const Storage:typeof StorageType
    const Tools:typeof ToolsType
    const Users:typeof UsersType
    const toId:Function
}
