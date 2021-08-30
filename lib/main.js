"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const comment_1 = require("./comment");
const config_1 = require("./config");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isNaN(config_1.pullRequestNumber) || config_1.pullRequestNumber < 1) {
            core.info("no pull request numbers given: skip step");
            return;
        }
        try {
            if (!config_1.deleteOldComment && !config_1.body) {
                throw new Error("Either message or path input is required");
            }
            if (config_1.deleteOldComment && config_1.recreate) {
                throw new Error("delete and recreate cannot be both set to true");
            }
            const octokit = github.getOctokit(config_1.githubToken);
            const previous = yield (0, comment_1.findPreviousComment)(octokit, config_1.repo, config_1.pullRequestNumber, config_1.header);
            if (!previous) {
                yield (0, comment_1.createComment)(octokit, config_1.repo, config_1.pullRequestNumber, config_1.body, config_1.header);
                return;
            }
            if (config_1.deleteOldComment) {
                yield (0, comment_1.deleteComment)(octokit, config_1.repo, previous.id);
                return;
            }
            const previousBody = config_1.append ? previous.body : undefined;
            if (config_1.recreate) {
                yield (0, comment_1.deleteComment)(octokit, config_1.repo, previous.id);
                yield (0, comment_1.createComment)(octokit, config_1.repo, config_1.pullRequestNumber, config_1.body, config_1.header, previousBody);
                return;
            }
            yield (0, comment_1.updateComment)(octokit, config_1.repo, previous.id, config_1.body, config_1.header, previousBody);
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
        }
    });
}
run();
