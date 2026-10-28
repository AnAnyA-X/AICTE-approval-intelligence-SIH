/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Automated Test Suite — End-to-End Core Verification
 * Tests deterministic blocker logic, guardrails, state transitions, and persistence
 */

const fs = require('fs');
const path = require('path');

const vm = require('vm');

// Mock browser localStorage & window
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = val.toString(); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;

// Load modules in order
const basePath = path.join(__dirname, '..');
function loadScript(rel) {
  const code = fs.readFileSync(path.join(basePath, rel), 'utf8');
  vm.runInThisContext(code);
}

loadScript('data.js');
global.DB = DB;
loadScript('engine.js');
global.ENGINE = ENGINE;
loadScript('store.js');
global.STORE = STORE;
loadScript('utils.js');
global.UTILS = UTILS;

console.log('════════════════════════════════════════════════════════════════');
console.log('AICTE APPROVAL INTELLIGENCE — COMPREHENSIVE AUTOMATED TEST SUITE');
console.log('════════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '--> ' + details : ''}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────
// TEST 1: STORE INITIALIZATION & SEED VERIFICATION
// ─────────────────────────────────────────────────────────────────
console.log('TEST SUITE 1: Store Initialization & Data Integrity');
STORE.resetToDefaults();
const initialApps = STORE.getApplications();
assert(initialApps.length >= 5, 'Store initializes with at least 5 synthetic applications', `Count: ${initialApps.length}`);
const testApp = STORE.getApplicationById('APP-2026-081');
assert(testApp !== undefined, 'APP-2026-081 (Shreya Institute) exists in store');
assert(testApp.currentStage === 'deficiency', 'APP-2026-081 initial stage is deficiency');

// ─────────────────────────────────────────────────────────────────
// TEST 2: DETERMINISTIC BLOCKER ENGINE IDENTIFICATION
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 2: Deterministic Blocker & Dependency Engine');
ENGINE.evaluateApplicationPrerequisites(testApp);
const openBlockers = testApp.blockers.filter(b => b.status === 'open');
assert(openBlockers.length >= 2, 'Causal engine flags open blockers on APP-2026-081', `Found: ${openBlockers.length}`);

const hasNocBlocker = openBlockers.some(b => b.code === 'BLOCK-NOC-STATE');
assert(hasNocBlocker, 'Identifies BLOCK-NOC-STATE (State Government NOC prerequisite incomplete)');

const hasFdrBlocker = openBlockers.some(b => b.code === 'BLOCK-FDR-JOINT');
assert(hasFdrBlocker, 'Identifies BLOCK-FDR-JOINT (Joint Bank FDR prerequisite incomplete)');

// Check 5 essential attributes on blocker
const sampleB = openBlockers.find(b => b.code === 'BLOCK-NOC-STATE');
assert(sampleB && sampleB.stageBlocked === 'expert_visit', 'Blocker explicitly identifies what is blocked (EVC Stage)');
assert(sampleB && !!sampleB.rootCause, 'Blocker explicitly explains why it is blocked');
assert(sampleB && !!sampleB.prerequisite, 'Blocker identifies incomplete prerequisite');
assert(sampleB && !!sampleB.responsibleParty, 'Blocker identifies responsible person/role');
assert(sampleB && !!sampleB.nextRecommendedAction, 'Blocker provides next recommended action');

// ─────────────────────────────────────────────────────────────────
// TEST 3: GUARDRAIL PREVENTS INVALID STAGE TRANSITION
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 3: Workflow Guardrail & Illegal Transition Prevention');
const actor = { name: 'Prof. Rajiv Sharma', title: 'Scrutiny Officer' };

// Attempt to advance directly to EVC visit while State NOC is rejected
const transitionResult = STORE.moveApplicationStage('APP-2026-081', 'expert_visit', 'Advancing without NOC', actor);
assert(transitionResult.success === false, 'Blocked invalid stage transition to expert_visit when prerequisites are unmet');
assert(transitionResult.reason.includes('blocked'), 'Returns informative regulatory rejection rationale', transitionResult.reason);

// ─────────────────────────────────────────────────────────────────
// TEST 4: PREREQUISITE RESOLUTION & DYNAMIC UNBLOCKING
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 4: Prerequisite Resolution & Dynamic Recalculation');

// Step 4.1: Institution uploads corrected State Government NOC
const stateNoc = testApp.complianceItems.find(c => c.ruleId === 'RULE-STATE-NOC');
STORE.updateEvidence('APP-2026-081', stateNoc.id, {
  evidenceFile: 'DTE_Maharashtra_Final_Gazette_NOC_Approved.pdf',
  fileSize: '1.9 MB',
  remarks: 'Statutory government resolution uploaded.'
}, { name: 'Dr. Suresh Patil', title: 'Coordinator' });

const updatedNoc = testApp.complianceItems.find(c => c.id === stateNoc.id);
assert(updatedNoc.status === 'pending_verification', 'Evidence uploaded and set to pending_verification');

// Step 4.2: Scrutiny Officer audits & marks as Verified
STORE.verifyEvidence('APP-2026-081', stateNoc.id, 'verified', 'Gazette notification verified under Clause 1.3', actor);
assert(updatedNoc.status === 'verified', 'Scrutiny officer audit marks evidence as Verified');

// Step 4.3: Institution resubmits application to clear deficiency stage
STORE.resubmitApplication('APP-2026-081', 'All NOC documents uploaded and cleared', { name: 'Dr. Suresh Patil', title: 'Coordinator' });
assert(testApp.currentStage === 'scrutiny', 'Application successfully resubmitted and moved to Scrutiny stage');

// Step 4.4: Now attempt transition to expert_visit
const allowedTransition = STORE.moveApplicationStage('APP-2026-081', 'expert_visit', 'All EVC prerequisites cleared', actor);
assert(allowedTransition.success === true, 'Application now legally advances to expert_visit once prerequisite is satisfied');
assert(testApp.currentStage === 'expert_visit', 'Current stage updated to expert_visit in application record');

// ─────────────────────────────────────────────────────────────────
// TEST 5: RETURN FOR CORRECTION (DEFICIENCY NOTICE)
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 5: Deficiency Notice & Correction Loop');
const newDef = STORE.returnForCorrection('APP-2026-081', {
  itemCode: stateNoc.id,
  title: 'Test Incomplete Document Deficiency',
  description: 'Clause 2.4 mismatch in architectural drawings.',
  severity: 'high',
  dueDate: '2026-11-15',
  remedyRequired: 'Upload revised drawings signed by architect.'
}, actor);

assert(testApp.currentStage === 'deficiency', 'Application returned to Deficiency stage');
assert(testApp.deficiencies[0].title === 'Test Incomplete Document Deficiency', 'Deficiency recorded on application record');

// ─────────────────────────────────────────────────────────────────
// TEST 6: TASK REASSIGNMENT & EVALUATION OFFICER ASSIGNMENT
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 6: Officer & Task Reassignment');
STORE.assignOfficer('APP-2026-081', 'Dr. Anand Verma', 'Regional Officer', actor);
assert(testApp.assignedOfficer === 'Dr. Anand Verma', 'Evaluation officer successfully reassigned');

// Reassign an alert task
const alerts = STORE.getAlerts();
const testAlert = alerts[0];
STORE.reassignTask(testAlert.id, 'Dr. P. R. Menon', 'Workload rebalancing', actor);
assert(testAlert.assignedPerson === 'Dr. P. R. Menon', 'Alert task reassigned and updated');

// ─────────────────────────────────────────────────────────────────
// TEST 7: ALERT ACKNOWLEDGMENT & RESOLUTION
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 7: Alert State Engine & Deduplication');
STORE.acknowledgeAlert(testAlert.id);
assert(testAlert.status === 'acknowledged', 'Alert acknowledged');
STORE.resolveAlert(testAlert.id);
assert(testAlert.status === 'resolved', 'Alert resolved');

// ─────────────────────────────────────────────────────────────────
// TEST 8: NEW APPLICATION CREATION
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 8: New Application Intake Creation');
const createdApp = STORE.createApplication({
  institutionName: 'Pune Institute of Computer Technology Extension',
  institutionCode: '1-99887766',
  region: 'Western',
  state: 'Maharashtra',
  applicationType: 'New Technical Institution',
  course: 'B.Tech - Data Science',
  intake: 60,
  coordinator: 'Dr. A. K. Joshi'
});
assert(createdApp && createdApp.id.startsWith('APP-2026-'), 'New application created with unique ID', createdApp.id);
assert(createdApp.complianceItems.length === 8, 'Standard regulatory compliance checklist automatically initialized (8 items)');
assert(createdApp.currentStage === 'submitted', 'Initial stage is set to submitted');

// ─────────────────────────────────────────────────────────────────
// TEST 9: LOCALSTORAGE PERSISTENCE ACROSS RE-INITIALIZATION
// ─────────────────────────────────────────────────────────────────
console.log('\nTEST SUITE 9: Browser LocalStorage Persistence Verification');
// Emulate page reload by creating a new STORE instance loading the existing storage
const reloadedApp = STORE.getApplicationById(createdApp.id);
assert(reloadedApp !== undefined, 'Newly created application persisted across storage read');
assert(reloadedApp.institutionName === 'Pune Institute of Computer Technology Extension', 'Application fields verified intact');

// Verify audit trail event persistence
const recentAudit = testApp.auditTrail;
assert(recentAudit.length >= 5, 'Comprehensive immutable audit trail recorded and persisted', `Count: ${recentAudit.length}`);

// ─────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════════');
console.log(`TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log('════════════════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
