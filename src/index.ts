import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, $inspectMessage } from 'azle';
import { v4 as uuidv4 } from 'uuid';


type Message = Record<{
    id: string;
    title: string;
    body: string;
    attchementURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MessagePayload = Record<{
    title: string;
    body: string;
    attchementURL: string;
}>

const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024)

$query
export function getMessages(): Result<Vec<Message>, string> {
    return Result.Ok(messageStorage.values())
}

$query
export function getMessage(id: string): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => Result.Ok<Message, string>(message),
        None: () => Result.Err<Message, string>(`Message with id=${id} not found `)
    });
}

$update
export function addMessage(payload: MessagePayload): Result<Message, string> {
    const message: Message = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    messageStorage.insert(message.id, message);
    return Result.Ok(message);
}

$update
export function updateMessage(id: string, messagePayload: MessagePayload): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const updateMessage: Message = { ...message, ...messagePayload, updatedAt: Opt.Some(ic.time()) }
            messageStorage.insert(id, updateMessage);
            return Result.Ok<Message, string>(updateMessage);
        },
        None: () => {
            return Result.Err<Message, string>(`Result coulnd't find with id=${id}. message not found!`);
        }
    })
}

$update
export function deleteMessage(id: string): Result<Message, string> {
    return match(messageStorage.remove(id), {
        Some: (deleteMessage) => Result.Ok<Message, string>(deleteMessage),
        None: () => Result.Err<Message, string>(`Couldn't find the message id-${id}`)
    })
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}