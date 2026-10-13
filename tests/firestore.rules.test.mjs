// Firestore 보안 규칙 테스트 — 에뮬레이터에서 실행: npm run test:rules
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";

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
