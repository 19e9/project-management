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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const argon2 = __importStar(require("argon2"));
const app_module_1 = require("./dist/app.module");
const user_schema_1 = require("./dist/users/schemas/user.schema");
const workspace_schema_1 = require("./dist/workspaces/schemas/workspace.schema");
const workspace_member_schema_1 = require("./dist/workspaces/schemas/workspace-member.schema");
const project_schema_1 = require("./dist/projects/schemas/project.schema");
const task_schema_1 = require("./dist/tasks/schemas/task.schema");
const task_dependency_schema_1 = require("./dist/dependencies/schemas/task-dependency.schema");
const cpm_service_1 = require("./dist/planning/cpm.service");
dotenv.config();
async function run() {
    const log = new common_1.Logger('Seed');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const Users = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const Workspaces = app.get((0, mongoose_1.getModelToken)(workspace_schema_1.Workspace.name));
    const Members = app.get((0, mongoose_1.getModelToken)(workspace_member_schema_1.WorkspaceMember.name));
    const Projects = app.get((0, mongoose_1.getModelToken)(project_schema_1.Project.name));
    const Tasks = app.get((0, mongoose_1.getModelToken)(task_schema_1.Task.name));
    const Deps = app.get((0, mongoose_1.getModelToken)(task_dependency_schema_1.TaskDependency.name));
    const cpm = app.get(cpm_service_1.CpmService);
    log.log('Wiping existing demo data...');
    await Promise.all([
        Users.deleteMany({ email: { $in: ['owner@demo.local', 'member@demo.local'] } }),
    ]);
    log.log('Creating users...');
    const passwordHash = await argon2.hash('Passw0rd!');
    const owner = await Users.create({
        email: 'owner@demo.local',
        passwordHash,
        displayName: 'Demo Owner',
        authProviders: ['local'],
        platformRole: 'platform_admin',
    });
    const member = await Users.create({
        email: 'member@demo.local',
        passwordHash,
        displayName: 'Demo Member',
        authProviders: ['local'],
    });
    log.log('Creating workspace + memberships...');
    const ws = await Workspaces.create({
        name: 'Demo Construction Co.',
        ownerId: owner._id,
        plan: 'pro',
        entitlements: workspace_schema_1.PLAN_DEFAULTS.pro,
    });
    await Members.insertMany([
        { workspaceId: ws._id, userId: owner._id, role: 'owner', status: 'active' },
        { workspaceId: ws._id, userId: member._id, role: 'member', status: 'active' },
    ]);
    log.log('Creating project...');
    await Projects.deleteMany({ workspaceId: ws._id });
    const project = await Projects.create({
        workspaceId: ws._id,
        name: 'House Build — Plot 14',
        description: 'Demo project showcasing WBS, dependencies, and CPM.',
        code: 'PLT14',
        status: 'active',
        leadId: owner._id,
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T00:00:00.000Z'),
    });
    log.log('Creating WBS tasks...');
    await Tasks.deleteMany({ projectId: project._id });
    await Deps.deleteMany({ projectId: project._id });
    const D = (s) => new Date(s + 'T00:00:00.000Z');
    const mkTask = async (over) => Tasks.create({
        workspaceId: ws._id,
        projectId: project._id,
        title: over.title,
        parentTaskId: over.parent ?? null,
        wbsCode: over.wbs,
        startDate: D(over.start),
        endDate: D(over.end),
        durationDays: over.duration,
        status: 'not_started',
        priority: 'medium',
        assigneeIds: over.assignees ?? [],
        sortOrder: over.sortOrder ?? 0,
    });
    const foundation = await mkTask({
        title: '1. Foundation',
        wbs: '1',
        start: '2026-05-01',
        end: '2026-05-10',
        duration: 10,
        sortOrder: 1,
    });
    const excavation = await mkTask({
        title: '1.1 Excavation',
        parent: foundation._id,
        wbs: '1.1',
        start: '2026-05-01',
        end: '2026-05-04',
        duration: 4,
        assignees: [member._id],
        sortOrder: 1,
    });
    const slab = await mkTask({
        title: '1.2 Slab pour',
        parent: foundation._id,
        wbs: '1.2',
        start: '2026-05-05',
        end: '2026-05-10',
        duration: 6,
        assignees: [member._id],
        sortOrder: 2,
    });
    const framing = await mkTask({
        title: '2. Framing',
        wbs: '2',
        start: '2026-05-11',
        end: '2026-05-25',
        duration: 15,
        assignees: [member._id],
        sortOrder: 2,
    });
    const roofing = await mkTask({
        title: '3. Roofing',
        wbs: '3',
        start: '2026-05-26',
        end: '2026-06-02',
        duration: 8,
        assignees: [member._id],
        sortOrder: 3,
    });
    const interior = await mkTask({
        title: '4. Interior',
        wbs: '4',
        start: '2026-05-26',
        end: '2026-06-15',
        duration: 21,
        assignees: [member._id],
        sortOrder: 4,
    });
    log.log('Creating dependencies (FS)...');
    const link = (predId, succId, lag = 0) => Deps.create({
        workspaceId: ws._id,
        projectId: project._id,
        predecessorId: predId,
        successorId: succId,
        type: 'FS',
        lagDays: lag,
    });
    await link(excavation._id, slab._id);
    await link(slab._id, framing._id);
    await link(framing._id, roofing._id);
    await link(roofing._id, interior._id);
    log.log('Computing CPM snapshot...');
    const result = await cpm.compute(String(project._id));
    log.log(`CPM done — duration: ${result.durationDays}d, critical tasks: ${result.criticalTaskIds.length}`);
    log.log('Seed complete.');
    log.log('  Login: owner@demo.local / Passw0rd!');
    log.log('  Login: member@demo.local / Passw0rd!');
    await app.close();
}
run().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map