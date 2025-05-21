"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const task_manager_1 = require("@_koii/task-manager");
const _0_setup_1 = require("./task/0-setup");
const _1_task_1 = require("./task/1-task");
const _2_submission_1 = require("./task/2-submission");
const _3_audit_1 = require("./task/3-audit");
const _4_distribution_1 = require("./task/4-distribution");
const _5_routes_1 = require("./task/5-routes");
// import { initializeOrcaClient } from "@_koii/task-manager/extensions";
const orca_1 = require("./orca");
const orcaSettings_1 = require("./orcaSettings");
(0, task_manager_1.initializeTaskManager)({
    setup: _0_setup_1.setup,
    task: _1_task_1.task,
    submission: _2_submission_1.submission,
    audit: _3_audit_1.audit,
    distribution: _4_distribution_1.distribution,
    routes: _5_routes_1.routes,
});
(0, orca_1.initializeOrcaClient)(orcaSettings_1.getConfig);
