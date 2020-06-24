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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const github_1 = require("@actions/github");
const comment_1 = require("./comment");
const fs_1 = require("fs");
function run() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const number = ((_b = (_a = github_1.context === null || github_1.context === void 0 ? void 0 : github_1.context.payload) === null || _a === void 0 ? void 0 : _a.pull_request) === null || _b === void 0 ? void 0 : _b.number) ||
            +core.getInput("number", { required: false });
        if (isNaN(number) || number < 1) {
            core.info("no numbers given: skip step");
            return;
        }
        try {
            const repo = github_1.context.repo;
            const message = core.getInput("message", { required: false });
            const path = core.getInput("path", { required: false });
            const header = core.getInput("header", { required: false }) || "";
            const append = core.getInput("append", { required: false }) || false;
            const githubToken = core.getInput("GITHUB_TOKEN", { required: true });
            const octokit = new github_1.GitHub(githubToken);
            const previous = yield comment_1.findPreviousComment(octokit, repo, number, header);
            if (!message && !path) {
                throw { message: 'Either message or path input is required' };
            }
            let body;
            if (path) {
                body = fs_1.readFileSync(path);
            }
            else {
                body = message;
            }
            if (previous) {
                if (append) {
                    yield comment_1.updateComment(octokit, repo, previous.id, body, header, previous.body);
                }
                else {
                    yield comment_1.updateComment(octokit, repo, previous.id, body, header);
                }
            }
            else {
                yield comment_1.createComment(octokit, repo, number, body, header);
            }
        }
        catch ({ message }) {
            core.setFailed(message);
        }
    });
}
run();
