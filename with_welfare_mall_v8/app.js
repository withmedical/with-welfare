// 1. Supabase 초기화 설정
const SUPABASE_URL = "https://eqromjnhqkecmpkherjb.supabase.co";
const SUPABASE_KEY = "sb_publishable_trTC1dyramnWwtd4XV9eqw_zRWEA"; // 대시보드의 Publishable Key
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.getElementById("app");
const today = new Date().toISOString().slice(0, 10);
const MAX_FILE_SIZE = 500 * 1024;
const ALLOWED_FILES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

// 초기 고정 데이터 기본값 정의
const seed = {
  admins: [{ id: "a1", name: "김경진", role: "admin", loginId: "with1905", password: "withm*1905", dept: "관리자" }],
  usePolicies: [
    { id: "self", name: "본인 사용", discountRate: 100, paymentRequired: false, description: "임직원 본인 사용 무료" },
    { id: "family", name: "직계가족", discountRate: 100, paymentRequired: false, description: "직계가족 사용 무료" },
    { id: "friend", name: "지인", discountRate: 50, paymentRequired: true, description: "지인 이용 시 1박 기준 50% 할인 금액 입금" }
  ],
  condolenceTypes: [
    { id: "ct1", name: "결혼", description: "결혼 축하 지원" },
    { id: "ct2", name: "출산", description: "출산 축하 지원" },
    { id: "ct3", name: "장례", description: "장례 조의 지원" },
    { id: "ct4", name: "생일", description: "생일 복지" },
    { id: "ct5", name: "기타", description: "기타 경조사" }
  ],
  rooms: [
    { id: "stella", name: "스텔라동", basePeople: 5, maxPeople: 8, address: "제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션" },
    { id: "solar", name: "솔라동", basePeople: 5, maxPeople: 8, address: "제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션" }
  ],
  events: [
    { id: "ev1", title: "하계 워크숍", date: "2026-07-19", limit: 40, memo: "전사 워크숍 참석 신청", isOpen: true },
    { id: "ev2", title: "가족 초청 행사", date: "2026-09-12", limit: 60, memo: "임직원 가족 초청 행사", isOpen: true }
  ],
  discounts: [
    { id: "d1", category: "건강검진", title: "제휴 병원 건강검진", rate: "30% 할인", method: "임직원 확인 후 예약", link: "" },
    { id: "d2", category: "리조트", title: "전국 제휴 리조트", rate: "임직원가", method: "복지몰 신청 후 예약코드 발급", link: "" },
    { id: "d3", category: "렌터카", title: "제주 렌터카 제휴", rate: "최대 25% 할인", method: "제휴 링크 이용", link: "" },
    { id: "d4", category: "쇼핑", title: "생활용품 특가몰", rate: "월별 특가", method: "임직원 인증 후 이용", link: "" }
  ],
  notices: [
    { id: "n1", title: "제주 사계펜션 예약 운영 안내", important: true, body: "스텔라동, 솔라동은 각각 기본 5인 기준입니다. 직원당 연간 10박 기준으로 운영합니다.", views: 0 },
    { id: "n2", title: "지인 이용 시 50% 할인 금액 입금 안내", important: true, body: "지인 이용은 1박 270,000원 기준 50% 할인 금액을 회사 지정 계좌로 이체합니다.", views: 0 }
  ]
};

// 실시간 애플리케이션 상태 전역 관리 데이터
let state = {
  admins: [...seed.admins],
  users: [],
  settings: {
    bankName: "국민은행", bankAccount: "123456-01-789012", bankHolder: "주식회사 위드메디컬", nightlyPrice: 270000,
    friendDiscountRate: 50, annualNightLimit: 10, condolenceEmail: "welfare@withmedical.co.kr", vacationEmail: "vacation@withmedical.co.kr",
    logoUrl: "logo.gif", homeBadge: "Company Welfare Platform", homeTitle: "회원 승인형 회사 복지몰",
    homeDescription: "경조사·휴가지원사업 접수 시 담당자 이메일 발송대기함에 신청 내역이 자동 생성됩니다.",
    homeButtons: [{ id: "hb1", label: "숙소 예약하기", page: "stay" }, { id: "hb2", label: "휴가지원사업 신청", page: "vacation" }]
  },
  menuSettings: {
    stay: { name: "숙소예약", enabled: true }, family: { name: "경조사", enabled: true }, event: { name: "행사", enabled: true },
    discount: { name: "할인", enabled: true }, vacation: { name: "휴가지원사업", enabled: true }, notice: { name: "공지", enabled: true }
  },
  usePolicies: [...seed.usePolicies],
  condolenceTypes: [...seed.condolenceTypes],
  rooms: [...seed.rooms],
  reservations: [],
  condolences: [],
  events: [...seed.events],
  eventApplications: [],
  discounts: [...seed.discounts],
  vacationSupport: [],
  notices: [...seed.notices],
  mailOutbox: []
};

let session = JSON.parse(localStorage.getItem("with_session_v5") || "null");
let page = "home", loginTab = "user", adminTab = "adminDashboard", calDate = new Date();

// 2. Supabase 실시간 동기화 동적 로드 및 저장 함수 정의
async function initApp() {
  await loadFromSupabase();
  render();
}

async function loadFromSupabase() {
  try {
    // Supabase 상의 단일 원격 state 테이블 혹은 개별 테이블에 대한 통합 백업 객체 핸들링 구조화
    const { data, error } = await supabaseClient.from("app_state").select("state_data").single();
    if (error && error.code !== "PGRST116") throw error; // PGRST116는 데이터가 비어있을 때의 에러 코드
    if (data && data.state_data) {
      state = data.state_data;
    } else {
      await saveToSupabase();
    }
  } catch (err) {
    console.error("Supabase 데이터 동기화 실패, 로컬 캐시 사용:", err);
    const local = localStorage.getItem("with_welfare_v5");
    if (local) state = JSON.parse(local);
  }
}

async function saveToSupabase() {
  localStorage.setItem("with_welfare_v5", JSON.stringify(state));
  try {
    const { error } = await supabaseClient.from("app_state").upsert({ id: 1, state_data: state, updated_at: new Date() });
    if (error) throw error;
  } catch (err) {
    console.error("Supabase 실시간 백업 업로드 오류:", err);
  }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function money(n) { return Number(n || 0).toLocaleString() + "원"; }
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.innerText = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }
function user() { if (!session) return null; if (session.role === "admin") return state.admins.find(a => a.id === session.id); return state.users.find(u => u.id === session.id); }
function setPage(p) { if (!ensureEnabledPage(p)) { toast("현재 비활성화된 메뉴입니다."); return; } page = p; render(); scrollTo(0, 0); }
function logout() { session = null; localStorage.removeItem("with_session_v5"); render(); }

async function loginUser(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const u = state.users.find(x => x.name === f.get("name") && x.phone === f.get("phone") && x.password === f.get("password"));
  if (!u) return toast("로그인 정보가 일치하지 않습니다.");
  if (u.status !== "가입승인") return toast("관리자 가입 승인 후 로그인 가능합니다.");
  session = { id: u.id, role: "user" };
  localStorage.setItem("with_session_v5", JSON.stringify(session));
  render();
}

async function loginAdmin(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const a = state.admins.find(x => x.loginId === f.get("id") && x.password === f.get("password"));
  if (!a) return toast("관리자 ID 또는 비밀번호가 일치하지 않습니다.");
  session = { id: a.id, role: "admin" };
  localStorage.setItem("with_session_v5", JSON.stringify(session));
  render();
}

async function signup(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const phone = f.get("phone"), empNo = f.get("empNo");
  if (state.users.some(u => u.phone === phone || u.empNo === empNo)) return toast("이미 등록된 전화번호 또는 사원번호입니다.");
  state.users.push({ id: uid(), name: f.get("name"), empNo, birth: f.get("birth"), phone, password: f.get("password"), role: "user", dept: f.get("dept") || "", status: "가입대기", createdAt: new Date().toLocaleString() });
  await saveToSupabase();
  toast("회원가입 신청 완료. 관리자 승인 후 로그인 가능합니다.");
  loginTab = "user";
  render();
}

function loginView() { app.innerHTML = `<div class="loginbox panel"><div class="brand"><div class="logo">W</div><div><b>WITH Welfare Mall</b><small>회원 승인형 복지몰</small></div></div><h1>복지몰 로그인</h1><div class="tabs"><button class="${loginTab === 'user' ? 'active' : ''}" onclick="loginTab='user';render()">직원 로그인</button><button class="${loginTab === 'signup' ? 'active' : ''}" onclick="loginTab='signup';render()">회원가입</button><button class="${loginTab === 'admin' ? 'active' : ''}" onclick="loginTab='admin';render()">관리자</button></div>${loginTab === 'user' ? `<form class="form" onsubmit="loginUser(event)"><label class="wide">이름<input name="name" required></label><label class="wide">전화번호<input name="phone" placeholder="010-0000-0000" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">직원 로그인</button></form>` : ""}${loginTab === 'signup' ? `<form class="form" onsubmit="signup(event)"><label>이름<input name="name" required></label><label>사원번호<input name="empNo" required></label><label>생년월일<input type="date" name="birth" required></label><label>전화번호<input name="phone" required></label><label>부서<input name="dept"></label><label>비밀번호<input type="password" name="password" required></label><button class="wide">회원가입 신청</button></form>` : ""}${loginTab === 'admin' ? `<form class="form" onsubmit="loginAdmin(event)"><label class="wide">관리자 ID<input name="id" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">관리자 로그인</button></form>` : ""}</div>`; }
function layout(content) { const u = user(); return `<div class="top"><div class="topin"><div class="brand"><div class="logo">${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}">` : `W`}</div><div><b>WITH Welfare Mall</b><small>${u.name} · ${u.role === "admin" ? "관리자" : "임직원"}</small></div></div><div class="nav">${navItems().map(item => `<button class="${page === item.key ? 'active' : ''}" onclick="setPage('${item.key}')">${item.name}</button>`).join("")}${u.role === "admin" ? `<button class="${page === 'admin' ? 'active' : ''}" onclick="setPage('admin')">관리자</button>` : ""}<button class="gray" onclick="logout()">로그아웃</button></div></div></div><div class="wrap">${content}</div><div class="footer">WITH Welfare Mall · 제주 사계펜션 복지몰</div>`; }

function navItems() {
  const base = [{ key: "home", name: "홈", enabled: true }];
  const keys = ["stay", "family", "event", "discount", "vacation", "notice"];
  keys.forEach(k => {
    const m = state.menuSettings?.[k] || { name: k, enabled: true };
    if (m.enabled) base.push({ key: k, name: m.name, enabled: true });
  });
  return base;
}
function pageLabel(key) { if (key === "home") return "홈"; return state.menuSettings?.[key]?.name || key; }
function ensureEnabledPage(p) { if (p === "home" || p === "admin") return true; return state.menuSettings?.[p]?.enabled !== false; }
function calcNights(a, b) { return Math.max(0, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))); }
function annualUsedNights(userId, year = new Date().getFullYear()) { return state.reservations.filter(r => r.userId === userId && r.status !== "반려" && r.status !== "취소" && String(r.checkin).slice(0, 4) == String(year)).reduce((s, r) => s + calcNights(r.checkin, r.checkout), 0); }
function overlaps(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }
function isRoomAvailable(roomId, checkin, checkout) { return !state.reservations.some(r => r.roomId === roomId && r.status !== "취소" && r.status !== "반려" && overlaps(checkin, checkout, r.checkin, r.checkout)); }
function getPolicy(name) { return state.usePolicies.find(p => p.name === name) || state.usePolicies[0]; }
function calcPrice(useType, nights) { const p = getPolicy(useType); if (!p || !p.paymentRequired) return 0; const payableRate = 100 - Number(p.discountRate || 0); return Math.round(state.settings.nightlyPrice * (payableRate / 100)) * nights; }
function makeMail(kind, to, subject, body, attachment) { state.mailOutbox.push({ id: uid(), kind, to, subject, body, attachment: attachment || "", createdAt: new Date().toLocaleString(), status: "발송대기" }); }
function validateFile(input) { const file = input.files && input.files[0]; if (!file) return { ok: true, name: "" }; if (!ALLOWED_FILES.includes(file.type)) return { ok: false, msg: "PDF 또는 이미지 파일만 첨부 가능합니다." }; if (file.size > MAX_FILE_SIZE) return { ok: false, msg: "첨부파일은 500KB 이하만 가능합니다." }; return { ok: true, name: file.name }; }

function dashboardCounts() {
  const u = user();
  const myReservations = u.role === "admin" ? state.reservations.length : state.reservations.filter(r => r.userId === u.id).length;
  const myCondolences = u.role === "admin" ? state.condolences.length : state.condolences.filter(r => r.userId === u.id).length;
  const myVacations = u.role === "admin" ? state.vacationSupport.length : state.vacationSupport.filter(r => r.userId === u.id).length;
  const eventApps = u.role === "admin" ? state.eventApplications.length : state.eventApplications.filter(r => r.userId === u.id).length;
  return { myReservations, myCondolences, myVacations, eventApps };
}

function adminQuickStats() {
  return {
    joinPending: state.users.filter(u => u.status === "가입대기").length,
    reservationPending: state.reservations.filter(r => r.status === "대기").length,
    condolenceCount: state.condolences.length,
    vacationCount: state.vacationSupport.length,
    mailCount: state.mailOutbox.length,
    eventApps: state.eventApplications.length,
    activeUsers: state.users.filter(u => u.status === "가입승인").length,
    payAmount: state.reservations.reduce((s, r) => s + (r.status !== "반려" && r.status !== "취소" ? Number(r.amount || 0) : 0), 0)
  };
}

function roomUsageSummary() {
  const year = String(new Date().getFullYear());
  return state.rooms.map(room => {
    const nights = state.reservations.filter(r => r.roomId === room.id && r.status !== "반려" && r.status !== "취소" && String(r.checkin).slice(0, 4) === year).reduce((s, r) => s + calcNights(r.checkin, r.checkout), 0);
    const rate = Math.min(100, Math.round(nights / 365 * 100));
    return { room, nights, rate };
  });
}

function home() {
  const u = user(); const c = dashboardCounts(); const used = u.role === "admin" ? 0 : annualUsedNights(u.id); const limit = state.settings.annualNightLimit || 10; const usedRate = u.role === "admin" ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const buttons = (state.settings.homeButtons || []).filter(b => b.label && b.page && ensureEnabledPage(b.page)).map((b, i) => `<button class="${i === 0 ? '' : 'secondary'}" onclick="setPage('${b.page}')">${b.label}</button>`).join(" ");
  const featureItems = [["stay", "🏡", pageLabel("stay"), "제주 사계펜션 예약 및 사용 현황"], ["family", "🎁", pageLabel("family"), "경조사 신청 및 접수 내역"], ["event", "🎉", pageLabel("event"), "사내 행사 참여 신청"], ["discount", "🏷️", pageLabel("discount"), "제휴 할인 혜택 안내"], ["vacation", "🏖️", pageLabel("vacation"), "휴가지원사업 신청 접수"], ["notice", "📢", pageLabel("notice"), "복지몰 공지 확인"]].filter(x => ensureEnabledPage(x[0]));
  return layout(`<section class="dashboard-hero"><div class="welcome-card"><span class="badge">${state.settings.homeBadge || ""}</span><h1>${state.settings.homeTitle || ""}</h1><p class="muted">${state.settings.homeDescription || ""}</p><div class="welcome-actions">${buttons}</div></div><div class="profile-card"><b>${u.name}님, 안녕하세요.</b><p class="muted">${u.role === "admin" ? "관리자" : "임직원"} 계정</p>${u.role === "admin" ? `<div class="kpi-card"><small>관리자 모드</small><strong>운영중</strong></div>` : `<div><small class="muted">올해 숙소 사용</small><div class="kpi">${used} / ${limit}박</div><div class="progressbar"><span style="width:${usedRate}%"></span></div></div>`}</div></section><section class="kpi-row"><div class="kpi-card"><small>숙소 예약</small><strong>${c.myReservations}</strong></div><div class="kpi-card"><small>경조사</small><strong>${c.myCondolences}</strong></div><div class="kpi-card"><small>행사 신청</small><strong>${c.eventApps}</strong></div><div class="kpi-card"><small>휴가지원</small><strong>${c.myVacations}</strong></div></section><section class="feature-grid">${featureItems.map(x => `<div class="feature-card"><div class="icon">${x[1]}</div><h3>${x[2]}</h3><p class="muted">${x[3]}</p><button onclick="setPage('${x[0]}')">바로가기</button></div>`).join("")}</section><section class="section"><h2>숙소 이용 현황</h2><div class="room-status-grid">${roomUsageSummary().map(r => `<div class="room-status"><span class="pill">${new Date().getFullYear()}</span><p class="room-name">${r.room.name}</p><p class="muted">누적 예약 ${r.nights}박</p><div class="progressbar"><span style="width:${r.rate}%"></span></div></div>`).join("")}</div></section>`);
}

function stay() { const u = user(); const used = u.role === "admin" ? 0 : annualUsedNights(u.id); return layout(`<section class="section"><h2>제주 사계펜션 숙소 예약</h2><p class="muted">스텔라동 / 솔라동 2개 동 운영 · 각 동 기본 5명 · 최대 인원 입력 가능</p><div class="grid2">${state.rooms.map(r => `<div class="card room-card"><div class="room-img ${r.id}">${r.name}</div><div class="room-body"><h3>${r.name}</h3><p class="muted">기본 ${r.basePeople}명 · 최대 ${r.maxPeople}명</p><button onclick="showReserve('${r.id}')">예약 신청</button></div></div>`).join("")}</div></section><section class="section panel"><div class="cal-head"><h2>예약 현황 캘린더</h2><div><button class="secondary" onclick="moveMonth(-1)">이전</button> <b>${calDate.getFullYear()}년 ${calDate.getMonth() + 1}월</b> <button class="secondary" onclick="moveMonth(1)">다음</button></div></div>${calendar()}</section><section id="reserveForm" class="section"></section><section class="section"><h2>내 예약 현황</h2><p class="muted">올해 사용/신청 박수: ${used}박 / ${state.settings.annualNightLimit}박</p>${reservationTable(state.reservations.filter(r => r.userId === u.id), false)}</section>`); }
function moveMonth(n) { calDate.setMonth(calDate.getMonth() + n); render(); }
function calendar() { const y = calDate.getFullYear(), m = calDate.getMonth(); const start = new Date(y, m, 1 - new Date(y, m, 1).getDay()); let html = `<div class="calendar">${["일", "월", "화", "수", "목", "금", "토"].map(d => `<div class="dow">${d}</div>`).join("")}`; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const ds = d.toISOString().slice(0, 10); const out = d.getMonth() !== m; const marks = []; state.reservations.filter(r => r.status !== "취소" && r.status !== "반려" && ds >= r.checkin && ds < r.checkout).forEach(r => marks.push(`<span class="mark ${r.roomId}M">${r.roomName} X</span>`)); html += `<div class="day ${out ? 'out' : ''}"><div class="daynum">${d.getDate()}</div>${marks.join("")}</div>`; } return html + "</div>"; }
function showReserve(roomId) { const r = state.rooms.find(x => x.id === roomId); document.getElementById("reserveForm").innerHTML = `<div class="panel"><h2>${r.name} 예약 신청</h2><form class="form" oninput="updateEstimate(this)" onsubmit="submitReservation(event,'${roomId}')"><label>체크인<input type="date" name="checkin" min="${today}" required></label><label>체크아웃<input type="date" name="checkout" min="${today}" required></label><label>이용 구분<select name="useType" required>${state.usePolicies.map(p => `<option>${p.name}</option>`).join("")}</select></label><label>이용 인원<input type="number" name="people" min="1" max="${r.maxPeople}" value="${r.basePeople}" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>입금자명<input name="payer" placeholder="입금 필요 시 입력"></label><label class="wide">요청사항<textarea name="memo"></textarea></label><div class="wide pricebox" id="estimate">선택한 조건에 따라 금액이 계산됩니다.</div><div class="wide"><button>예약 신청 제출</button></div></form></div>`; document.getElementById("reserveForm").scrollIntoView({ behavior: "smooth" }); }
function updateEstimate(form) { const nights = calcNights(form.checkin.value, form.checkout.value); const useType = form.useType.value; const p = getPolicy(useType); const price = calcPrice(useType, nights); const txt = p.paymentRequired ? `${p.name}: 1박 ${money(state.settings.nightlyPrice)} 기준 할인율 ${p.discountRate}% 적용 · 예상 입금액 ${money(price)} · 입금계좌 ${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}` : `${p.name}: 무료 적용 조건입니다. 예상 ${nights || 0}박`; document.getElementById("estimate").innerText = txt; }

async function submitReservation(e, roomId) {
  e.preventDefault();
  const f = new FormData(e.target);
  const checkin = f.get("checkin"), checkout = f.get("checkout"), people = Number(f.get("people")), useType = f.get("useType");
  const room = state.rooms.find(r => r.id === roomId);
  const nights = calcNights(checkin, checkout);
  if (nights <= 0) return toast("체크아웃은 체크인 이후 날짜여야 합니다.");
  if (people > room.maxPeople) return toast(`${room.name} 최대 인원은 ${room.maxPeople}명입니다.`);
  if (!isRoomAvailable(roomId, checkin, checkout)) return toast("해당 기간은 이미 예약되어 있습니다.");
  const used = annualUsedNights(user().id, checkin.slice(0, 4));
  if (used + nights > state.settings.annualNightLimit) return toast(`직원당 연간 ${state.settings.annualNightLimit}박 기준을 초과합니다.`);
  const amount = calcPrice(useType, nights);
  const policy = getPolicy(useType);
  state.reservations.push({ id: uid(), userId: user().id, userName: user().name, dept: user().dept || "", roomId, roomName: room.name, checkin, checkout, nights, people, extraPeople: Math.max(0, people - room.basePeople), useType, discountRate: policy.discountRate, paymentRequired: policy.paymentRequired, amount, bankInfo: `${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}`, phone: f.get("phone"), payer: f.get("payer"), memo: f.get("memo"), status: "대기", createdAt: new Date().toLocaleString() });
  await saveToSupabase();
  toast("예약 신청이 접수되었습니다.");
  setPage("stay");
}

function reservationTable(rows, admin) { if (!rows.length) return `<div class="panel empty">예약 내역이 없습니다.</div>`; return `<table class="table"><thead><tr><th>숙소</th><th>신청자</th><th>기간</th><th>구분/금액</th><th>인원</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.roomName}</td><td>${r.userName}<br><span class="muted">${r.dept || ""}</span></td><td>${r.checkin} ~ ${r.checkout}<br><b>${r.nights || calcNights(r.checkin, r.checkout)}박</b></td><td>${r.useType || "-"}<br>${r.amount ? `<b>${money(r.amount)}</b><br><span class="muted">${r.bankInfo || ""}</span>` : "무료"}</td><td>${r.people}명</td><td><span class="status ${r.status}">${r.status}</span></td><td class="actions">${admin ? adminButtons("reservations", r.id, r.status) : userCancelButton("reservations", r.id, r.status)}</td></tr>`).join("")}</tbody></table>`; }
function userCancelButton(type, id, status) { return status === "대기" || status === "승인" ? `<button class="danger" onclick="userCancel('${type}','${id}')">취소</button>` : "-"; }
async function userCancel(type, id) { state[type].find(x => x.id === id).status = "취소"; await saveToSupabase(); toast("취소 처리되었습니다."); render(); }
function adminButtons(type, id, status) { if (status !== "대기") return "-"; return `<button onclick="setStatus('${type}','${id}','승인')">승인</button><button class="danger" onclick="setStatus('${type}','${id}','반려')">반려</button>`; }
async function setStatus(type, id, status) { state[type].find(x => x.id === id).status = status; await saveToSupabase(); toast(`${status} 처리되었습니다.`); render(); }

function family() { return layout(`<section class="section"><h2>경조사 신청</h2><div class="panel"><form class="form" onsubmit="submitCondolence(event)"><label>구분<select name="type" required>${state.condolenceTypes.map(t => `<option>${t.name}</option>`).join("")}</select></label><label>발생일<input type="date" name="date" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>증빙자료 첨부<input type="file" name="proof" accept=".pdf,image/*" required></label><label class="wide">상세 내용<textarea name="memo" required></textarea></label><button class="wide">경조사 신청 접수</button></form></div></section><section class="section"><h2>내 신청 현황</h2>${genericTable(state.condolences.filter(x => x.userId === user().id), "condolences", false)}</section>`); }
async function submitCondolence(e) { e.preventDefault(); const f = new FormData(e.target); const fileCheck = validateFile(e.target.proof); if (!fileCheck.ok) return toast(fileCheck.msg); const item = { id: uid(), userId: user().id, userName: user().name, dept: user().dept, type: f.get("type"), date: f.get("date"), phone: f.get("phone"), file: fileCheck.name, memo: f.get("memo"), status: "접수완료", createdAt: new Date().toLocaleString() }; state.condolences.push(item); makeMail("경조사", state.settings.condolenceEmail, `[복지몰] 경조사 신청 - ${item.userName}`, `내용: ${item.memo}`, item.file); await saveToSupabase(); toast("경조사 신청이 접수되었습니다."); setPage("family"); }

function eventPage() { return layout(`<section class="section"><h2>사내 행사 신청</h2><div class="grid2">${state.events.filter(e => e.isOpen !== false).map(ev => { const cnt = state.eventApplications.filter(a => a.eventId === ev.id && a.status !== "취소").length; const applied = state.eventApplications.find(a => a.eventId === ev.id && a.userId === user().id && a.status !== "취소"); return `<div class="card"><span class="badge">${ev.date}</span><h3>${ev.title}</h3><p class="muted">${ev.memo}</p><p>신청 ${cnt}/${ev.limit}명</p>${applied ? `<button class="gray" disabled>신청 완료</button>` : `<button onclick="applyEvent('${ev.id}')">참석 신청</button>`}</div>`; }).join("")}</div></section>`); }
async function applyEvent(id) { const ev = state.events.find(e => e.id === id); const cnt = state.eventApplications.filter(a => a.eventId === id && a.status !== "취소").length; if (cnt >= ev.limit) return toast("마감되었습니다."); state.eventApplications.push({ id: uid(), eventId: id, type: ev.title, date: ev.date, userId: user().id, userName: user().name, dept: user().dept, status: "신청완료", createdAt: new Date().toLocaleString() }); await saveToSupabase(); toast("행사 신청 완료"); render(); }
function discount() { return layout(`<section class="section"><h2>제휴 할인 안내</h2><div class="grid4">${state.discounts.map(d => `<div class="card"><span class="badge">${d.category}</span><h3>${d.title}</h3><p>${d.rate}</p><p class="muted">${d.method}</p><button onclick="${d.link ? `window.open('${d.link}','_blank')` : `toast('이용 방법을 확인해 주세요.')`}">이용하기</button></div>`).join("")}</div></section>`); }
function vacation() { return layout(`<section class="section"><h2>휴가지원사업 신청 접수</h2><div class="panel"><form class="form" onsubmit="submitVacation(event)"><label>신청자명<input name="name" value="${user().name}" required></label><label>부서<input name="dept" value="${user().dept || ''}" required></label><label>연락처<input name="phone" value="${user().phone || ''}" required></label><label>첨부파일명<input name="file" placeholder="신청서.pdf"></label><label class="wide">신청 사유<textarea name="reason" required></textarea></label><label class="wide"><input type="checkbox" name="agree" required> 동의</label><button class="wide">신청 접수</button></form></div></section><section class="section"><h2>내 신청 현황</h2>${genericTable(state.vacationSupport.filter(x => x.userId === user().id), "vacationSupport", false)}</section>`); }
async function submitVacation(e) { e.preventDefault(); const f = new FormData(e.target); const item = { id: uid(), userId: user().id, userName: f.get("name"), dept: f.get("dept"), type: "휴가지원사업", date: today, phone: f.get("phone"), file: f.get("file"), memo: f.get("reason"), status: "접수완료", createdAt: new Date().toLocaleString() }; state.vacationSupport.push(item); makeMail("휴가지원사업", state.settings.vacationEmail, `[복지몰] 휴가지원 - ${item.userName}`, `사유: ${item.memo}`, item.file); await saveToSupabase(); toast("휴가지원사업 신청이 접수되었습니다."); setPage("vacation"); }
function notice() { return layout(`<section class="section"><h2>공지사항</h2><div class="panel">${state.notices.map(n => `<div class="notice"><div><b>${n.important ? "[중요] " : ""}${n.title}</b><p class="muted">${n.body}</p></div></div>`).join("")}</div></section>`); }
function genericTable(rows, type, admin) { if (!rows.length) return `<div class="panel empty">신청 내역이 없습니다.</div>`; return `<table class="table"><thead><tr><th>구분</th><th>신청자</th><th>일자</th><th>첨부</th><th>상태</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.type}</td><td>${r.userName}</td><td>${r.date}</td><td>${r.file || "-"}</td><td><span class="status ${r.status}">${r.status}</span></td></tr>`).join("")}</tbody></table>`; }

function admin() {
  const tabs = [["adminDashboard", "대시보드"], ["homeAdmin", "홈/메뉴/로고"], ["stayAdmin", "숙소 관리"], ["condolenceAdmin", "경조사 관리"], ["eventAdminGroup", "행사 관리"], ["discountAdminGroup", "할인 관리"], ["vacationAdmin", "휴가지원사업"], ["noticeAdminGroup", "공지 관리"], ["memberAdmin", "회원/관리자"], ["mailOutbox", "메일 대기"], ["stats", "통계"]];
  let body = "";
  if (adminTab === "adminDashboard") body = adminDashboard();
  if (adminTab === "homeAdmin") body = homeAdminGroup();
  if (adminTab === "stayAdmin") body = stayAdminGroup();
  if (adminTab === "condolenceAdmin") body = condolenceAdminGroup();
  if (adminTab === "eventAdminGroup") body = eventAdminGroup();
  if (adminTab === "discountAdminGroup") body = discountAdminGroup();
  if (adminTab === "vacationAdmin") body = vacationAdminGroup();
  if (adminTab === "noticeAdminGroup") body = noticeAdminGroup();
  if (adminTab === "memberAdmin") body = memberAdminGroup();
  if (adminTab === "mailOutbox") body = mailOutboxAdmin();
  if (adminTab === "stats") body = stats();
  return layout(`<section class="section"><div class="admin-titlebar"><div><h2>관리자 페이지</h2></div><div><button class="danger" onclick="resetData()">초기화</button></div></div><div class="admin-shell"><aside class="admin-side">${tabs.map(t => `<button class="${adminTab === t[0] ? 'active' : ''}" onclick="adminTab='${t[0]}';render()">${t[1]}</button>`).join("")}</aside><main class="admin-main">${body}</main></div></section>`);
}

function adminDashboard() {
  const s = adminQuickStats();
  return `<div class="group-box"><div class="admin-quick"><div class="admin-stat"><small>가입대기</small><strong>${s.joinPending}</strong></div><div class="admin-stat"><small>예약대기</small><strong>${s.reservationPending}</strong></div></div></div>`;
}

function homeAdminGroup() {
  return `<div class="group-box"><div class="group-section"><h3>홈 화면 문구 수정</h3><form class="form" onsubmit="saveHomeText(event)"><label>제목<input name="homeTitle" value="${state.settings.homeTitle || ""}"></label><button class="wide">홈 문구 저장</button></form></div></div>`;
}
async function saveHomeText(e) { e.preventDefault(); const f = new FormData(e.target); state.settings.homeTitle = f.get("homeTitle"); await saveToSupabase(); toast("저장 완료"); render(); }

function stayAdminGroup() { return `<div class="group-box"><div class="group-section"><h3>숙소 예약 승인 현황</h3>${reservationTable(state.reservations, true)}</div></div>`; }
function condolenceAdminGroup() { return `<div class="group-box"><div class="group-section"><h3>경조사 접수 현황</h3>${genericTable(state.condolences, "condolences", true)}</div></div>`; }
function eventAdminGroup() { return `<div class="group-box"><h3>행사 관리</h3></div>`; }
function discountAdminGroup() { return `<div class="group-box"><h3>할인 관리</h3></div>`; }
function vacationAdminGroup() { return `<div class="group-box"><h3>휴가지원 관리</h3></div>`; }
function noticeAdminGroup() { return `<div class="group-box"><h3>공지 관리</h3></div>`; }

function memberAdminGroup() { return `<div class="group-box"><div class="group-section"><h3>회원 가입 승인/삭제</h3>${userAdmin()}</div></div>`; }
function userAdmin() { return `<table class="table"><thead><tr><th>이름</th><th>사원번호</th><th>상태</th><th>관리</th></tr></thead><tbody>${state.users.map(u => `<tr><td>${u.name}</td><td>${u.empNo}</td><td>${u.status}</td><td>${u.status === "가입대기" ? `<button onclick="setUserStatus('${u.id}','가입승인')">승인</button>` : ""}<button class="danger" onclick="deleteUser('${u.id}')">삭제</button></td></tr>`).join("")}</tbody></table>`; }
async function setUserStatus(id, status) { state.users.find(u => u.id === id).status = status; await saveToSupabase(); toast(status + " 처리"); render(); }
async function deleteUser(id) { state.users = state.users.filter(u => u.id !== id); await saveToSupabase(); toast("삭제 완료"); render(); }

function mailOutboxAdmin() { return `<div class="panel">메일 대기함</div>`; }
function stats() { return `<div class="panel">통계</div>`; }

async function resetData() { if (!confirm("데이터를 초기화할까요?")) return; localStorage.removeItem("with_welfare_v5"); localStorage.removeItem("with_session_v5"); state = { ...seed, users: [], reservations: [], condolences: [], eventApplications: [], vacationSupport: [], mailOutbox: [] }; await saveToSupabase(); session = null; toast("초기화되었습니다."); render(); }

function render() { if (!session) return loginView(); if (!user()) { logout(); return; } if (!ensureEnabledPage(page)) { page = "home"; } if (page === "home") app.innerHTML = home(); if (page === "stay") app.innerHTML = stay(); if (page === "family") app.innerHTML = family(); if (page === "event") app.innerHTML = eventPage(); if (page === "discount") app.innerHTML = discount(); if (page === "vacation") app.innerHTML = vacation(); if (page === "notice") app.innerHTML = notice(); if (page === "admin") app.innerHTML = admin(); }

// 앱 로드 시 실행 구조 초기화
initApp();