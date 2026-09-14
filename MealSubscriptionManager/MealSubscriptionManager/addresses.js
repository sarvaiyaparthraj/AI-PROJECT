(() => {
  const key = () => `dd-addresses-${state.user?.email || "guest"}`;
  const initial = {
    id: "default-bhavnagar",
    name: "Parthrajsinh Sarvaiya",
    mobile: "9876543210",
    building: "B-14, Shreeji Residency",
    area: "Waghawadi Road",
    city: "Bhavnagar",
    state: "Gujarat",
    pincode: "364002",
    landmark: "",
    isDefault: true,
  };
  const readAddresses = () => {
    const saved = localStorage.getItem(key());
    if (saved) return JSON.parse(saved);
    const legacy = JSON.parse(
      localStorage.getItem(`dd-address-${state.user?.email || "guest"}`) ||
        "null",
    );
    const migrated = legacy
      ? [
          {
            ...initial,
            building: legacy[0] || initial.building,
            area: legacy[1]?.split(",")[0] || initial.area,
          },
        ]
      : [initial];
    localStorage.setItem(key(), JSON.stringify(migrated));
    return migrated;
  };
  const saveAddresses = (addresses) =>
    localStorage.setItem(key(), JSON.stringify(addresses));
  const notify = (text) => {
    const element = document.querySelector("#toast");
    element.textContent = text;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 2800);
  };
  const esc = (value) =>
    String(value || "").replace(
      /[&<>"]/g,
      (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
    );
  const lines = (address) =>
    `${esc(address.building)}, ${esc(address.area)}<br>${esc(address.city)}, ${esc(address.state)} - ${esc(address.pincode)}${address.landmark ? `<br>Landmark: ${esc(address.landmark)}` : ""}`;

  function addressCard(address) {
    return `<article class="address-card ${address.isDefault ? "default" : ""}">${address.isDefault ? '<span class="status">✓ DEFAULT</span>' : ""}<strong>${esc(address.name)}</strong><p>${lines(address)}<br>Mobile: +91 ${esc(address.mobile)}</p><div class="address-actions"><button data-address-action="edit" data-address-id="${address.id}">Edit</button><button data-address-action="delete" data-address-id="${address.id}">Delete</button>${address.isDefault ? "" : `<button class="secondary" data-address-action="default" data-address-id="${address.id}">Set as default</button>`}</div></article>`;
  }

  function renderAccountAddresses() {
    if (
      !document
        .querySelector('[data-page="account"]')
        ?.classList.contains("active")
    )
      return;
    const form = document.querySelector("#pageContent .manage-form");
    if (!form) return;
    const divider = form.querySelector("hr");
    if (!divider) return;
    let node = divider.nextSibling;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
    const section = document.createElement("section");
    section.className = "address-manager";
    section.id = "deliveryAddressSection";
    section.innerHTML = `<h2>Delivery address</h2><p class="plan-copy">Manage where we deliver your meals.</p>${readAddresses().map(addressCard).join("")}<button class="outline-button add-address" data-address-action="add">Add new address</button>`;
    form.append(section);
  }

  function showForm(address = null, returnToCheckout = false) {
    const current = address || {
      name: "",
      mobile: "",
      building: "",
      area: "",
      city: "Bhavnagar",
      state: "Gujarat",
      pincode: "",
      landmark: "",
    };
    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.innerHTML = `<div class="modal-card"><button class="close" data-address-action="close" aria-label="Close">×</button><p class="eyebrow">DELIVERY ADDRESS</p><h2>${address ? "Edit address" : "Add an address"}</h2><form id="addressForm"><div class="address-form-grid"><label class="full">Full name<input name="name" value="${esc(current.name)}" required></label><label>Mobile number<input name="mobile" inputmode="numeric" maxlength="10" value="${esc(current.mobile)}" required></label><label>House / Flat / Building<input name="building" value="${esc(current.building)}" required></label><label class="full">Area / Street<input name="area" value="${esc(current.area)}" required></label><label>City<input name="city" value="${esc(current.city)}" required></label><label>State<input name="state" value="${esc(current.state)}" required></label><label>Pincode<input name="pincode" inputmode="numeric" maxlength="6" value="${esc(current.pincode)}" required></label><label>Landmark (optional)<input name="landmark" value="${esc(current.landmark)}"></label></div><p class="address-error" aria-live="polite"></p><button class="button">Save address <span>→</span></button></form></div>`;
    document.body.append(dialog);
    dialog.querySelector("#addressForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const error = dialog.querySelector(".address-error");
      if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(values.name.trim()))
        error.textContent = "Enter a valid full name.";
      else if (!/^\d{10}$/.test(values.mobile.trim()))
        error.textContent = "Enter a valid 10-digit mobile number.";
      else if (
        !values.building.trim() ||
        !values.area.trim() ||
        !values.city.trim() ||
        !values.state.trim()
      )
        error.textContent = "Please complete all required address fields.";
      else if (!/^\d{6}$/.test(values.pincode.trim()))
        error.textContent = "Enter a valid 6-digit pincode.";
      else {
        const addresses = readAddresses();
        if (address)
          Object.assign(
            addresses.find((item) => item.id === address.id),
            values,
          );
        else
          addresses.push({
            ...values,
            id: `addr-${Date.now().toString(36)}`,
            isDefault: !addresses.length,
          });
        saveAddresses(addresses);
        dialog.remove();
        notify(
          address
            ? "Delivery address updated successfully."
            : "Delivery address saved successfully.",
        );
        if (returnToCheckout) renderCheckoutAddresses();
        else renderAccountAddresses();
      }
    });
  }

  function setDefault(id) {
    const addresses = readAddresses().map((address) => ({
      ...address,
      isDefault: address.id === id,
    }));
    saveAddresses(addresses);
    notify("Default delivery address updated.");
    renderAccountAddresses();
  }

  function removeAddress(id) {
    const addresses = readAddresses();
    if (addresses.length === 1) {
      notify("Keep at least one delivery address.");
      return;
    }
    const wasDefault = addresses.find(
      (address) => address.id === id,
    )?.isDefault;
    const remaining = addresses.filter((address) => address.id !== id);
    if (wasDefault) remaining[0].isDefault = true;
    saveAddresses(remaining);
    notify("Delivery address removed successfully.");
    renderAccountAddresses();
  }

  function addressChooser() {
    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.innerHTML = `<div class="modal-card"><button class="close" data-address-action="close" aria-label="Close">×</button><p class="eyebrow">DELIVERY ADDRESS</p><h2>Choose an address</h2><div class="address-options">${readAddresses()
      .map(
        (address) =>
          `<button class="address-choice ${address.isDefault ? "selected" : ""}" data-address-action="select-checkout" data-address-id="${address.id}">${address.isDefault ? '<span class="status">DEFAULT</span>' : ""}<strong>${esc(address.name)}</strong><small>${esc(address.building)}, ${esc(address.city)} · +91 ${esc(address.mobile)}</small></button>`,
      )
      .join(
        "",
      )}</div><button class="outline-button add-address" data-address-action="add-checkout">Add new address</button></div>`;
    document.body.append(dialog);
  }

  function renderCheckoutAddresses() {
    const page = document.querySelector("#appEyebrow")?.textContent;
    if (page === "CHECKOUT") {
      state.page = "checkout";
      window.render();
    }
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-address-action]");
    if (!action) return;
    const id = action.dataset.addressId;
    if (action.dataset.addressAction === "add") showForm();
    if (action.dataset.addressAction === "edit")
      showForm(readAddresses().find((address) => address.id === id));
    if (action.dataset.addressAction === "delete") removeAddress(id);
    if (action.dataset.addressAction === "default") setDefault(id);
    if (action.dataset.addressAction === "choose") addressChooser();
    if (action.dataset.addressAction === "add-checkout") {
      action.closest(".modal").remove();
      showForm(null, true);
    }
    if (action.dataset.addressAction === "select-checkout") {
      setDefault(id);
      action.closest(".modal").remove();
      state.page = "checkout";
      window.render();
    }
    if (action.dataset.addressAction === "close")
      action.closest(".modal").remove();
  });
  const previousRender = window.render;
  window.render = function () {
    previousRender();
    renderAccountAddresses();
  };
  document.addEventListener("click", (event) => {
    if (event.target.closest('[data-page="account"]'))
      setTimeout(renderAccountAddresses, 0);
  });
  renderAccountAddresses();
})();
