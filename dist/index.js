Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const github = tslib_1.__importStar(require("@actions/github"));
const comment_1 = require("./comment");
const config_1 = require("./config");
async function run() {
    if (Number.isNaN(config_1.pullRequestNumber) || config_1.pullRequestNumber < 1) {
        core.info("no pull request numbers given: skip step");
        return;
    }
    try {
        const body = await (0, config_1.getBody)();
        if (!body && config_1.ignoreEmpty) {
            core.info("no body given: skip step by ignoreEmpty");
            return;
        }
        if (!config_1.deleteOldComment && !config_1.hideOldComment && !body) {
            throw new Error("Either message or path input is required");
        }
        if (config_1.deleteOldComment && config_1.recreate) {
            throw new Error("delete and recreate cannot be both set to true");
        }
        if (config_1.onlyCreateComment && config_1.onlyUpdateComment) {
            throw new Error("only_create and only_update cannot be both set to true");
        }
        if (config_1.hideOldComment && config_1.hideAndRecreate) {
            throw new Error("hide and hide_and_recreate cannot be both set to true");
        }
        const octokit = github.getOctokit(config_1.githubToken);
        const previous = await (0, comment_1.findPreviousComment)(octokit, config_1.repo, config_1.pullRequestNumber, config_1.header);
        core.setOutput("previous_comment_id", previous?.id);
        if (config_1.deleteOldComment) {
            if (previous) {
                await (0, comment_1.deleteComment)(octokit, previous.id);
            }
            return;
        }
        if (!previous) {
            if (config_1.onlyUpdateComment) {
                return;
            }
            const created = await (0, comment_1.createComment)(octokit, config_1.repo, config_1.pullRequestNumber, body, config_1.header);
            core.setOutput("created_comment_id", created?.data.id);
            return;
        }
        if (config_1.onlyCreateComment) {
            // don't comment anything, user specified only_create and there is an
            // existing comment, so this is probably a placeholder / introduction one.
            return;
        }
        if (config_1.hideOldComment) {
            await (0, comment_1.minimizeComment)(octokit, previous.id, config_1.hideClassify);
            return;
        }
        if (config_1.skipUnchanged && (0, comment_1.commentsEqual)(body, previous.body || "", config_1.header)) {
            // don't recreate or update if the message is unchanged
            return;
        }
        const previousBody = (0, comment_1.getBodyOf)({ body: previous.body || "" }, config_1.append, config_1.hideDetails);
        if (config_1.recreate) {
            await (0, comment_1.deleteComment)(octokit, previous.id);
            const created = await (0, comment_1.createComment)(octokit, config_1.repo, config_1.pullRequestNumber, body, config_1.header, previousBody);
            core.setOutput("created_comment_id", created?.data.id);
            return;
        }
        if (config_1.hideAndRecreate) {
            await (0, comment_1.minimizeComment)(octokit, previous.id, config_1.hideClassify);
            const created = await (0, comment_1.createComment)(octokit, config_1.repo, config_1.pullRequestNumber, body, config_1.header);
            core.setOutput("created_comment_id", created?.data.id);
            return;
        }
        await (0, comment_1.updateComment)(octokit, previous.id, body, config_1.header, previousBody);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
run();
//# sourceMappingURL=index.js.map
