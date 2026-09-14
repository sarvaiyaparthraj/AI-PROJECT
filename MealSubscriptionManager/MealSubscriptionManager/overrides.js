(() => {
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
    [
      "Smoky paneer & rice",
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=500&q=80",
    ],
    [
      "Thai green curry",
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=500&q=80",
    ],
    [
      "Sesame tofu noodles",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80",
    ],
  ];
  const defaultMealSlots = { breakfast: 0, lunch: 1, dinner: 2 };
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dayLabels = Object.fromEntries(
    days.map((day) => [day, day[0].toUpperCase() + day.slice(1)]),
  );
  const mealSlotsKey = () =>
    `dd-subscription-meal-slots-${state.user?.email || "guest"}`;
  const mealSelections = () => {
    const stored = JSON.parse(localStorage.getItem(mealSlotsKey()) || "null");
    if (!stored)
      return Object.fromEntries(
        days.map((day) => [day, { ...defaultMealSlots }]),
      );
    if (
      stored.breakfast !== undefined ||
      stored.lunch !== undefined ||
      stored.dinner !== undefined
    ) {
      return Object.fromEntries(
        days.map((day) => [
          day,
          day === "wednesday" ? stored : { ...defaultMealSlots },
        ]),
      );
    }
    return Object.fromEntries(
      days.map((day) => [day, { ...defaultMealSlots, ...(stored[day] || {}) }]),
    );
  };
  const saveMealSelections = (selections) =>
    localStorage.setItem(mealSlotsKey(), JSON.stringify(selections));
  let deliveryAddress = [
    "B-14, Shreeji Residency",
    "Waghawadi Road, Bhavnagar, Gujarat 364002",
  ];
  let subscriptionStatus =
    localStorage.getItem("dd-subscription-status") || "ACTIVE";

  function formatRupees() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = node.nodeValue
        .replace("From $9.90", "From ₹349")
        .replace("From $8.50", "From ₹299")
        .replace("$39.60", "₹1,396");
    });
  }

  function mealCards(selectable, slots = {}) {
    return meals
      .map(
        ([name, image], index) =>
          `<article class="meal ${selectable ? "meal-choice" : ""}">${
            selectable && Object.values(slots).includes(index)
              ? `<span class="check">${Object.entries(slots)
                  .filter(([, meal]) => meal === index)
                  .map(([slot]) => slot)
                  .join(", ")}</span>`
              : ""
          }<img src="${image}" alt="${name}"><div><b>${name}</b><span>Ready in 3 min</span></div>${
            selectable
              ? `<div class="meal-slot-actions">${Object.entries({
                  breakfast: "Breakfast",
                  lunch: "Lunch",
                  dinner: "Dinner",
                })
                  .map(
                    ([slot, label]) =>
                      `<button class="${slots[slot] === index ? "selected" : ""}" data-meal-slot="${slot}" data-meal-id="${index}">${label}</button>`,
                  )
                  .join("")}</div>`
              : ""
          }</article>`,
      )
      .join("");
  }

  function upgradeMenu() {
    const panel = document.querySelector("#pageContent .panel");
    if (
      !panel ||
      !document
        .querySelector('[data-page="menu"]')
        ?.classList.contains("active")
    )
      return;
    document.querySelector("#appTitle").textContent = "Plan your daily trio.";
    const activeDay = panel.dataset.activeDay || "wednesday";
    const selections = mealSelections();
    const slots = selections[activeDay];
    const selected = Object.values(slots).filter(Number.isInteger);
    const slotMealName = (slot) =>
      Number.isInteger(slots[slot])
        ? meals[slots[slot]][0]
        : "Not selected yet";
    panel.innerHTML = `<div class="panel-head"><div><h2>Plan 3 meals a day</h2><p class="selection-help">Choose one meal for breakfast, lunch, and dinner on ${dayLabels[activeDay]}. You can change your choices at any time.</p></div><span class="status">${selected.length} OF 3 SELECTED</span></div><div class="meal-days">${days.map((day) => `<button class="${day === activeDay ? "selected" : ""}" data-meal-day="${day}">${dayLabels[day]}</button>`).join("")}</div><div class="meal-slot-summary"><span><b>Breakfast</b>${slotMealName("breakfast")}</span><span><b>Lunch</b>${slotMealName("lunch")}</span><span><b>Dinner</b>${slotMealName("dinner")}</span></div><div class="meal-list">${mealCards(true, slots)}</div>`;
    panel.querySelectorAll("[data-meal-day]").forEach((button) =>
      button.addEventListener("click", () => {
        panel.dataset.activeDay = button.dataset.mealDay;
        upgradeMenu();
        document.dispatchEvent(new CustomEvent("dailydish:menu-updated"));
      }),
    );
    panel.querySelectorAll("[data-meal-slot]").forEach((button) =>
      button.addEventListener("click", () => {
        const slot = button.dataset.mealSlot;
        const mealId = Number(button.dataset.mealId);
        const currentSelections = mealSelections();
        const currentSlots = currentSelections[activeDay];
        if (currentSlots[slot] === mealId) {
          delete currentSlots[slot];
        } else {
          currentSlots[slot] = mealId;
        }
        saveMealSelections(currentSelections);
        const toast = document.querySelector("#toast");
        toast.textContent =
          currentSlots[slot] === mealId
            ? `${meals[mealId][0]} set for ${slot}.`
            : `${slot[0].toUpperCase() + slot.slice(1)} meal removed.`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2800);
        panel.dataset.activeDay = activeDay;
        upgradeMenu();
        document.dispatchEvent(new CustomEvent("dailydish:menu-updated"));
      }),
    );
  }

  function upgradeNotifications() {
    const bell = document.querySelector(".bell");
    if (!bell || bell.dataset.enhanced) return;
    bell.dataset.enhanced = "true";
    bell.id = "notificationsButton";
    bell.title = "Notifications";
    const panel = document.createElement("div");
    panel.className = "notification-panel hidden";
    panel.innerHTML =
      "<b>Notifications</b><p>Your next delivery is confirmed for Wednesday, 18 September.</p>";
    document.querySelector(".workspace header").after(panel);
    bell.addEventListener("click", () => panel.classList.toggle("hidden"));
  }

  function upgradeAccount() {
    if (
      !document
        .querySelector('[data-page="account"]')
        ?.classList.contains("active")
    )
      return;
    document.querySelector("#appTitle").textContent =
      "Manage your subscription.";
    const storedAddress = localStorage.getItem(
      `dd-address-${state.user?.email || "guest"}`,
    );
    if (storedAddress) deliveryAddress = JSON.parse(storedAddress);
    const details = document.querySelectorAll("#pageContent .plan-copy");
    if (details[0])
      details[0].textContent =
        subscriptionStatus === "PAUSED"
          ? "Subscription paused · Resume whenever you're ready."
          : "Daily Trio plan · 3 meals a day · ₹899 per day";
    if (details[1]) details[1].innerHTML = deliveryAddress.join("<br>");

    const subscriptionHeading = document.querySelector("#pageContent h2");
    let status = document.querySelector(".subscription-status");
    if (!status) {
      status = document.createElement("span");
      status.className = "status subscription-status";
      subscriptionHeading.after(status);
    }
    status.textContent = subscriptionStatus;
    status.classList.toggle(
      "is-paused-status",
      subscriptionStatus === "PAUSED",
    );

    const pauseButton = [
      ...document.querySelectorAll("#pageContent button"),
    ].find((button) => button.textContent.includes("subscription"));
    if (!pauseButton || pauseButton.dataset.subscriptionControl) return;
    pauseButton.dataset.subscriptionControl = "true";
    pauseButton.textContent =
      subscriptionStatus === "ACTIVE"
        ? "Pause subscription"
        : "Resume subscription";
    pauseButton.classList.toggle("is-paused", subscriptionStatus === "PAUSED");
    pauseButton?.addEventListener("click", () => {
      subscriptionStatus =
        subscriptionStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      localStorage.setItem("dd-subscription-status", subscriptionStatus);
      const paused = subscriptionStatus === "PAUSED";
      pauseButton.classList.toggle("is-paused", paused);
      pauseButton.textContent = paused
        ? "Resume subscription"
        : "Pause subscription";
      const subscription = document.querySelector("#pageContent .plan-copy");
      subscription.textContent = paused
        ? "Subscription paused · Resume whenever you're ready."
        : "Daily Trio plan · 3 meals a day · ₹899 per day";
      status.textContent = subscriptionStatus;
      status.classList.toggle("is-paused-status", paused);
      const toast = document.querySelector("#toast");
      toast.textContent = paused
        ? "Your subscription has been paused."
        : "Your subscription is active again.";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2800);
    });

    const editButton = [
      ...document.querySelectorAll("#pageContent button"),
    ].find((button) => button.textContent.includes("Edit details"));
    editButton?.addEventListener("click", () => showAddressEditor(), {
      once: true,
    });
  }

  function showAddressEditor() {
    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.innerHTML = `<div class="modal-card delivery-modal"><button class="close" aria-label="Close">×</button><p class="eyebrow">DELIVERY ADDRESS</p><h2>Update your details</h2><form class="address-form"><label>Address line 1<input name="line1" value="${deliveryAddress[0]}" required></label><label>Address line 2<input name="line2" value="${deliveryAddress[1]}" required></label><button class="button">Save address <span>→</span></button></form></div>`;
    document.body.append(dialog);
    dialog
      .querySelector(".close")
      .addEventListener("click", () => dialog.remove());
    dialog.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      deliveryAddress = [form.get("line1"), form.get("line2")];
      localStorage.setItem(
        `dd-address-${state.user?.email || "guest"}`,
        JSON.stringify(deliveryAddress),
      );
      dialog.remove();
      upgradeAccount();
      const toast = document.querySelector("#toast");
      toast.textContent = "Your delivery address was updated.";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2800);
    });
  }

  function upgradeDeliveries() {
    if (
      !document
        .querySelector('[data-page="deliveries"]')
        ?.classList.contains("active")
    )
      return;
    const manageButton = [
      ...document.querySelectorAll("#pageContent .text-link"),
    ].find((button) => button.textContent.includes("Manage"));
    if (!manageButton || manageButton.dataset.enhanced) return;
    manageButton.dataset.enhanced = "true";
    manageButton.addEventListener("click", () => {
      const selected = Object.values(mealSelections().wednesday).filter(
        Number.isInteger,
      );
      const dialog = document.createElement("div");
      dialog.className = "modal";
      dialog.innerHTML = `<div class="modal-card delivery-modal"><button class="close" aria-label="Close">×</button><p class="eyebrow">WEDNESDAY, 25 SEPTEMBER</p><h2>Manage delivery</h2><p class="plan-copy">Your box contains ${selected.size} meals and arrives between 9am - 1pm.</p><button class="button edit-meals">Edit meals <span>→</span></button><button class="outline-button skip-delivery">Skip this delivery</button></div>`;
      document.body.append(dialog);
      dialog
        .querySelector(".close")
        .addEventListener("click", () => dialog.remove());
      dialog.querySelector(".edit-meals").addEventListener("click", () => {
        dialog.remove();
        document.querySelector('[data-page="menu"]').click();
      });
      dialog.querySelector(".skip-delivery").addEventListener("click", () => {
        dialog.remove();
        manageButton
          .closest(".delivery-row")
          .querySelector("small").textContent = "Delivery skipped";
        manageButton.replaceWith(
          Object.assign(document.createElement("span"), {
            textContent: "SKIPPED",
            className: "status",
          }),
        );
      });
    });
  }

  formatRupees();
  const originalRender = window.render;
  window.render = function () {
    originalRender();
    upgradeMenu();
    upgradeNotifications();
    upgradeAccount();
    upgradeDeliveries();
    formatRupees();
  };
  upgradeNotifications();
  document.addEventListener("click", (event) => {
    if (event.target.closest('[data-page="menu"]')) setTimeout(upgradeMenu, 0);
    if (event.target.closest('[data-page="account"]'))
      setTimeout(upgradeAccount, 0);
    if (event.target.closest('[data-page="deliveries"]'))
      setTimeout(upgradeDeliveries, 0);
  });
})();
