export function validateBody(body, deleteOldComment, hideOldComment) {
    if (!deleteOldComment && !hideOldComment && !body) {
        throw new Error("Either message or path input is required");
    }
}
export function validateExclusiveModes(deleteOldComment, recreate, onlyCreateComment, onlyUpdateComment, hideOldComment, hideAndRecreate) {
    const exclusiveModes = [
        ["delete", deleteOldComment],
        ["recreate", recreate],
        ["only_create", onlyCreateComment],
        ["only_update", onlyUpdateComment],
        ["hide", hideOldComment],
        ["hide_and_recreate", hideAndRecreate],
    ];
    const enabledModes = exclusiveModes.filter(([, flag]) => flag).map(([name]) => name);
    if (enabledModes.length > 1) {
        const last = enabledModes[enabledModes.length - 1];
        const rest = enabledModes.slice(0, -1);
        const joined = enabledModes.length === 2 ? `${rest[0]} and ${last}` : `${rest.join(", ")}, and ${last}`;
        throw new Error(`${joined} cannot be set to true simultaneously`);
    }
}
