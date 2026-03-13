"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoreEmpty = exports.githubToken = exports.hideOldComment = exports.skipUnchanged = exports.onlyUpdateComment = exports.onlyCreateComment = exports.deleteOldComment = exports.hideClassify = exports.hideAndRecreate = exports.recreate = exports.hideDetails = exports.append = exports.header = exports.repo = exports.pullRequestNumber = void 0;
exports.getBody = getBody;
const node_fs_1 = require("node:fs");
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const glob_1 = require("@actions/glob");
exports.pullRequestNumber = github_1.context?.payload?.pull_request?.number || +core.getInput("number", { required: false });
exports.repo = buildRepo();
exports.header = core.getInput("header", { required: false });
exports.append = core.getBooleanInput("append", { required: true });
exports.hideDetails = core.getBooleanInput("hide_details", {
    required: true,
});
exports.recreate = core.getBooleanInput("recreate", { required: true });
exports.hideAndRecreate = core.getBooleanInput("hide_and_recreate", {
    required: true,
});
exports.hideClassify = core.getInput("hide_classify", {
    required: true,
});
exports.deleteOldComment = core.getBooleanInput("delete", { required: true });
exports.onlyCreateComment = core.getBooleanInput("only_create", {
    required: true,
});
exports.onlyUpdateComment = core.getBooleanInput("only_update", {
    required: true,
});
exports.skipUnchanged = core.getBooleanInput("skip_unchanged", {
    required: true,
});
exports.hideOldComment = core.getBooleanInput("hide", { required: true });
exports.githubToken = core.getInput("GITHUB_TOKEN", { required: true });
exports.ignoreEmpty = core.getBooleanInput("ignore_empty", {
    required: true,
});
function buildRepo() {
    return {
        owner: core.getInput("owner", { required: false }) || github_1.context.repo.owner,
        repo: core.getInput("repo", { required: false }) || github_1.context.repo.repo,
    };
}
async function getBody() {
    const pathInput = core.getMultilineInput("path", { required: false });
    const followSymbolicLinks = core.getBooleanInput("follow_symbolic_links", {
        required: true,
    });
    if (pathInput && pathInput.length > 0) {
        try {
            const globber = await (0, glob_1.create)(pathInput.join("\n"), {
                followSymbolicLinks,
                matchDirectories: false,
            });
            return (await globber.glob()).map(path => (0, node_fs_1.readFileSync)(path, "utf-8")).join("\n");
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
            return "";
        }
    }
    else {
        return core.getInput("message", { required: false });
    }
}
