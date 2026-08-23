/* ============ DASSA Theme — dassa.js (vanilla, no dependencies except Leaflet CDN for the map) ============ */
(function () {
  "use strict";

  /* ---------- Header ---------- */
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 10), { passive: true });
  }
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mobileMenu.classList.add("hidden")));
  }
  const searchToggle = document.querySelector("[data-search-toggle]");
  const searchBar = document.querySelector("[data-search-bar]");
  if (searchToggle && searchBar) {
    searchToggle.addEventListener("click", () => {
      searchBar.classList.toggle("hidden");
      if (!searchBar.classList.contains("hidden")) searchBar.querySelector("input").focus();
    });
  }

  /* ---------- Scroll reveal ---------- */
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
    { rootMargin: "-60px" }
  );
  document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));

  /* ---------- Cart drawer (Shopify AJAX Cart API) ---------- */
  const drawer = document.querySelector("[data-cart-drawer]");
  const overlay = document.querySelector("[data-cart-overlay]");
  const moneyFormat = (cents) => (cents / 100).toFixed(2).replace(".", ",") + " $";

  function openCart() {
    drawer.classList.remove("hidden");
    overlay.classList.remove("hidden");
    renderCart();
  }
  function closeCart() {
    drawer.classList.add("hidden");
    overlay.classList.add("hidden");
  }
  document.querySelectorAll("[data-cart-toggle]").forEach((b) => b.addEventListener("click", openCart));
  document.querySelectorAll("[data-cart-close]").forEach((b) => b.addEventListener("click", closeCart));
  if (overlay) overlay.addEventListener("click", closeCart);

  async function fetchCart() {
    const res = await fetch("/cart.js");
    return res.json();
  }

  async function renderCart() {
    if (!drawer) return;
    const cart = await fetchCart();
    const itemsEl = drawer.querySelector("[data-cart-items]");
    const emptyEl = drawer.querySelector("[data-cart-empty]");
    const footEl = drawer.querySelector("[data-cart-foot]");
    const shippingBar = drawer.querySelector("[data-shipping-bar]");
    const badge = document.querySelector("[data-cart-count]");

    if (badge) {
      badge.textContent = cart.item_count;
      badge.classList.toggle("hidden", cart.item_count === 0);
    }

    if (cart.item_count === 0) {
      itemsEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      footEl.classList.add("hidden");
      shippingBar.classList.add("hidden");
      return;
    }
    emptyEl.classList.add("hidden");
    footEl.classList.remove("hidden");
    shippingBar.classList.remove("hidden");

    const threshold = parseInt(drawer.dataset.freeShippingThreshold || "4000", 10);
    const progress = Math.min((cart.total_price / threshold) * 100, 100);
    const msg = drawer.querySelector("[data-shipping-message]");
    const bar = drawer.querySelector("[data-shipping-progress]");
    const shipLabel = drawer.querySelector("[data-shipping-label]");
    if (cart.total_price >= threshold) {
      msg.textContent = "🎉 Livraison gratuite débloquée !";
      if (shipLabel) shipLabel.textContent = "Gratuite";
    } else {
      msg.textContent = "Plus que " + moneyFormat(threshold - cart.total_price) + " pour la livraison gratuite";
      if (shipLabel) shipLabel.textContent = "Calculée au paiement";
    }
    bar.style.width = progress + "%";

    drawer.querySelector("[data-cart-total]").textContent = moneyFormat(cart.total_price);

    itemsEl.innerHTML = cart.items
      .map(
        (item) => `
      <div class="cart-item" data-line-key="${item.key}">
        <div class="cart-item-img">${item.image ? `<img src="${item.image.replace(/(\.[a-z]+)(\?|$)/, "_160x$1$2")}" alt="">` : ""}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.product_title}</p>
          <p class="cart-item-variant">${item.variant_title || ""} · ${moneyFormat(item.price)}</p>
          <div class="cart-item-qty">
            <button class="qty-btn" data-qty-change="-1" aria-label="Réduire">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-qty-change="1" aria-label="Augmenter">+</button>
            <button class="cart-item-remove" data-qty-remove aria-label="Retirer">🗑</button>
          </div>
        </div>
        <p class="cart-item-price">${moneyFormat(item.final_line_price)}</p>
      </div>`
      )
      .join("");

    itemsEl.querySelectorAll("[data-qty-change]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("[data-line-key]");
        const item = cart.items.find((i) => i.key === row.dataset.lineKey);
        await changeLine(item.key, item.quantity + parseInt(btn.dataset.qtyChange, 10));
      });
    });
    itemsEl.querySelectorAll("[data-qty-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("[data-line-key]");
        await changeLine(row.dataset.lineKey, 0);
      });
    });
  }

  async function changeLine(key, quantity) {
    await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity }),
    });
    renderCart();
  }

  async function addToCart(variantId, quantity) {
    await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity: quantity || 1 }] }),
    });
    openCart();
  }

  /* ---------- Product cards : pack selector + add to cart (délégation : survit aux re-renders du Theme Editor) ---------- */
  document.addEventListener("change", (e) => {
    if (!e.target.matches('.product-card input[type="radio"]')) return;
    const card = e.target.closest(".product-card");
    card.querySelectorAll("[data-price-display]").forEach((el) => {
      el.textContent = e.target.dataset.price;
    });
    // Image de la variante (source de vérité : variant.featured_image côté Liquid)
    const variantImage = e.target.dataset.variantImage;
    if (variantImage) {
      const img = card.querySelector(".product-card-media img");
      if (img && img.src !== variantImage) {
        img.src = variantImage;
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
      }
    }
    // Disponibilité de la variante -> état du bouton Ajouter au panier
    if (e.target.dataset.variantAvailable) {
      const addBtn = card.querySelector("[data-add-to-cart]");
      if (addBtn) addBtn.disabled = e.target.dataset.variantAvailable !== "true";
    }
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-card [data-add-to-cart]");
    if (!btn) return;
    const checked = btn.closest(".product-card").querySelector('input[type="radio"]:checked');
    if (checked) addToCart(checked.value, 1);
  });

  /* ---------- PDP : variant price update + AJAX add ---------- */
  const pdpForm = document.querySelector('.pdp-content form[action*="/cart/add"]');
  if (pdpForm) {
    const priceEl = document.querySelector("[data-pdp-price]");
    pdpForm.querySelectorAll('input[name="id"]').forEach((r) =>
      r.addEventListener("change", () => {
        if (priceEl) priceEl.textContent = r.dataset.price;
      })
    );
    pdpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = pdpForm.querySelector('input[name="id"]:checked').value;
      const qty = parseInt(pdpForm.querySelector('input[name="quantity"]').value, 10) || 1;
      addToCart(id, qty);
    });
  }

  /* ---------- Recipe modals ---------- */
  document.querySelectorAll("[data-recipe-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById(btn.dataset.recipeOpen);
      if (modal) modal.showModal();
    });
  });
  document.querySelectorAll(".recipe-modal").forEach((modal) => {
    modal.querySelector("[data-recipe-close]").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
  });

  /* ---------- Store locator (Leaflet via CDN, loaded lazily) ---------- */
  const mapEl = document.getElementById("dassa-map");
  const storesScript = document.querySelector("[data-stores-json]");
  if (mapEl && storesScript) {
    const stores = JSON.parse(storesScript.textContent);
    let userPos = null;
    let map = null;
    let markers = [];
    let cityFilter = "Toutes";
    let query = "";

    const listEl = document.querySelector("[data-store-list]");

    const haversine = (a, b, c, d) => {
      const R = 6371, dLat = ((c - a) * Math.PI) / 180, dLng = ((d - b) * Math.PI) / 180;
      const x = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    function filteredStores() {
      let list = stores.map((s) => ({ ...s, distance: userPos ? haversine(userPos.lat, userPos.lng, s.lat, s.lng) : null }));
      if (cityFilter !== "Toutes") list = list.filter((s) => s.city === cityFilter);
      if (query.trim()) {
        const q = query.toLowerCase();
        list = list.filter((s) => (s.name + s.address + s.city).toLowerCase().includes(q));
      }
      if (userPos) list.sort((a, b) => a.distance - b.distance);
      return list;
    }

    function renderList() {
      const list = filteredStores();
      listEl.innerHTML = list.length
        ? list
            .map(
              (s) => `
        <div class="store-item" data-testid="store-item-${s.id}">
          <div>
            <p class="store-name">${s.name}</p>
            <p class="store-address">📍 ${s.address}</p>
            <p class="store-city">${s.city}${s.distance != null ? ` <span class="store-distance">· à ${s.distance.toFixed(1)} km</span>` : ""}</p>
          </div>
          <button class="store-directions" data-address="${encodeURIComponent(s.address || s.name)}">➜ Itinéraire</button>
        </div>`
            )
            .join("")
        : '<p style="text-align:center;color:rgba(44,33,29,0.5);padding:2.5rem 0;font-size:0.875rem">Aucun point de vente trouvé pour cette recherche.</p>';
      listEl.querySelectorAll("[data-address]").forEach((b) =>
        b.addEventListener("click", () => window.open("https://www.google.com/maps/dir/?api=1&destination=" + b.dataset.address, "_blank"))
      );
      renderMarkers(list);
    }

    function renderMarkers(list) {
      if (!map || !window.L) return;
      markers.forEach((m) => map.removeLayer(m));
      const icon = window.L.divIcon({
        className: "dassa-pin",
        html: '<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.6 26.4 0 17 0z" fill="#B8322A"/><circle cx="17" cy="16" r="7" fill="#FFF7ED"/><circle cx="17" cy="16" r="3.5" fill="#B8322A"/></svg>',
        iconSize: [34, 44],
        iconAnchor: [17, 44],
        popupAnchor: [0, -40],
      });
      markers = list.map((s) =>
        window.L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`<strong>${s.name}</strong><br><span style="font-size:12px">${s.address}</span>`)
      );
    }

    function initMap() {
      map = window.L.map("dassa-map", { scrollWheelZoom: false }).setView([46.81, -71.25], 9);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      renderList();
    }

    function loadLeaflet() {
      if (window.L) return initMap();
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = initMap;
      document.head.appendChild(js);
    }

    new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          loadLeaflet();
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    ).observe(mapEl);

    renderList();

    document.querySelectorAll("[data-city]").forEach((pill) =>
      pill.addEventListener("click", () => {
        document.querySelectorAll("[data-city]").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        cityFilter = pill.dataset.city;
        renderList();
      })
    );
    const searchInput = document.querySelector("[data-store-search]");
    if (searchInput)
      searchInput.addEventListener("input", () => {
        query = searchInput.value;
        renderList();
      });
    const locateBtn = document.querySelector("[data-store-locate]");
    if (locateBtn)
      locateBtn.addEventListener("click", () => {
        if (!navigator.geolocation) return alert("La géolocalisation n'est pas disponible sur cet appareil.");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            renderList();
          },
          () => alert("Impossible d'obtenir votre position.")
        );
      });
  }

  /* Initial cart badge sync */
  renderCart && drawer && fetchCart().then((cart) => {
    const badge = document.querySelector("[data-cart-count]");
    if (badge) {
      badge.textContent = cart.item_count;
      badge.classList.toggle("hidden", cart.item_count === 0);
    }
  });
})();
