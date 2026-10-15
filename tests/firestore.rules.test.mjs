// Firestore 보안 규칙 테스트 — 에뮬레이터에서 실행: npm run test:rules
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";

const TASK = { title: "로그인 화면", description: "", status: "todo", statusSource: "manual", assigneeId: null, startDate: null, dueDate: null };

const CODE = "K7Q2MX";
const PID = "p1";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-teamkit",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const db = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

/** 규칙을 거치지 않고 프로젝트(owner = alice) + 초대 코드를 미리 만든다. withBob 이면 bob 이 참여한 상태 */
async function seedProject({ withBob = false } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore();
    await setDoc(doc(admin, "projects", PID), {
      name: "쇼핑몰 클론",
      inviteCode: CODE,
      ownerId: "alice",
      memberIds: withBob ? ["alice", "bob"] : ["alice"],
      taskCounter: 0,
      createdAt: new Date(),
    });
    await setDoc(doc(admin, "inviteCodes", CODE), { projectId: PID, createdAt: new Date() });
    if (withBob) await setDoc(doc(admin, "projects", PID, "joins", "bob"), { code: CODE, at: new Date() });
  });
}

/** 앱의 deleteProject 와 같은 배치 (참여 기록 → 초대 코드 → 프로젝트) */
async function deleteBatch(uid) {
  const d = db(uid);
  const joins = await getDocs(collection(d, "projects", PID, "joins"));
  const b = writeBatch(d);
  joins.forEach((j) => b.delete(j.ref));
  b.delete(doc(d, "inviteCodes", CODE));
  b.delete(doc(d, "projects", PID));
  return b;
}

/** 앱의 createProject 와 같은 배치 */
function createBatch(uid, { pid = "new1", code = "ABCD23", memberIds = [uid], ownerId = uid } = {}) {
  const d = db(uid);
  const b = writeBatch(d);
  b.set(doc(d, "projects", pid), { name: "새 프로젝트", inviteCode: code, ownerId, memberIds, taskCounter: 0, createdAt: serverTimestamp() });
  b.set(doc(d, "inviteCodes", code), { projectId: pid, createdAt: serverTimestamp() });
  return b;
}

/** 앱의 joinProject 와 같은 배치 */
function joinBatch(uid, code) {
  const d = db(uid);
  const b = writeBatch(d);
  b.set(doc(d, "projects", PID, "joins", uid), { code, at: serverTimestamp() });
  b.update(doc(d, "projects", PID), { memberIds: arrayUnion(uid) });
  return b;
}

describe("users", () => {
  test("본인 문서는 쓸 수 있다", async () => {
    await assertSucceeds(setDoc(doc(db("alice"), "users", "alice"), { name: "앨리스" }));
  });
  test("남의 문서는 쓸 수 없다", async () => {
    await assertFails(setDoc(doc(db("bob"), "users", "alice"), { name: "해킹" }));
  });
  test("로그인 안 하면 읽을 수 없다", async () => {
    await assertFails(getDoc(doc(db(null), "users", "alice")));
  });
  test("남의 GitHub 토큰은 읽을 수 없다", async () => {
    await assertFails(getDoc(doc(db("bob"), "users", "alice", "private", "github")));
  });
});

describe("프로젝트 만들기", () => {
  test("본인이 만든 사람이자 유일한 멤버면 성공", async () => {
    await assertSucceeds(createBatch("alice").commit());
  });
  test("초대 코드 문서 없이 프로젝트만 만들 수 없다", async () => {
    const d = db("alice");
    await assertFails(setDoc(doc(d, "projects", "new1"), { name: "x", inviteCode: "ABCD23", ownerId: "alice", memberIds: ["alice"], taskCounter: 0, createdAt: serverTimestamp() }));
  });
  test("다른 사람을 멤버로 넣어서 만들 수 없다", async () => {
    await assertFails(createBatch("alice", { memberIds: ["alice", "bob"] }).commit());
  });
  test("다른 사람을 만든 사람으로 지정할 수 없다", async () => {
    await assertFails(createBatch("alice", { ownerId: "bob" }).commit());
  });
  test("이미 쓰고 있는 초대 코드로 만들 수 없다", async () => {
    await seedProject();
    await assertFails(createBatch("bob", { code: CODE }).commit());
  });
  test("형식에 안 맞는 초대 코드(헷갈리는 0·O·1·I 포함)는 거부", async () => {
    await assertFails(createBatch("alice", { code: "ABC0O1" }).commit());
  });
});

describe("프로젝트 읽기", () => {
  test("멤버는 읽을 수 있다", async () => {
    await seedProject();
    await assertSucceeds(getDoc(doc(db("alice"), "projects", PID)));
  });
  test("멤버가 아니면 읽을 수 없다", async () => {
    await seedProject();
    await assertFails(getDoc(doc(db("bob"), "projects", PID)));
  });
  test("초대 코드는 코드를 알면 단건 조회 가능", async () => {
    await seedProject();
    await assertSucceeds(getDoc(doc(db("bob"), "inviteCodes", CODE)));
  });
});

describe("초대 코드로 참여", () => {
  test("맞는 코드면 본인이 참여된다", async () => {
    await seedProject();
    await assertSucceeds(joinBatch("bob", CODE).commit());
    await assertSucceeds(getDoc(doc(db("bob"), "projects", PID)));
  });
  test("틀린 코드면 참여할 수 없다", async () => {
    await seedProject();
    await assertFails(joinBatch("bob", "ZZZZ22").commit());
  });
  test("참여 증명(joins) 없이 memberIds만 바꿀 수 없다", async () => {
    await seedProject();
    await assertFails(updateDoc(doc(db("bob"), "projects", PID), { memberIds: arrayUnion("bob") }));
  });
  test("참여하면서 다른 사람까지 넣을 수 없다", async () => {
    await seedProject();
    const d = db("bob");
    const b = writeBatch(d);
    b.set(doc(d, "projects", PID, "joins", "bob"), { code: CODE, at: serverTimestamp() });
    b.update(doc(d, "projects", PID), { memberIds: arrayUnion("bob", "mallory") });
    await assertFails(b.commit());
  });
  test("참여하면서 이름 등 다른 필드를 바꿀 수 없다", async () => {
    await seedProject();
    const d = db("bob");
    const b = writeBatch(d);
    b.set(doc(d, "projects", PID, "joins", "bob"), { code: CODE, at: serverTimestamp() });
    b.update(doc(d, "projects", PID), { memberIds: arrayUnion("bob"), name: "내 프로젝트" });
    await assertFails(b.commit());
  });
  test("다른 사람 이름으로 참여 증명을 쓸 수 없다", async () => {
    await seedProject();
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "joins", "carol"), { code: CODE, at: serverTimestamp() }));
  });
});

describe("나가기", () => {
  test("멤버는 자기 자신만 빼고 나갈 수 있다", async () => {
    await seedProject({ withBob: true });
    const d = db("bob");
    const b = writeBatch(d);
    b.update(doc(d, "projects", PID), { memberIds: arrayRemove("bob") });
    b.delete(doc(d, "projects", PID, "joins", "bob"));
    await assertSucceeds(b.commit());
    await assertFails(getDoc(doc(db("bob"), "projects", PID)));
  });
  test("다른 멤버를 내보낼 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(updateDoc(doc(db("bob"), "projects", PID), { memberIds: arrayRemove("alice") }));
  });
  test("만든 사람은 나가기로 빠질 수 없다 (삭제만 가능)", async () => {
    await seedProject({ withBob: true });
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { memberIds: arrayRemove("alice") }));
  });
});

describe("프로젝트 삭제", () => {
  test("만든 사람은 프로젝트 · 초대 코드 · 참여 기록을 한 번에 지울 수 있다", async () => {
    await seedProject({ withBob: true });
    await assertSucceeds((await deleteBatch("alice")).commit());
    const code = await getDoc(doc(db("bob"), "inviteCodes", CODE));
    assert.equal(code.exists(), false, "초대 코드도 함께 지워져야 함");
  });
  test("멤버는 프로젝트를 지울 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(deleteDoc(doc(db("bob"), "projects", PID)));
  });
  test("멤버는 초대 코드를 지울 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(deleteDoc(doc(db("bob"), "inviteCodes", CODE)));
  });
  test("멤버는 참여 기록 목록을 볼 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(getDocs(collection(db("bob"), "projects", PID, "joins")));
  });
});

/** 앱의 createTask 와 같은 쓰기: taskCounter +1 과 같은 번호로 할 일 생성 (+ 생성 기록) */
function createTaskBatch(uid, { number = 1, counter = 1, extra = {} } = {}) {
  const d = db(uid);
  const b = writeBatch(d);
  b.update(doc(d, "projects", PID), { taskCounter: counter });
  b.set(doc(d, "projects", PID, "tasks", "t1"), { ...TASK, ...extra, number, createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  b.set(doc(d, "projects", PID, "tasks", "t1", "history", "h1"), { from: null, to: "todo", source: "manual", actor: uid, at: serverTimestamp() });
  return b;
}

async function seedTask({ createdBy = "alice", assigneeId = null } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const admin = ctx.firestore();
    await updateDoc(doc(admin, "projects", PID), { taskCounter: 1 });
    await setDoc(doc(admin, "projects", PID, "tasks", "t1"), { ...TASK, assigneeId, number: 1, createdBy, createdAt: new Date(), updatedAt: new Date() });
  });
}

/** alice(프로젝트 만든 사람) + bob + carol 멤버 */
async function seedThreeMembers() {
  await seedProject({ withBob: true });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "projects", PID), { memberIds: ["alice", "bob", "carol"] });
  });
}

describe("할 일", () => {
  test("멤버는 카드 번호를 1 올리면서 할 일을 만들 수 있다", async () => {
    await seedProject({ withBob: true });
    await assertSucceeds(createTaskBatch("bob").commit());
  });
  test("멤버가 아니면 할 일을 만들 수 없다", async () => {
    await seedProject();
    await assertFails(createTaskBatch("mallory").commit());
  });
  test("카드 번호를 건너뛸 수 없다 (counter 0 → 2)", async () => {
    await seedProject();
    await assertFails(createTaskBatch("alice", { number: 2, counter: 2 }).commit());
  });
  test("번호를 안 올리고 만들 수 없다 (중복 번호 방지)", async () => {
    await seedProject();
    const d = db("alice");
    await assertFails(setDoc(doc(d, "projects", PID, "tasks", "t1"), { ...TASK, number: 0, createdBy: "alice", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });
  test("멤버가 아닌 사람을 담당자로 지정할 수 없다", async () => {
    await seedProject();
    await assertFails(createTaskBatch("alice", { extra: { assigneeId: "mallory" } }).commit());
  });
  test("시작일이 마감일보다 늦을 수 없다", async () => {
    await seedProject();
    await assertFails(createTaskBatch("alice", { extra: { startDate: "2026-10-20", dueDate: "2026-10-10" } }).commit());
  });
  test("멤버가 아니면 할 일을 읽을 수 없다", async () => {
    await seedProject();
    await seedTask();
    await assertFails(getDoc(doc(db("mallory"), "projects", PID, "tasks", "t1")));
  });
  test("멤버는 상태를 바꿀 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedTask();
    await assertSucceeds(updateDoc(doc(db("bob"), "projects", PID, "tasks", "t1"), { status: "doing", updatedAt: serverTimestamp() }));
  });
  test("카드 번호는 바꿀 수 없다", async () => {
    await seedProject();
    await seedTask();
    await assertFails(updateDoc(doc(db("alice"), "projects", PID, "tasks", "t1"), { number: 99, updatedAt: serverTimestamp() }));
  });
  test("taskCounter 외의 프로젝트 필드는 같이 못 바꾼다", async () => {
    await seedProject({ withBob: true });
    await assertFails(updateDoc(doc(db("bob"), "projects", PID), { taskCounter: 1, name: "해킹" }));
  });
  test("변경 기록에 남의 이름을 쓸 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedTask();
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "tasks", "t1", "history", "h9"), { from: "todo", to: "done", source: "manual", actor: "alice", at: serverTimestamp() }));
  });
  test("변경 기록에 GitHub 출처를 직접 쓸 수 없다 (서버 전용)", async () => {
    await seedProject({ withBob: true });
    await seedTask();
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "tasks", "t1", "history", "h9"), { from: "todo", to: "done", source: "github", actor: "bob", at: serverTimestamp() }));
  });
});

describe("할 일 삭제 권한", () => {
  test("만든 사람도 담당자도 아닌 멤버는 삭제할 수 없다", async () => {
    await seedThreeMembers();
    await seedTask({ createdBy: "bob", assigneeId: "bob" });
    await assertFails(deleteDoc(doc(db("carol"), "projects", PID, "tasks", "t1")));
  });
  test("할 일을 만든 사람은 삭제할 수 있다", async () => {
    await seedThreeMembers();
    await seedTask({ createdBy: "carol" });
    await assertSucceeds(deleteDoc(doc(db("carol"), "projects", PID, "tasks", "t1")));
  });
  test("담당자는 삭제할 수 있다", async () => {
    await seedThreeMembers();
    await seedTask({ createdBy: "bob", assigneeId: "carol" });
    await assertSucceeds(deleteDoc(doc(db("carol"), "projects", PID, "tasks", "t1")));
  });
  test("프로젝트를 만든 사람은 삭제할 수 있다", async () => {
    await seedThreeMembers();
    await seedTask({ createdBy: "bob", assigneeId: "carol" });
    await assertSucceeds(deleteDoc(doc(db("alice"), "projects", PID, "tasks", "t1")));
  });
});

const POLL = { title: "2주차 회고", startDate: "2026-10-19", endDate: "2026-10-25", startHour: 10, endHour: 22, durationHours: 2, status: "open", confirmedSlot: null };

async function seedPoll({ status = "open", createdBy = "alice" } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "projects", PID, "polls", "p1"), { ...POLL, status, createdBy, createdAt: new Date() });
  });
}

describe("일정 투표", () => {
  test("멤버는 투표를 만들 수 있다", async () => {
    await seedProject({ withBob: true });
    await assertSucceeds(setDoc(doc(db("bob"), "projects", PID, "polls", "p1"), { ...POLL, createdBy: "bob", createdAt: serverTimestamp() }));
  });
  test("멤버가 아니면 투표를 만들 수 없다", async () => {
    await seedProject();
    await assertFails(setDoc(doc(db("mallory"), "projects", PID, "polls", "p1"), { ...POLL, createdBy: "mallory", createdAt: serverTimestamp() }));
  });
  test("기간이 14일을 넘으면 거부", async () => {
    await seedProject();
    await assertFails(setDoc(doc(db("alice"), "projects", PID, "polls", "p1"), { ...POLL, endDate: "2026-11-05", createdBy: "alice", createdAt: serverTimestamp() }));
  });
  test("처음부터 확정 상태로 만들 수 없다", async () => {
    await seedProject();
    await assertFails(setDoc(doc(db("alice"), "projects", PID, "polls", "p1"), { ...POLL, status: "confirmed", createdBy: "alice", createdAt: serverTimestamp() }));
  });
  test("만든 사람은 확정할 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedPoll();
    await assertSucceeds(updateDoc(doc(db("alice"), "projects", PID, "polls", "p1"), { status: "confirmed", confirmedSlot: { date: "2026-10-20", hour: 19 } }));
  });
  test("만든 사람이 아니면 확정할 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedPoll();
    await assertFails(updateDoc(doc(db("bob"), "projects", PID, "polls", "p1"), { status: "confirmed", confirmedSlot: { date: "2026-10-20", hour: 19 } }));
  });
  test("본인 가능 시간은 쓸 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedPoll();
    await assertSucceeds(setDoc(doc(db("bob"), "projects", PID, "polls", "p1", "responses", "bob"), { slots: ["2026-10-20T19"], updatedAt: serverTimestamp() }));
  });
  test("남의 가능 시간은 쓸 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedPoll();
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "polls", "p1", "responses", "alice"), { slots: ["2026-10-20T19"], updatedAt: serverTimestamp() }));
  });
  test("확정된 투표에는 응답할 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedPoll({ status: "confirmed" });
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "polls", "p1", "responses", "bob"), { slots: ["2026-10-20T19"], updatedAt: serverTimestamp() }));
  });
  test("멤버가 아니면 응답을 볼 수 없다", async () => {
    await seedProject();
    await seedPoll();
    await assertFails(getDoc(doc(db("mallory"), "projects", PID, "polls", "p1", "responses", "alice")));
  });
});

describe("GitHub 연동 데이터", () => {
  test("멤버는 GitHub 활동 기록을 읽을 수 있다", async () => {
    await seedProject({ withBob: true });
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "projects", PID, "githubEvents", "d1"), { type: "push", title: "TM-1 로그인", taskNumbers: [1] });
    });
    await assertSucceeds(getDoc(doc(db("bob"), "projects", PID, "githubEvents", "d1")));
  });
  test("브라우저는 GitHub 활동 기록을 쓸 수 없다 (가짜 이벤트 방지)", async () => {
    await seedProject({ withBob: true });
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "githubEvents", "fake"), { type: "pull_request", title: "가짜 머지" }));
  });
  test("브라우저는 웹훅 secret 을 읽을 수 없다", async () => {
    await seedProject();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "githubRepos", "owner__repo"), { projectId: PID, webhookSecret: "s3cret" });
    });
    await assertFails(getDoc(doc(db("alice"), "githubRepos", "owner__repo")));
  });
  test("브라우저는 할 일의 PR 정보를 위조할 수 없다", async () => {
    await seedProject();
    await seedTask();
    await assertFails(updateDoc(doc(db("alice"), "projects", PID, "tasks", "t1"), { github: { prNumber: 1, prState: "merged" }, updatedAt: serverTimestamp() }));
  });
  test("브라우저는 할 일을 만들 때 브랜치를 넣을 수 없다", async () => {
    await seedProject();
    await assertFails(createTaskBatch("alice", { extra: { branch: "feature/TM-1" } }).commit());
  });
  test("GitHub 정보가 붙은 할 일도 일반 수정은 된다", async () => {
    await seedProject();
    await seedTask();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "projects", PID, "tasks", "t1"), { branch: "feature/TM-1", github: { prNumber: 3, prTitle: "x", prState: "open", prUrl: "u" } });
    });
    await assertSucceeds(updateDoc(doc(db("alice"), "projects", PID, "tasks", "t1"), { title: "로그인 화면 v2", updatedAt: serverTimestamp() }));
  });
});

describe("회의록", () => {
  const MEETING = {
    title: "3주차 회의",
    source: "text",
    durationSec: null,
    segments: [{ start: null, text: "로그인은 금요일까지 해주세요." }],
    decisions: [],
    actionItems: [{ text: "로그인은 금요일까지 해주세요.", segment: 0, taskNumber: null }],
    createdBy: "bob",
  };

  async function seedMeeting() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "projects", PID, "meetings", "m1"), { ...MEETING, createdAt: new Date() });
    });
  }

  test("멤버는 회의록을 읽을 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertSucceeds(getDoc(doc(db("alice"), "projects", PID, "meetings", "m1")));
  });
  test("멤버가 아니면 회의록을 읽을 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertFails(getDoc(doc(db("mallory"), "projects", PID, "meetings", "m1")));
  });
  test("브라우저는 회의록을 직접 만들 수 없다 (서버만)", async () => {
    await seedProject({ withBob: true });
    await assertFails(setDoc(doc(db("bob"), "projects", PID, "meetings", "m2"), { ...MEETING, createdAt: serverTimestamp() }));
  });
  test("할 일 후보를 보드에 추가 표시할 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertSucceeds(
      updateDoc(doc(db("alice"), "projects", PID, "meetings", "m1"), { actionItems: [{ ...MEETING.actionItems[0], taskNumber: 1 }] }),
    );
  });
  test("회의 내용 · 결정사항은 고칠 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertFails(updateDoc(doc(db("bob"), "projects", PID, "meetings", "m1"), { segments: [{ start: null, text: "조작" }] }));
    await assertFails(updateDoc(doc(db("bob"), "projects", PID, "meetings", "m1"), { decisions: [{ text: "가짜 결정", segment: 0 }] }));
  });
  test("할 일 후보를 늘리거나 줄일 수 없다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertFails(updateDoc(doc(db("bob"), "projects", PID, "meetings", "m1"), { actionItems: [] }));
  });
  test("만든 사람은 회의록을 지울 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertSucceeds(deleteDoc(doc(db("bob"), "projects", PID, "meetings", "m1")));
  });
  test("프로젝트를 만든 사람은 남의 회의록도 지울 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedMeeting();
    await assertSucceeds(deleteDoc(doc(db("alice"), "projects", PID, "meetings", "m1")));
  });
  test("다른 멤버는 남의 회의록을 지울 수 없다", async () => {
    await seedThreeMembers();
    await seedMeeting();
    await assertFails(deleteDoc(doc(db("carol"), "projects", PID, "meetings", "m1")));
  });
});

describe("프로젝트 설정 (만든 사람)", () => {
  const NEW_CODE = "M3NV8Q";

  function reissueBatch(uid, { code = NEW_CODE, target = PID } = {}) {
    const d = db(uid);
    const b = writeBatch(d);
    b.set(doc(d, "inviteCodes", code), { projectId: target, createdAt: serverTimestamp() });
    b.update(doc(d, "projects", PID), { inviteCode: code });
    b.delete(doc(d, "inviteCodes", CODE));
    return b;
  }

  test("만든 사람은 이름을 바꿀 수 있다", async () => {
    await seedProject({ withBob: true });
    await assertSucceeds(updateDoc(doc(db("alice"), "projects", PID), { name: "쇼핑몰 v2" }));
  });
  test("멤버는 이름을 바꿀 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(updateDoc(doc(db("bob"), "projects", PID), { name: "내 마음대로" }));
  });
  test("40자를 넘는 이름 · 빈 이름은 거부", async () => {
    await seedProject();
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { name: "가".repeat(41) }));
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { name: "" }));
  });
  test("이름과 다른 필드를 같이 바꿀 수 없다", async () => {
    await seedProject();
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { name: "x", taskCounter: 99 }));
  });
  test("만든 사람은 초대 코드를 재발급할 수 있고, 옛 코드는 사라진다", async () => {
    await seedProject({ withBob: true });
    await assertSucceeds(reissueBatch("alice").commit());
    const old = await getDoc(doc(db("bob"), "inviteCodes", CODE));
    assert.equal(old.exists(), false);
  });
  test("멤버는 초대 코드를 재발급할 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(reissueBatch("bob").commit());
  });
  test("새 코드 문서가 다른 프로젝트를 가리키면 거부", async () => {
    await seedProject();
    await assertFails(reissueBatch("alice", { target: "other" }).commit());
  });
  test("만든 사람은 멤버를 내보낼 수 있고, 내보낸 사람은 프로젝트를 못 읽는다", async () => {
    await seedProject({ withBob: true });
    const d = db("alice");
    const b = writeBatch(d);
    b.update(doc(d, "projects", PID), { memberIds: arrayRemove("bob") });
    b.delete(doc(d, "projects", PID, "joins", "bob"));
    await assertSucceeds(b.commit());
    await assertFails(getDoc(doc(db("bob"), "projects", PID)));
  });
  test("멤버는 다른 멤버를 내보낼 수 없다", async () => {
    await seedThreeMembers();
    await assertFails(updateDoc(doc(db("bob"), "projects", PID), { memberIds: arrayRemove("carol") }));
  });
  test("만든 사람도 자기 자신은 뺄 수 없다", async () => {
    await seedProject({ withBob: true });
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { memberIds: arrayRemove("alice") }));
  });
  test("한 번에 두 명을 빼거나 멤버를 몰래 추가할 수 없다", async () => {
    await seedThreeMembers();
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { memberIds: ["alice"] }));
    await assertFails(updateDoc(doc(db("alice"), "projects", PID), { memberIds: ["alice", "bob", "mallory"] }));
  });
  test("만든 사람은 내보낼 사람의 할 일 담당을 풀 수 있다", async () => {
    await seedProject({ withBob: true });
    await seedTask({ assigneeId: "bob" });
    await assertSucceeds(updateDoc(doc(db("alice"), "projects", PID, "tasks", "t1"), { assigneeId: null, updatedAt: serverTimestamp() }));
  });
  test("GitHub 활동 기록은 만든 사람만 지울 수 있다 (프로젝트 삭제용)", async () => {
    await seedProject({ withBob: true });
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "projects", PID, "githubEvents", "e1"), { type: "push", title: "x" });
    });
    await assertFails(deleteDoc(doc(db("bob"), "projects", PID, "githubEvents", "e1")));
    await assertSucceeds(deleteDoc(doc(db("alice"), "projects", PID, "githubEvents", "e1")));
  });
});
