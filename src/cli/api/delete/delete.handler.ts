import { ICommandHandler, IHandlerParameters } from "@brightside/imperative";
import { RequestError, StatusCodeError } from "request-promise/errors";
import {ConnectionUtil} from "../../../connection";

export default class ApiDeleteHandler implements ICommandHandler {
    public async process(commandParams: IHandlerParameters) {
        const profile = commandParams.profiles.get("zosconnect");
        const zosConn = ConnectionUtil.getConnection(profile);
        try {
            const api = await zosConn.getApi(commandParams.arguments.apiName);
            await api.stop();
            await api.delete();
            commandParams.response.console.log("Successfully deleted API " + commandParams.arguments.apiName);
        } catch (error) {
            switch (error.constructor) {
                case StatusCodeError:
                    const statusCodeError = error as StatusCodeError;
                    switch (statusCodeError.statusCode) {
                        case 401:
                        case 403:
                            commandParams.response.console.error(
                                "Security error occurred when trying to delete the API");
                            break;
                        case 404:
                            commandParams.response.console.error(
                                `API ${commandParams.arguments.apiName} is not installed.`);
                            break;
                        default:
                            commandParams.response.console.error(statusCodeError.message);
                    }
                    break;
                case RequestError:
                    commandParams.response.console.error(`Unable to connect to ${profile.name}`);
                    break;
                default:
                    commandParams.response.console.error(error);
            }
        }
    }
}
