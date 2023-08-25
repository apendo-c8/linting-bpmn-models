import * as fs from 'fs';
import * as path from 'path';
import {getInput, setFailed} from "@actions/core";
import {readdirSync} from "fs";
import {spawnSync} from "child_process";

const CUSTOM_RULES_PATH = '/usr/local/lib/node_modules/bpmnlint/rules';

async function installBpmnlint() {

    try {

        console.log("Installing bpmnlint...");

        const npmCommand = 'npm';
        const npmArgs = ['install', '-g', 'bpmnlint'];
        const npmResult = spawnSync(npmCommand, npmArgs, {encoding: 'utf-8'});

        if (npmResult.status !== 0) {
            throw new Error("Failed to install bpmnlint.");
        }

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }

}

async function copyCustomRules(customRules: string) {

    try {
        const textBlue = "\x1b[34m";
        const customRulesFiles = fs.readdirSync(customRules, 'utf-8');
        console.log(`${textBlue}Copying custom rules to ${CUSTOM_RULES_PATH}`);

        for (const file of customRulesFiles) {
            const sourceFilePath = path.join(customRules, file);
            const targetFilePath = path.join(CUSTOM_RULES_PATH, file);
            fs.copyFileSync(sourceFilePath, targetFilePath);
            console.log(`${textBlue}Copied: ${file}`);
        }

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }

}

async function listAvailableRules() {

    try {
        const availableRules = fs.readdirSync(CUSTOM_RULES_PATH);
        console.log()
        console.log(`Currently implemented rules:`, availableRules);
    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }

}

async function createBpmnlintrcFile(bpmnlintrcPath: string) {

    try {
        const bpmnlintrcContent = fs.readFileSync(bpmnlintrcPath, 'utf-8');
        const bpmnlintrcFile = path.join(process.cwd(), '.bpmnlintrc');
        fs.writeFileSync(bpmnlintrcFile, bpmnlintrcContent);

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }

}

async function validateBpmnFiles(bpmnFilesPath: string) {

    try {
        const colorReset = "\x1b[0m";
        const textRed = "\x1b[31m";
        const textGreen = "\x1b[32m";

        const bpmnFilesList = readdirSync(bpmnFilesPath, 'utf-8');

        for (const file of bpmnFilesList) {
            if (path.extname(file) === '.bpmn') {
                const filePath = path.join(bpmnFilesPath, file);
                console.log(`Validating ${file}...`);

                const lintCommand = 'bpmnlint';
                const lintArgs = [filePath];
                const lintResult = spawnSync(lintCommand, lintArgs, {encoding: 'utf-8'});

                if (lintResult.status === 0) {
                    console.log(`${textGreen}No errors found in: ${file}:`);
                    console.log(colorReset);
                } else {
                    console.log(`${textRed}Errors found in: ${file}:`);
                    console.log(lintResult.stdout);
                    console.log(colorReset);
                }

            }
        }

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }

}

async function runBpmnValidationWorkflow() {
    try {
        const customRules = getInput('custom-rules-folder');
        const bpmnFiles = getInput('bpmn-files-path');
        const bpmnlintrcPath = bpmnFiles + '/.bpmnlintrc';

        if (!bpmnFiles) {
            new Error("BPMN files path is required.");
        }

        await installBpmnlint();

        if (customRules) {
            await copyCustomRules(customRules);
        } else {
            console.log("No custom rules provided. Skipping copying custom rules.");
        }

        await listAvailableRules();
        await createBpmnlintrcFile(bpmnlintrcPath);
        await validateBpmnFiles(bpmnFiles);

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }
}

runBpmnValidationWorkflow()
    .then(() => {
        console.log("Workflow completed successfully.");
    })
    .catch((error) => {
        console.error("Workflow failed:", error);
    });
