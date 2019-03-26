import { ICommandHandler, IHandlerParameters } from "@brightside/imperative";
import fs = require("fs");
import { RequestError, StatusCodeError } from "request-promise/errors";
import { ZosConnectService } from "../../../api/service/ZosConnectService";
import { ConnectionUtil } from "../../../connection";

export default class ServiceInstallHandler implements ICommandHandler {
    public async process(commandParameters: IHandlerParameters): Promise<void> {
        const filePath = commandParameters.arguments.file;
        let fileBuf;
        try {
            fileBuf = fs.readFileSync(filePath);
        } catch (error) {
            commandParameters.response.console.error(`Unable to load SAR file (${error.message})`);
            return;
        }

        const profile = commandParameters.profiles.get("zosconnect");
        const session = ConnectionUtil.getSession(profile);
        try {
            const service = await ZosConnectService.install(session, fileBuf);
            commandParameters.response.data.setObj(service);
            commandParameters.response.console.log(`Successfully installed Service ${service.name}`);
        } catch (error) {
            switch (error.constructor) {
                case StatusCodeError:
                    const statusCodeError = error as StatusCodeError;
                    switch (statusCodeError.statusCode) {
                        case 400:
                            commandParameters.response.console.error(
                                "Unable to install Service, invalid SAR file specified");
                            break;
                        case 401:
                        case 403:
                            commandParameters.response.console.error("Security error, Service was not installed");
                            break;
                        case 409:
                            commandParameters.response.console.error(
                                "Unable to install Service, one with the same name is already installed");
                            break;
                        default:
                            commandParameters.response.console.error(statusCodeError.message);
                    }
                    break;
                case RequestError:
                    commandParameters.response.console.error(`Unable to connect to ${session.address}`);
                    break;
                default:
                    commandParameters.response.console.error(error);
            }
        }
    }
}
