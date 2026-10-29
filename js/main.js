(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Smooth, slow scroll (Lenis) */
  let lenis;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.7, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true, wheelMultiplier: 0.8 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -10, duration: 2 }); closeMenu(); }
    }));
  }

  /* Animate on scroll */
  if (window.AOS) AOS.init({ duration: 1100, easing: "ease-out-cubic", once: true, offset: 70, disable: reduce });

  /* Intro loader: satu momen pembuka */
  const loader = $("#loader");
  if (loader) {
    document.body.classList.add("locked");
    setTimeout(() => {
      loader.classList.add("done");
      document.body.classList.remove("locked");
      document.body.classList.add("ready");
    }, reduce ? 100 : 1900);
  } else document.body.classList.add("ready");

  /* Navbar */
  const nav = $("#nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const menu = $("#menu");
  function closeMenu() { menu && menu.classList.remove("show"); }
  const toggler = $("#navToggle");
  toggler && toggler.addEventListener("click", () => menu.classList.toggle("show"));

  /* Scroll progress + active link */
  const bar = $("#progress");
  const links = $$("#menu a[href^='#']");
  const secs = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${scrollY / h})`;
    let cur = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  }, { passive: true });

  /* Hero mouse parallax (layer 3D) */
  const hero = $("#hero");
  if (hero && !reduce && matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("mousemove", e => {
      const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
      $$("[data-depth]", hero).forEach(el => {
        const d = parseFloat(el.dataset.depth);
        el.style.setProperty("--px", `${x * d * 60}px`);
        el.style.setProperty("--py", `${y * d * 40}px`);
      });
    });
  }

  /* 3D tilt */
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    $$("[data-tilt]").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(10px)`;
      });
      el.addEventListener("mouseleave", () => el.style.transform = "");
    });
  }

  /* Scroll parallax untuk elemen melayang */
  const fl = $$("[data-float]");
  if (fl.length && !reduce) addEventListener("scroll", () => {
    fl.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const o = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.float);
      el.style.setProperty("--sy", `${o}px`);
    });
  }, { passive: true });

  /* Live preview iframe, diskalakan agar pas dengan container */
  window.livePreview = (box, url, interactive = false) => {
    const f = document.createElement("iframe");
    f.src = url; f.loading = "lazy"; f.title = "Live preview"; f.tabIndex = -1;
    f.setAttribute("sandbox", "allow-scripts allow-same-origin");
    if (!interactive) f.style.pointerEvents = "none";
    box.appendChild(f);
    const fit = () => { f.style.transform = `scale(${box.clientWidth / 1280})`; };
    new ResizeObserver(fit).observe(box); fit();
  };

  /* Render card projek */
  const grid = $("#projectGrid");
  if (grid && window.PROJECTS) {
    PROJECTS.forEach((p, i) => {
      const col = document.createElement("div");
      col.className = "col-md-6";
      col.setAttribute("data-aos", "fade-up");
      col.setAttribute("data-aos-delay", (i % 2) * 150);
      col.innerHTML = `
        <a class="pcard" href="project.html?id=${p.id}" data-tilt aria-label="Lihat projek ${p.title}">
          <div class="live"><div class="chrome"><i></i><i></i><i></i><span>${p.live.replace(/^https?:\/\//, "")}</span></div><div class="frame"></div></div>
          <div class="pbody">
            <h3>${p.title}</h3>
            <p>${p.short}</p>
            <span class="go">Lihat detail <b>&rarr;</b></span>
          </div>
        </a>`;
      grid.appendChild(col);
      livePreview($(".frame", col), p.live);
    });
  }

  /* Halaman detail projek */
  const detail = $("#detail");
  if (detail && window.PROJECTS) {
    const id = new URLSearchParams(location.search).get("id");
    const i = Math.max(0, PROJECTS.findIndex(p => p.id === id));
    const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
    document.title = `${p.title} | Novan Mirza Arana Putro`;
    $("#dTitle").textContent = p.title;
    $("#dAbout").textContent = p.about;
    $("#dRole").textContent = p.role; $("#dYear").textContent = p.year;
    $("#dStack").innerHTML = p.stack.map(s => `<span class="chip">${s}</span>`).join("");
    $("#dPoints").innerHTML = p.points.map(s => `<li>${s}</li>`).join("");
    $("#dOpen").href = p.live;
    $("#dNext").href = `project.html?id=${next.id}`; $("#dNext span").textContent = next.title;
    $("#dUrl").textContent = p.live.replace(/^https?:\/\//, "");
    livePreview($("#dFrame"), p.live, true);
  }

  /* Footer + kontak */
  $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear());
  if (window.SITE) {
    $$("[data-email]").forEach(e => { e.href = "mailto:" + SITE.email; if (e.dataset.email === "text") e.textContent = SITE.email; });
    $$("[data-wa]").forEach(e => e.href = "https://wa.me/" + SITE.whatsapp);
    $$("[data-gh]").forEach(e => e.href = SITE.github);
    $$("[data-ig]").forEach(e => e.href = SITE.instagram);
  }
})();
