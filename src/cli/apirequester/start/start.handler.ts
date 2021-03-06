/*
 *  This program and the accompanying materials are made available under the terms of the
 *  Eclipse Public License v2.0 which accompanies this distribution, and is available at
 *  https://www.eclipse.org/legal/epl-v20.html
 *
 *  SPDX-License-Identifier: EPL-2.0
 *
 *  Copyright IBM 2019
 *
 */

import { IHandlerParameters } from "@zowe/imperative";
import { HTTPError } from "got";
import { ZosConnectApiRequester } from "../../../api/apirequester/ZosConnectApiRequester";
import { ZosConnectBaseHandler } from "../../ZosConnectBaseHandler";

export default class ApiRequesterStartHandler extends ZosConnectBaseHandler {
    public async processCmd(commandParams: IHandlerParameters): Promise<void> {
        try {
            await ZosConnectApiRequester.start(this.session, commandParams.arguments.apiRequesterName);
            commandParams.response.console.log(`Successfully started API Requester ` +
                `${commandParams.arguments.apiRequesterName}`);
        } catch (error) {
            switch (error.constructor) {
                case HTTPError:
                    switch (error.response.statusCode) {
                        case 401:
                        case 403:
                            commandParams.response.console.error(
                                "Security error occurred when trying to start the API Requester");
                            break;
                        case 404:
                            commandParams.response.console.error(
                                `API Requester ${commandParams.arguments.apiRequesterName} is not installed.`);
                            break;
                        default:
                            commandParams.response.console.error(error.response.statusMessage);
                    }
                    break;
                default:
                    throw error;
            }
        }
    }
}
