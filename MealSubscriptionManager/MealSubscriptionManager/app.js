const state = {
  user: null,
  users: JSON.parse(localStorage.getItem("dd-users") || "[]").filter(
    (user) => user.password !== "password",
  ).map((user) => ({
    ...user,
    role: user.role?.toLowerCase() === "admin" ? "admin" : "member",
    accountStatus: user.accountStatus || "Active",
    registrationDate: user.registrationDate || new Date().toISOString(),
  })),
  page: "dashboard",
};
localStorage.setItem("dd-users", JSON.stringify(state.users));
const meals = [
  [
    "Herb chicken & greens",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80",
  ],
  [
    "Miso salmon bowl",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
  ],
  [
    "Roasted vegetable rigatoni",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=500&q=80",
  ],
];
const $ = (s) => document.querySelector(s);
const isAdmin = () => state.user?.role?.toLowerCase() === "admin";
const normalizeEmail = (email) => email.trim().toLowerCase();
const hasAdminAccount = () =>
  state.users.some((user) => user.role?.toLowerCase() === "admin");
const toast = (t) => {
  const e = $("#toast");
  e.textContent = t;
  e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 2800);
};
function showAuth(type) {
  $("#authModal").classList.remove("hidden");
  $("#loginForm").classList.toggle("hidden", type === "signup");
  $("#signupForm").classList.toggle("hidden", type !== "signup");
  if (type === "login") {
    $("#login").reset();
  } else {
    $("#signup").reset();
  }
}
function enter(user) {
  state.user = user;
  state.page = isAdmin() ? "admin" : "dashboard";
  localStorage.setItem("dd-session", JSON.stringify(user));
  $("#landingView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#userName").innerHTML =
    `${user.name}<small>${user.role || "member"}</small>`;
  $("#avatar").textContent = user.name[0].toUpperCase();
  $(".admin-only").classList.toggle("hidden", !isAdmin());
  render();
}
function render() {
  if (state.page === "admin" && !isAdmin()) {
    state.page = "dashboard";
    toast("Admin access is restricted.");
  }
  $(".admin-only").classList.toggle("hidden", !isAdmin());
  const page = state.page;
  document
    .querySelectorAll(".side-link[data-page]")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  const titles = {
    dashboard: ["GOOD MORNING", "Your week, deliciously planned."],
    menu: ["WEEKLY MENU", "Make it a tasty one."],
    deliveries: ["DELIVERIES", "Everything on its way."],
    account: ["YOUR ACCOUNT", "The details, handled."],
    admin: ["ADMINISTRATION", "Manage your DailyDish community."],
  };
  $("#appEyebrow").textContent = titles[page][0];
  $("#appTitle").textContent = titles[page][1];
  const menu = meals
    .map(
      ([n, i]) =>
        `<article class="meal"><img src="${i}" alt="${n}"><div><b>${n}</b><span>Ready in 3 min</span></div></article>`,
    )
    .join("");
  let content = "";
  if (page === "dashboard")
    content = `<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Next delivery</h2><span class="status">CONFIRMED</span></div><div class="delivery-card"><img src="${meals[0][1]}" alt="Meal box"><div><h3>Wednesday, 18 September</h3><p>4 meals · Delivered 9am - 1pm</p><button class="text-link" data-page="deliveries">Manage delivery →</button></div></div></section><section class="stats"><div class="stat"><b>4</b><span>meals this week</span></div><div class="stat"><b>2</b><span>deliveries left</span></div><div class="stat"><b>12</b><span>meals enjoyed</span></div><div class="stat"><b>8.5</b><span>min avg. prep</span></div></section></div><section class="panel quick-actions-panel"><div class="panel-head"><h2>Quick Actions</h2></div><div class="quick-actions"><button class="quick-action" data-page="menu">Browse Meals <span>→</span></button><button class="quick-action" data-commerce-page="orders">My Orders <span>→</span></button><button class="quick-action" data-page="account" data-account-section="address">Delivery Address <span>→</span></button><button class="quick-action" data-page="account">Subscription <span>→</span></button></div></section>`;
  if (page === "menu")
    content = `<section class="panel"><div class="panel-head"><h2>Choose 4 meals</h2><span class="status">4 OF 4 SELECTED</span></div><div class="meal-list">${menu}${menu}</div></section>`;
  if (page === "deliveries")
    content = `<section class="panel delivery-list"><div class="delivery-row"><span><b>Wed, 18 September</b><small>4 meals · 9am - 1pm</small></span><span class="status">CONFIRMED</span></div><div class="delivery-row"><span><b>Wed, 25 September</b><small>4 meals · Edit before Sunday</small></span><button class="text-link">Manage →</button></div><div class="delivery-row"><span><b>Wed, 11 September</b><small>4 meals · Delivered</small></span><span>✓</span></div></section>`;
  if (page === "account")
    content = `<section class="panel manage-form"><h2>Subscription</h2><p class="plan-copy">Everyday plan · 4 meals per week · $39.60</p><button class="outline-button">Pause subscription</button><hr><h2 id="deliveryAddressSection">Delivery address</h2><p class="plan-copy">24 Cedar Lane<br>Brooklyn, NY 11201</p><button class="text-link">Edit details →</button></section>`;
  if (page === "admin")
    content = `<section class="panel admin-users"><div class="panel-head"><div><h2>Users</h2><p class="plan-copy">View and manage registered accounts. Passwords are never displayed.</p></div><span class="status">${state.users.length} USERS</span></div><form id="createUser" class="manage-form"><h3>Create member</h3><label>Name<input name="name" required placeholder="Full name"></label><label>Email<input type="email" name="email" required placeholder="member@email.com"></label><label>Password<input type="password" name="password" minlength="6" required placeholder="At least 6 characters"></label><input type="hidden" name="role" value="member"><button class="button">Create user <span>→</span></button></form><div class="users-table-wrap"><table class="users-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>ACCOUNT STATUS</th><th>REGISTERED</th><th>ACTION</th></tr></thead><tbody>${state.users.map((user, index) => `<tr><td><input form="updateUser-${index}" name="name" value="${user.name}" required></td><td><input form="updateUser-${index}" name="email" type="email" value="${user.email}" required></td><td><select form="updateUser-${index}" name="role"><option value="member" ${user.role === "member" ? "selected" : ""}>member</option><option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option></select></td><td><select form="updateUser-${index}" name="accountStatus"><option ${user.accountStatus === "Active" ? "selected" : ""}>Active</option><option ${user.accountStatus === "Suspended" ? "selected" : ""}>Suspended</option></select></td><td>${new Date(user.registrationDate).toLocaleDateString()}</td><td><form id="updateUser-${index}" data-user-index="${index}"></form><button class="button small" form="updateUser-${index}" type="submit">Save</button></td></tr>`).join("")}</tbody></table></div></section>`;
  $("#pageContent").innerHTML = content;
  $("#createUser")?.addEventListener("submit", createUser);
  document.querySelectorAll("[data-user-index]").forEach((form) =>
    form.addEventListener("submit", updateUser),
  );
}
function createUser(e) {
  e.preventDefault();
  if (!isAdmin()) {
    toast("Admin access is restricted.");
    return;
  }
  const data = Object.fromEntries(new FormData(e.target));
  if (state.users.some((user) => normalizeEmail(user.email) === normalizeEmail(data.email))) {
    toast("An account with that email already exists.");
    return;
  }
  const user = {
    ...data,
    role: "member",
    accountStatus: "Active",
    registrationDate: new Date().toISOString(),
  };
  state.users.push(user);
  localStorage.setItem("dd-users", JSON.stringify(state.users));
  toast(`${data.name} was added.`);
  render();
}
function updateUser(e) {
  e.preventDefault();
  if (!isAdmin()) {
    toast("Admin access is restricted.");
    return;
  }
  const index = Number(e.currentTarget.dataset.userIndex);
  const data = Object.fromEntries(new FormData(e.currentTarget));
  const duplicate = state.users.some(
    (user, userIndex) =>
      userIndex !== index &&
      normalizeEmail(user.email) === normalizeEmail(data.email),
  );
  if (duplicate) {
    toast("An account with that email already exists.");
    return;
  }
  const existing = state.users[index];
  state.users[index] = {
    ...existing,
    name: data.name,
    email: data.email,
    role: data.role === "admin" ? "admin" : "member",
    accountStatus: data.accountStatus === "Suspended" ? "Suspended" : "Active",
  };
  localStorage.setItem("dd-users", JSON.stringify(state.users));
  if (
    state.user === existing ||
    normalizeEmail(state.user?.email) === normalizeEmail(existing.email)
  ) {
    state.user = state.users[index];
    localStorage.setItem("dd-session", JSON.stringify(state.user));
  }
  toast("User details saved.");
  render();
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]")?.dataset.action,
    pageTarget = e.target.closest("[data-page]"),
    p = pageTarget?.dataset.page,
    accountSection = pageTarget?.dataset.accountSection;
  if (a === "login") showAuth("login");
  if (a === "signup") showAuth("signup");
  if (a === "close") $("#authModal").classList.add("hidden");
  if (p) {
    if (p === "admin" && !isAdmin()) {
      toast("Admin access is restricted.");
      return;
    }
    state.page = p;
    render();
    if (accountSection) {
      setTimeout(
        () =>
          document
            .getElementById(`${accountSection}Section`)
            ?.scrollIntoView({ block: "center" }),
        0,
      );
    }
  }
});
$("#login").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const email = normalizeEmail(d.email);
  const user = state.users.find(
    (u) => normalizeEmail(u.email) === email && u.password === d.password,
  );
  if (!user) {
    toast("Those login details do not match an account.");
    return;
  }
  if (user.accountStatus === "Suspended") {
    toast("This account is suspended.");
    return;
  }
  $("#authModal").classList.add("hidden");
  enter(user);
  toast("Welcome back, " + user.name.split(" ")[0] + ".");
});
$("#signup").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  if (
    state.users.some((u) => normalizeEmail(u.email) === normalizeEmail(d.email))
  ) {
    toast("An account with that email already exists.");
    return;
  }
  const user = {
    ...d,
    role: "member",
    accountStatus: "Active",
    registrationDate: new Date().toISOString(),
  };
  state.users.push(user);
  localStorage.setItem("dd-users", JSON.stringify(state.users));
  $("#authModal").classList.add("hidden");
  enter(user);
  toast("Your account is ready.");
});
$("#logoutButton").addEventListener("click", () => {
  localStorage.removeItem("dd-session");
  state.user = null;
  $("#appView").classList.add("hidden");
  $("#landingView").classList.remove("hidden");
  toast("You are logged out.");
});
const old = JSON.parse(localStorage.getItem("dd-session") || "null");
const savedUser =
  old &&
  state.users.find(
    (user) =>
      normalizeEmail(user.email) === normalizeEmail(old.email) &&
      user.password === old.password &&
      user.accountStatus !== "Suspended",
  );
if (savedUser) enter(savedUser);
else localStorage.removeItem("dd-session");

function showAdminSetup() {
  if (hasAdminAccount()) {
    localStorage.setItem("dd-admin-setup-complete", "true");
    return;
  }
  localStorage.removeItem("dd-admin-setup-complete");
  const dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.innerHTML = `<div class="modal-card"><p class="eyebrow">ADMIN SETUP</p><h2>Create your admin account.</h2><form id="adminSetupForm"><label>Full name<input name="name" placeholder="Your name" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="12" required></label><button class="button" type="submit">Save admin account <span>→</span></button></form></div>`;
  document.body.append(dialog);
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    if (
      state.users.some(
        (user) => normalizeEmail(user.email) === normalizeEmail(data.email),
      )
    ) {
      toast("An account with that email already exists.");
      return;
    }
    state.users.push({
      ...data,
      role: "admin",
      accountStatus: "Active",
      registrationDate: new Date().toISOString(),
    });
    localStorage.setItem("dd-users", JSON.stringify(state.users));
    localStorage.setItem("dd-admin-setup-complete", "true");
    dialog.remove();
    toast("Admin account created. Log in to continue.");
    showAuth("login");
  });
}

if (location.hash === "#admin-setup") showAdminSetup();
window.addEventListener("hashchange", () => {
  if (location.hash === "#admin-setup") showAdminSetup();
});
