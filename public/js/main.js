(() => {
  "use strict";

  // ===== Year =====
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Mobile nav =====
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }),
    );
  }

  // ===== Modal =====
  const modal = document.getElementById("modal");
  const modalDialog = modal?.querySelector(".modal__dialog");
  const variantSelect = document.querySelector('select[name="variant"]');
  let lastFocused = null;

  function openModal(variant) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (variant && variantSelect) {
      const opt = Array.from(variantSelect.options).find(
        (o) => o.value === variant || o.text === variant,
      );
      if (opt) variantSelect.value = opt.value || opt.text;
    }
    const firstInput = modalDialog?.querySelector(
      "input, textarea, select, button",
    );
    firstInput?.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    lastFocused?.focus?.();
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(btn.dataset.variant);
    });
  });
  document
    .querySelectorAll("[data-close-modal]")
    .forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  // ===== Phone mask + RU validation (+7XXXXXXXXXX) =====
  const phoneInput = document.querySelector('input[name="phone"]');

  function formatRuPhone(raw) {
    let v = (raw || "").replace(/\D/g, "");
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (v.startsWith("9") && v.length <= 10) v = "7" + v;
    if (!v.startsWith("7")) v = "7" + v;
    v = v.slice(0, 11);
    const p = ["+7"];
    if (v.length > 1) p.push(" (" + v.slice(1, 4));
    if (v.length >= 4) p[1] += ")";
    if (v.length >= 5) p.push(" " + v.slice(4, 7));
    if (v.length >= 8) p.push("-" + v.slice(7, 9));
    if (v.length >= 10) p.push("-" + v.slice(9, 11));
    return { display: p.join(""), digits: v };
  }

  function getRuPhoneE164(value) {
    const digits = (value || "").replace(/\D/g, "").replace(/^8/, "7");
    if (/^7\d{10}$/.test(digits)) return "+" + digits;
    return null;
  }

  if (phoneInput) {
    phoneInput.addEventListener("focus", () => {
      if (!phoneInput.value) phoneInput.value = "+7 ";
    });
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatRuPhone(phoneInput.value).display;
      phoneInput.setCustomValidity("");
    });
    phoneInput.addEventListener("blur", () => {
      if (phoneInput.value && !getRuPhoneE164(phoneInput.value)) {
        phoneInput.setCustomValidity(
          "Введите российский номер в формате +7XXXXXXXXXX",
        );
      }
    });
  }

  // ===== Form submit =====
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      status.className = "form__status";

      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || data.name.trim().length < 2) {
        status.textContent = "Пожалуйста, укажите имя.";
        status.classList.add("is-error");
        return;
      }
      const phoneE164 = getRuPhoneE164(data.phone);
      if (!phoneE164) {
        status.textContent =
          "Номер должен быть в российском формате: +7XXXXXXXXXX.";
        status.classList.add("is-error");
        phoneInput?.focus();
        return;
      }
      data.phone = phoneE164;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.style.opacity = ".7";

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          status.textContent =
            "Заявка отправлена! Перезвоним в ближайшее время.";
          status.classList.add("is-success");
          form.reset();
          setTimeout(closeModal, 1800);
        } else {
          status.textContent =
            json.error || "Не удалось отправить. Попробуйте позже.";
          status.classList.add("is-error");
        }
      } catch {
        status.textContent = "Ошибка сети. Попробуйте позже.";
        status.classList.add("is-error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "";
      }
    });
  }

  // ===== Gallery: подгрузка фото из data-src + модалки/лайтбокс =====
  const galleryItems = Array.from(
    document.querySelectorAll(".gallery__item[data-src]"),
  );
  const photos = galleryItems.map((el) => el.getAttribute("data-src"));

  galleryItems.forEach((item) => {
    const src = item.getAttribute("data-src");
    if (src && src.trim()) {
      item.style.backgroundImage = `url("${src}")`;
      const label = item.querySelector("span");
      if (label) label.remove();
    }
  });

  // Счётчик "+N" на кнопке
  const countEl = document.getElementById("gallery-count");
  if (countEl && photos.length > 3) {
    countEl.textContent = `+${photos.length - 3}`;
  } else if (countEl) {
    countEl.remove();
  }

  // ===== Gallery grid modal =====
  const gmodal = document.getElementById("gmodal-grid");
  const gmodalList = document.getElementById("gmodal-grid-list");
  const showAllBtn = document.getElementById("gallery-show-all");

  function openGmodal() {
    if (!gmodal || !gmodalList) return;
    if (!gmodalList.childElementCount) {
      photos.forEach((src, i) => {
        const fig = document.createElement("figure");
        fig.style.backgroundImage = `url("${src}")`;
        fig.dataset.index = String(i);
        fig.setAttribute("role", "button");
        fig.setAttribute("tabindex", "0");
        fig.setAttribute("aria-label", `Открыть фото ${i + 1}`);
        fig.addEventListener("click", () => openLightbox(i));
        fig.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox(i);
          }
        });
        gmodalList.appendChild(fig);
      });
    }
    gmodal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeGmodal() {
    if (gmodal) gmodal.hidden = true;
    if (!lightbox || lightbox.hidden) document.body.style.overflow = "";
  }

  showAllBtn?.addEventListener("click", openGmodal);
  document
    .querySelectorAll("[data-close-gmodal]")
    .forEach((el) => el.addEventListener("click", closeGmodal));

  // Превью-плитки тоже открывают лайтбокс
  galleryItems.forEach((el, i) => {
    el.addEventListener("click", () => openLightbox(i));
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  // ===== Lightbox =====
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCounter = document.getElementById("lightbox-counter");
  let lbIndex = 0;

  function showLb(i) {
    if (!photos.length) return;
    lbIndex = (i + photos.length) % photos.length;
    if (lightboxImg) {
      lightboxImg.src = photos[lbIndex];
      lightboxImg.alt = `Работа ${lbIndex + 1} из ${photos.length}`;
    }
    if (lightboxCounter)
      lightboxCounter.textContent = `${lbIndex + 1} / ${photos.length}`;
  }
  function openLightbox(i) {
    if (!lightbox) return;
    showLb(i);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (lightbox) lightbox.hidden = true;
    if (!gmodal || gmodal.hidden) document.body.style.overflow = "";
  }
  function nextLb() {
    showLb(lbIndex + 1);
  }
  function prevLb() {
    showLb(lbIndex - 1);
  }

  document
    .querySelectorAll("[data-close-lightbox]")
    .forEach((el) => el.addEventListener("click", closeLightbox));
  document
    .querySelectorAll("[data-lightbox-prev]")
    .forEach((el) => el.addEventListener("click", prevLb));
  document
    .querySelectorAll("[data-lightbox-next]")
    .forEach((el) => el.addEventListener("click", nextLb));

  // Закрытие лайтбокса по клику на пустую область (вне кнопок и картинки)
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.id === "lightbox-stage") {
      closeLightbox();
    }
  });

  // Клавиатура
  document.addEventListener("keydown", (e) => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") nextLb();
      else if (e.key === "ArrowLeft") prevLb();
    } else if (gmodal && !gmodal.hidden && e.key === "Escape") {
      closeGmodal();
    }
  });

  // Свайпы на мобильных
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  lightbox?.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchActive = true;
    },
    { passive: true },
  );
  lightbox?.addEventListener(
    "touchend",
    (e) => {
      if (!touchActive) return;
      touchActive = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) nextLb();
        else prevLb();
      }
    },
    { passive: true },
  );
})();
