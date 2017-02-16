/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";

import { assert } from "chai";
import * as path from "path";
import { Strings } from "../../../src/helpers/strings";
import { Rename } from "../../../src/tfvc/commands/rename";
import { TfvcError, TfvcErrorCodes } from "../../../src/tfvc/tfvcerror";
import { IExecutionResult } from "../../../src/tfvc/interfaces";
import { TeamServerContext } from "../../../src/contexts/servercontext";
import { CredentialInfo } from "../../../src/info/credentialinfo";
import { RepositoryInfo } from "../../../src/info/repositoryinfo";

describe("Tfvc-RenameCommand", function() {
    let serverUrl: string = "http://server:8080/tfs";
    let repoUrl: string = "http://server:8080/tfs/collection1/_git/repo1";
    let collectionUrl: string = "http://server:8080/tfs/collection1";
    let user: string = "user1";
    let pass: string = "pass1";
    let context: TeamServerContext;

    beforeEach(function() {
        context = new TeamServerContext(repoUrl);
        context.CredentialInfo = new CredentialInfo(user, pass);
        context.RepoInfo = new RepositoryInfo({
            serverUrl: serverUrl,
            collection: {
                name: "collection1",
                id: ""
            },
            repository: {
                remoteUrl: repoUrl,
                id: "",
                name: "",
                project: {
                    name: "project1"
                }
            }
        });
    });

    it("should verify constructor - windows", function() {
        let startPath: string = "c:\\repos\\Tfvc.L2VSCodeExtension.RC\\";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");
        new Rename(undefined, sourcePath, destinationPath);
    });

    it("should verify constructor - mac/linux", function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");
        new Rename(undefined, sourcePath, destinationPath);
    });

    it("should verify constructor with context", function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");
        new Rename(context, sourcePath, destinationPath);
    });

    it("should verify constructor - no destination path", function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        assert.throws(() => new Rename(undefined, sourcePath, undefined), TfvcError, /Argument is required/);
    });

    it("should verify constructor - no source path", function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let destinationPath: string = path.join(startPath, "READU.md");
        assert.throws(() => new Rename(undefined, undefined, destinationPath), TfvcError, /Argument is required/);
    });

    it("should verify arguments", function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");

        let cmd: Rename = new Rename(context, sourcePath, destinationPath);

        assert.equal(cmd.GetArguments().GetArgumentsForDisplay(), "rename -noprompt -collection:" + collectionUrl + " ******** " + sourcePath + " " + destinationPath);
    });

    it("should verify parse output - source file not in workspace", async function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");

        let cmd: Rename = new Rename(context, sourcePath, destinationPath);
        let executionResult: IExecutionResult = {
            exitCode: 100,
            stdout: undefined,
            stderr: `The item ${sourcePath} could not be found in your workspace, or you do not have permission to access it.\n`
        };

        try {
            await cmd.ParseOutput(executionResult);
        } catch (err) {
            assert.equal(err.exitCode, 100);
            assert.equal(err.tfvcCommand, "rename");
            assert.equal(err.tfvcErrorCode, TfvcErrorCodes.FileNotInWorkspace);
        }
    });

    it("should verify parse output - error exit code, stdout", async function() {
        let startPath: string = "/usr/alias/repos/Tfvc.L2VSCodeExtension.RC/";
        let sourcePath: string = path.join(startPath, "README.md");
        let destinationPath: string = path.join(startPath, "READU.md");

        let cmd: Rename = new Rename(context, sourcePath, destinationPath);
        let executionResult: IExecutionResult = {
            exitCode: 42,
            stdout: "Something bad this way comes.",
            stderr: undefined
        };

        try {
            await cmd.ParseOutput(executionResult);
        } catch (err) {
            assert.equal(err.exitCode, 42);
            assert.equal(err.tfvcCommand, "rename");
            assert.equal(err.message.indexOf(Strings.TfExecFailedError), 0);
            assert.equal(err.stdout.indexOf("Something bad this way comes."), 0);
        }
    });

});
