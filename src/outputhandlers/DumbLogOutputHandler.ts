import AbstractOutputHandler from "./AbstractOutputHandler";

export default class DumbLogOutputHandler extends AbstractOutputHandler {
    async handleProcessDone (failed: boolean = false) {
    }
}