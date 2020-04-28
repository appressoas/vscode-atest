import PyTestRunner from "./PyTestRunner";
import GenericRunner from "./GenericRunner";

export class RunnerRegistry {
    runnerClassMap: Map<string, any>;

    constructor () {
        this.runnerClassMap = new Map<string, any>();
    }

    addRunnerClass(runnerClass: any) {
        this.runnerClassMap.set(runnerClass.getRunnerName(), runnerClass);
    }

    getRunnerClass(runnerName: string): any {
        const runnerClass = this.runnerClassMap.get(runnerName);
        if (!runnerClass) {
            throw new Error(`Invalid runnerName: "${runnerName}"`);
        }
        return runnerClass;
    }
}

export const RUNNER_REGISTRY = new RunnerRegistry();
RUNNER_REGISTRY.addRunnerClass(PyTestRunner);
RUNNER_REGISTRY.addRunnerClass(GenericRunner);
