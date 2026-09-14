(() => {
  const catalog = [
    {
      id: "herb-chicken",
      name: "Herb chicken & greens",
      price: 349,
      image:
        "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "miso-salmon",
      name: "Miso salmon bowl",
      price: 429,
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "veg-rigatoni",
      name: "Roasted vegetable rigatoni",
      price: 299,
      image:
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "paneer-rice",
      name: "Smoky paneer & rice",
      price: 319,
      image:
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "thai-curry",
      name: "Thai green curry",
      price: 329,
      image:
        "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "tofu-noodles",
      name: "Sesame tofu noodles",
      price: 309,
      image:
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80",
    },
  ];
  const commercePages = new Set(["cart", "checkout", "orders", "confirmation"]);
  const orderStatuses = [
    "Pending",
    "Order Confirmed",
    "Successfully Prepared",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];
  const normalizeOrderStatus = (status) => {
    const legacy = {
      Confirmed: "Order Confirmed",
      Preparing: "Successfully Prepared",
      "Out for delivery": "Out for Delivery",
    };
    return legacy[status] || (orderStatuses.includes(status) ? status : "Pending");
  };
  const currency = (value) => `₹${value.toLocaleString("en-IN")}`;
  const userKey = () => state.user?.email || "guest";
  const cartKey = () => `dd-cart-${userKey()}`;
  const read = (key) => JSON.parse(localStorage.getItem(key) || "[]");
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));
  const getCart = () => read(cartKey());
  const saveCart = (cart) => {
    write(cartKey(), cart);
    updateCartCount();
  };
  const getOrders = () => read("dd-orders");
  const saveOrders = (orders) => write("dd-orders", orders);
  const addressKey = () => `dd-address-${userKey()}`;
  const addressesKey = () => `dd-addresses-${userKey()}`;
  const defaultAddress = {
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
  const addressLines = (address) =>
    Array.isArray(address)
      ? address
      : [
          address.name,
          address.building,
          address.area,
          `${address.city}, ${address.state} - ${address.pincode}`,
          `Mobile: +91 ${address.mobile}`,
          address.landmark ? `Landmark: ${address.landmark}` : "",
        ].filter(Boolean);
  const getAddresses = () => {
    const saved = localStorage.getItem(addressesKey());
    if (saved) return JSON.parse(saved);
    const legacy = JSON.parse(localStorage.getItem(addressKey()) || "null");
    const migrated = legacy
      ? [
          {
            ...defaultAddress,
            building: legacy[0] || defaultAddress.building,
            area: legacy[1]?.split(",")[0] || defaultAddress.area,
          },
        ]
      : [defaultAddress];
    localStorage.setItem(addressesKey(), JSON.stringify(migrated));
    return migrated;
  };
  const selectedAddress = () =>
    getAddresses().find((address) => address.isDefault) ||
    getAddresses()[0] ||
    null;
  const getAddress = () => addressLines(selectedAddress() || defaultAddress);
  const addressText = (address) => addressLines(address).join(", ");
  const notify = (text) => {
    const element = document.querySelector("#toast");
    element.textContent = text;
    element.classList.add("show");
    setTimeout(() => element.classList.remove("show"), 2800);
  };
  const totals = (cart) => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const delivery = subtotal ? 49 : 0;
    return { subtotal, delivery, total: subtotal + delivery };
  };
  const mealFromId = (id) => catalog.find((meal) => meal.id === id);

  function injectNavigation() {
    const sidebarNav = document.querySelector(".sidebar nav");
    if (!sidebarNav || document.querySelector(".commerce-nav")) return;
    const navigation = document.createElement("div");
    navigation.className = "commerce-nav";
    navigation.innerHTML = `<button class="side-link" data-commerce-page="cart">▣ <span>Cart</span><b class="cart-count">0</b></button><button class="side-link" data-commerce-page="orders">◷ <span>My orders</span></button>`;
    sidebarNav.after(navigation);
    updateCartCount();
  }

  function updateCartCount() {
    const badge = document.querySelector(".cart-count");
    if (badge)
      badge.textContent = getCart().reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
  }

  function addToCart(id) {
    const meal = mealFromId(id);
    if (!meal) return;
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...meal, quantity: 1 });
    saveCart(cart);
    notify("Meal added to cart.");
  }

  function mealActions(index) {
    const meal = catalog[index % catalog.length];
    return `<div class="meal-actions"><button class="outline-button" data-commerce-action="add" data-meal="${meal.id}">Add to cart</button><button class="button" data-commerce-action="buy" data-meal="${meal.id}">Buy now</button></div>`;
  }

  function enhanceMealCards() {
    document.querySelectorAll("#pageContent .meal").forEach((card, index) => {
      if (card.closest(".meal-with-actions")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "meal-with-actions";
      card.before(wrapper);
      wrapper.append(card);
      wrapper.insertAdjacentHTML("beforeend", mealActions(index));
    });
  }

  function heading(eyebrow, title) {
    document.querySelector("#appEyebrow").textContent = eyebrow;
    document.querySelector("#appTitle").textContent = title;
  }

  function summary(cart, checkout = false) {
    const price = totals(cart);
    return `<aside class="panel summary-panel"><h3>Order summary</h3><div class="summary-line"><span>Subtotal</span><span>${currency(price.subtotal)}</span></div><div class="summary-line"><span>Delivery</span><span>${currency(price.delivery)}</span></div><div class="summary-line summary-total"><span>Total</span><span>${currency(price.total)}</span></div>${checkout ? "" : `<button class="button checkout-button" data-commerce-action="checkout">Proceed to checkout <span>→</span></button>`}</aside>`;
  }

  function cartRows(cart) {
    return cart
      .map(
        (item) =>
          `<div class="cart-row"><img src="${item.image}" alt="${item.name}"><div><b>${item.name}</b><small>${currency(item.price)} each</small><button class="remove-link" data-commerce-action="remove" data-meal="${item.id}">Remove</button></div><div class="quantity"><button data-commerce-action="decrease" data-meal="${item.id}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-commerce-action="increase" data-meal="${item.id}" aria-label="Increase quantity">+</button></div><strong>${currency(item.price * item.quantity)}</strong></div>`,
      )
      .join("");
  }

  function renderCart() {
    heading("YOUR CART", "Ready when you are.");
    const cart = getCart();
    document.querySelector("#pageContent").innerHTML = cart.length
      ? `<div class="commerce-layout"><section class="panel"><div class="panel-head"><h2>Your meals</h2><span class="status">${cart.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span></div>${cartRows(cart)}</section>${summary(cart)}</div>`
      : `<section class="panel empty-state"><h2>Your cart is empty.</h2><p>Add a few chef-crafted meals and they will appear here.</p><button class="button" data-commerce-page="menu">Browse the menu <span>→</span></button></section>`;
  }

  function renderCheckout() {
    const cart = getCart();
    if (!cart.length) {
      state.page = "cart";
      renderCommerce();
      notify("Your cart is empty.");
      return;
    }
    heading("CHECKOUT", "One last delicious step.");
    const address = getAddress();
    document.querySelector("#pageContent").innerHTML =
      `<div class="commerce-layout"><section class="panel"><h2>Delivery details</h2><div class="checkout-address"><b>Default address</b><br>${address.join("<br>")}</div><button class="text-link" data-address-action="choose">Change address →</button><h2 class="checkout-payment-title">Payment method</h2><label class="payment-option"><input type="radio" name="payment" value="UPI" checked> UPI / Demo payment</label><label class="payment-option"><input type="radio" name="payment" value="Card"> Card / Demo payment</label><button class="button checkout-button" data-commerce-action="place-order">Place order <span>→</span></button></section>${summary(cart, true)}</div>`;
  }

  function renderOrders() {
    heading("MY ORDERS", "Every order, in one place.");
    const orders = getOrders().filter(
      (order) =>
        order.customer.email.trim().toLowerCase() ===
        userKey().trim().toLowerCase(),
    );
    document.querySelector("#pageContent").innerHTML = orders.length
      ? `<section class="panel"><div class="panel-head"><h2>Order history</h2><span class="status">${orders.length} ORDERS</span></div>${orders.map((order) => `<article class="order-card"><span class="status">${normalizeOrderStatus(order.status).toUpperCase()}</span><h3>${order.id}</h3><p>${order.date} · ${order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p><p>${addressText(order.address)} · <b>${currency(order.total)}</b></p></article>`).join("")}</section>`
      : `<section class="panel empty-state"><h2>No orders yet.</h2><p>Your one-time meal orders will show up here.</p><button class="button" data-commerce-page="menu">Explore meals <span>→</span></button></section>`;
  }

  function renderConfirmation() {
    const order = JSON.parse(sessionStorage.getItem("dd-last-order") || "null");
    if (!order) {
      state.page = "orders";
      renderCommerce();
      return;
    }
    heading("ORDER CONFIRMED", "Your meal is on its way.");
    document.querySelector("#pageContent").innerHTML =
      `<section class="panel"><div class="confirmation-icon">✓</div><h2>Thank you for your order.</h2><p class="plan-copy">Order <b>${order.id}</b> was placed successfully. Expected delivery: Wednesday, 25 September, 9am - 1pm.</p><div class="checkout-address"><b>${order.items.map((item) => `${item.name} × ${item.quantity}`).join("<br>")}</b><br><br>${addressLines(order.address).join("<br>")}<br><br><b>Total: ${currency(order.total)}</b><br>Status: ${order.status}</div><button class="button" data-commerce-page="orders">View my orders <span>→</span></button></section>`;
  }

  function renderAdminOrders() {
    if (
      !state.user ||
      state.user.role?.toLowerCase() !== "admin" ||
      state.page !== "admin"
    )
      return;
    const container = document.querySelector("#pageContent .panel");
    if (!container) return;
    container.querySelector(".admin-orders")?.remove();
    const orders = getOrders();
    container.insertAdjacentHTML(
      "beforeend",
      `<section class="admin-orders"><div class="panel-head"><div><h2>Orders</h2><p class="plan-copy">Review customer orders and update fulfillment status.</p></div><span class="status">${orders.length} ORDERS</span></div>${orders.length ? `<div class="orders-table-wrap"><table class="users-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>ADDRESS</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>${orders.map((order) => { const status = normalizeOrderStatus(order.status); return `<tr><td><b>${order.id}</b><br><small>${order.date}</small></td><td><b>${order.customer.name}</b><br><small>${order.customer.email}</small></td><td>${order.items.map((item) => `${item.name} × ${item.quantity}`).join("<br>")}</td><td><small>${addressText(order.address)}</small></td><td><b>${currency(order.total)}</b></td><td><select class="order-status-select" data-order-id="${order.id}" aria-label="Status for ${order.id}">${orderStatuses.map((option) => `<option ${status === option ? "selected" : ""}>${option}</option>`).join("")}</select></td></tr>`; }).join("")}</tbody></table></div>` : `<p class="plan-copy">No orders have been placed yet.</p>`}</section>`,
    );
  }

  function renderCommerce() {
    injectNavigation();
    document
      .querySelectorAll("[data-commerce-page]")
      .forEach((button) =>
        button.classList.toggle(
          "active",
          button.dataset.commercePage === state.page,
        ),
      );
    if (state.page === "cart") renderCart();
    if (state.page === "checkout") renderCheckout();
    if (state.page === "orders") renderOrders();
    if (state.page === "confirmation") renderConfirmation();
    updateCartCount();
  }

  function openAddressEditor() {
    const address = getAddress();
    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.innerHTML = `<div class="modal-card"><button class="close" data-commerce-action="close-address" aria-label="Close">×</button><p class="eyebrow">DELIVERY ADDRESS</p><h2>Update your details</h2><form id="checkoutAddressForm"><label>Address line 1<input name="line1" value="${address[0]}" required></label><label>Address line 2<input name="line2" value="${address[1]}" required></label><button class="button">Save address <span>→</span></button></form></div>`;
    document.body.append(dialog);
    dialog.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      dialog.remove();
      renderCheckout();
    });
  }

  function placeOrder() {
    const cart = getCart();
    const address = getAddress();
    const selected = selectedAddress();
    if (!state.user) {
      localStorage.setItem("dd-pending-checkout", "true");
      showAuth("login");
      return;
    }
    if (!cart.length) {
      notify("Add at least one meal before checking out.");
      state.page = "cart";
      renderCommerce();
      return;
    }
    if (address.some((line) => !line.trim())) {
      notify("Please provide a delivery address.");
      return;
    }
    const payment = document.querySelector(
      'input[name="payment"]:checked',
    )?.value;
    if (!payment) {
      notify("Please choose a payment method.");
      return;
    }
    const price = totals(cart);
    const order = {
      id: `DD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      customer: { name: state.user.name, email: state.user.email },
      items: cart,
      address: selected,
      payment,
      total: price.total,
      status: "Pending",
    };
    saveOrders([order, ...getOrders()]);
    saveCart([]);
    sessionStorage.setItem("dd-last-order", JSON.stringify(order));
    state.page = "confirmation";
    renderCommerce();
    notify("Order placed successfully.");
  }

  function updateOrderStatus(id, status) {
    if (state.user?.role?.toLowerCase() !== "admin") {
      notify("Admin access is required to update order status.");
      return;
    }
    if (!orderStatuses.includes(status)) {
      notify("That order status is not valid.");
      return;
    }
    const orders = getOrders();
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    order.status = status;
    saveOrders(orders);
    notify(`Order ${id} marked ${status}.`);
    renderAdminOrders();
  }

  const previousRender = window.render;
  window.render = function () {
    if (commercePages.has(state.page)) renderCommerce();
    else {
      previousRender();
      injectNavigation();
      enhanceMealCards();
      renderAdminOrders();
      updateCartCount();
    }
  };
  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-commerce-page]");
    if (pageButton) {
      state.page = pageButton.dataset.commercePage;
      renderCommerce();
      return;
    }
    const action = event.target.closest("[data-commerce-action]");
    if (!action) return;
    const id = action.dataset.meal;
    if (action.dataset.commerceAction === "add") addToCart(id);
    if (action.dataset.commerceAction === "buy") {
      addToCart(id);
      state.page = "checkout";
      renderCommerce();
    }
    if (action.dataset.commerceAction === "increase") {
      const cart = getCart();
      cart.find((item) => item.id === id).quantity += 1;
      saveCart(cart);
      renderCart();
    }
    if (action.dataset.commerceAction === "decrease") {
      const cart = getCart();
      const item = cart.find((entry) => entry.id === id);
      if (item.quantity > 1) item.quantity -= 1;
      else cart.splice(cart.indexOf(item), 1);
      saveCart(cart);
      renderCart();
    }
    if (action.dataset.commerceAction === "remove") {
      saveCart(getCart().filter((item) => item.id !== id));
      renderCart();
      notify("Meal removed from cart.");
    }
    if (action.dataset.commerceAction === "checkout") {
      if (!state.user) {
        localStorage.setItem("dd-pending-checkout", "true");
        showAuth("login");
      } else {
        state.page = "checkout";
        renderCommerce();
      }
    }
    if (action.dataset.commerceAction === "place-order") placeOrder();
    if (action.dataset.commerceAction === "close-address")
      action.closest(".modal").remove();
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches(".order-status-select"))
      updateOrderStatus(event.target.dataset.orderId, event.target.value);
  });
  document.addEventListener("dailydish:menu-updated", enhanceMealCards);
  document.addEventListener("click", (event) => {
    const standardPage = event.target.closest("[data-page]")?.dataset.page;
    if (!standardPage) return;
    setTimeout(() => {
      injectNavigation();
      enhanceMealCards();
      renderAdminOrders();
      updateCartCount();
    }, 0);
  });
  document.querySelector("#login")?.addEventListener("submit", () => {
    if (localStorage.getItem("dd-pending-checkout")) {
      localStorage.removeItem("dd-pending-checkout");
      setTimeout(() => {
        state.page = "checkout";
        renderCommerce();
      }, 0);
    }
  });
  injectNavigation();
  enhanceMealCards();
  renderAdminOrders();
})();
