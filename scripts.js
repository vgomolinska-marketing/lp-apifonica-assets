/* Apifonica landing — shared JS
   Hamburger / pricing calc / demo form / case tabs / plan select */
(function () {
  // ===== Hamburger menu toggle =====
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
      });
    });
  }

  // ===== Case study tabs =====
  document.querySelectorAll('.cases-tabs').forEach(function (group) {
    var tabs = group.querySelectorAll('.case-tab');
    var cases = group.querySelectorAll('[data-case-id]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = tab.dataset.case;
        tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.case === idx); });
        cases.forEach(function (c) { c.classList.toggle('is-active', c.dataset.caseId === idx); });
      });
    });
  });

  // ===== Plan selection from pricing card → demo form =====
  var planSelect = document.getElementById('dfPlan');
  var planSelectWrap = planSelect ? planSelect.closest('.form-field') : null;

  document.querySelectorAll('[data-select-plan]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var plan = btn.dataset.selectPlan;
      if (planSelect) {
        planSelect.value = plan;
        if (planSelectWrap) planSelectWrap.classList.add('plan-prefilled');
        // Brief flash to call attention
        setTimeout(function () {
          if (planSelectWrap) planSelectWrap.classList.remove('plan-prefilled');
        }, 2500);
      } else {
        // For multi-page sites where pricing is on another page,
        // persist selection via URL hash → handled on load below
        try { sessionStorage.setItem('apf_selected_plan', plan); } catch (e) {}
      }
    });
  });

  // On page load, if we have a stored plan and a form on this page, prefill it
  if (planSelect) {
    try {
      var stored = sessionStorage.getItem('apf_selected_plan');
      if (stored) {
        planSelect.value = stored;
        if (planSelectWrap) planSelectWrap.classList.add('plan-prefilled');
        sessionStorage.removeItem('apf_selected_plan');
      }
    } catch (e) {}
  }

  // ===== Pricing calculator (only on index.html) =====
  var calcRange = document.getElementById('calcRange');
  if (calcRange) {
    var elMinutes = document.getElementById('calcMinutes');
    var elPlan    = document.getElementById('calcPlan');
    var elBadge   = document.getElementById('calcBadge');
    var elTotal   = document.getElementById('calcTotal');
    var elBase    = document.getElementById('calcBase');
    var elExtra   = document.getElementById('calcExtra');
    var elSum     = document.getElementById('calcSum');

    function fmt(n) {
      return Math.round(n).toLocaleString('pl-PL').replace(/,/g, ' ').replace(/ /g, ' ') + ' zł';
    }
    function fmtN(n) {
      return Math.round(n).toLocaleString('pl-PL').replace(/,/g, ' ').replace(/ /g, ' ');
    }

    function calc() {
      var minutes = parseInt(calcRange.value, 10);
      var plan, base, included, extraRate, badge;

      if (minutes <= 5000) {
        plan = 'Starter'; base = 3920; included = 5000; extraRate = 0.78; badge = 'Wystarczający';
      } else if (minutes <= 15000) {
        plan = 'Professional'; base = 7430; included = 15000; extraRate = 0.50; badge = 'Najlepszy';
      } else {
        plan = 'Enterprise'; base = 15000; included = 35000; extraRate = 0.43; badge = 'Optymalny';
      }

      var extraMin = Math.max(0, minutes - included);
      var extraCost = extraMin * extraRate;
      var total = base + extraCost;

      elMinutes.textContent = fmtN(minutes);
      elPlan.textContent = plan;
      elBadge.textContent = badge;
      elTotal.textContent = fmt(total);
      elBase.textContent = fmt(base);
      elExtra.textContent = extraCost === 0
        ? '0 zł'
        : fmt(extraCost) + ' (' + fmtN(extraMin) + ' min × ' + extraRate.toFixed(2).replace('.', ',') + ' zł)';
      elSum.textContent = fmt(total);
    }
    calcRange.addEventListener('input', calc);
    calc();
  }

  // ===== Demo form (HubSpot Forms API + fallback) =====
  var demoForm = document.getElementById('demoForm');
  var demoSuccess = document.getElementById('demoSuccess');
  if (demoForm) {
    demoForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Wpisz swoje wartości HubSpot poniżej, by formularz wysyłał dane do CRM:
      var PORTAL_ID = '';   // np. '12345678'
      var FORM_ID   = '';   // np. 'abcdef12-3456-7890-abcd-ef1234567890'

      var fd = new FormData(demoForm);
      var fields = [];
      fd.forEach(function (v, n) { fields.push({ name: n, value: v }); });
      var payload = {
        submittedAt: Date.now(),
        fields: fields,
        context: { pageUri: location.href, pageName: document.title }
      };

      function done() {
        demoForm.style.display = 'none';
        if (demoSuccess) demoSuccess.classList.add('is-visible');
      }

      if (PORTAL_ID && FORM_ID) {
        fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + PORTAL_ID + '/' + FORM_ID, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(done).catch(done);
      } else {
        console.log('Demo form submitted (HubSpot not configured):', payload);
        done();
      }
    });
  }

  // ===== Figures: count-up animation when scrolled into view =====
  var figureValues = document.querySelectorAll('.figure-value[data-count]');
  if (figureValues.length && 'IntersectionObserver' in window) {
    var fmtSpace = function (n) {
      // Polish thousand separator = space (we render with a regular space)
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    var animateValue = function (el) {
      var target = parseInt(el.dataset.count, 10);
      var suffix = el.dataset.suffix || '';
      var format = el.dataset.format || '';
      var duration = 1400 + Math.random() * 300;
      var start = performance.now();
      var frame = function (t) {
        var p = Math.min((t - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        var v = Math.round(target * eased);
        el.textContent = (format === 'space' ? fmtSpace(v) : String(v)) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateValue(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    figureValues.forEach(function (el) { io.observe(el); });
  }

  // ===== Mobile: turn the demo form into a "Zostaw kontakt" button + popup =====
  // On phones HubSpot's form crams 7 white fields into the page and breaks the
  // dark theme. Solution: hide the form, show a button, on click open a
  // full-screen popup with the form inside.
  function setupMobileFormPopup() {
    if (window.innerWidth > 768) return;
    if (document.querySelector('.apf-form-popup')) return; // already set up

    var formWrap = document.querySelector('.demo-form-wrap');
    var demoGrid = document.querySelector('.demo-grid');
    if (!formWrap || !demoGrid) return;

    // Insert popup CSS once
    if (!document.getElementById('apf-popup-css')) {
      var st = document.createElement('style');
      st.id = 'apf-popup-css';
      st.textContent = [
        '@media (max-width: 768px) {',
        '  .demo-form-wrap { display: none !important; }',
        '  .demo-open-form-mobile {',
        '    display: inline-flex !important; align-items: center; justify-content: center; gap: 8px;',
        '    width: 100% !important; margin-top: 24px;',
        '    background: #6FE39D !important; color: #052821 !important;',
        '    border: none !important; border-radius: 999px !important;',
        '    padding: 16px 28px !important; font: 700 16px Inter, system-ui, sans-serif;',
        '    cursor: pointer;',
        '    box-shadow: 0 0 0 1px rgba(111,227,157,0.30), 0 8px 28px rgba(111,227,157,0.40), 0 0 36px rgba(111,227,157,0.30);',
        '  }',
        '  .apf-form-popup {',
        '    position: fixed; inset: 0; z-index: 99999;',
        '    background: rgba(15, 15, 15, 0.92);',
        '    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);',
        '    display: none; overflow-y: auto; -webkit-overflow-scrolling: touch;',
        '  }',
        '  body.apf-form-open { overflow: hidden; }',
        '  body.apf-form-open .apf-form-popup { display: block; }',
        '  .apf-form-popup__inner {',
        '    background: #231F20; min-height: 100vh; padding: 64px 22px 40px;',
        '    box-sizing: border-box;',
        '  }',
        '  .apf-form-popup__close {',
        '    position: fixed; top: 16px; right: 16px;',
        '    width: 40px; height: 40px; border-radius: 50%;',
        '    background: rgba(255,255,255,0.10); color: #FFF;',
        '    border: 1px solid rgba(255,255,255,0.18);',
        '    display: flex; align-items: center; justify-content: center;',
        '    font-size: 22px; line-height: 1; cursor: pointer; z-index: 2;',
        '  }',
        '  .apf-form-popup__title { font: 700 22px Manrope, system-ui, sans-serif; color: #FFF; margin: 0 0 6px; letter-spacing: -0.01em; }',
        '  .apf-form-popup__sub { font: 400 14px Inter, system-ui, sans-serif; color: rgba(255,255,255,0.65); margin: 0 0 22px; }',
        '}',
        '@media (min-width: 769px) {',
        '  .demo-open-form-mobile { display: none !important; }',
        '}'
      ].join('\n');
      document.head.appendChild(st);
    }

    // Build the popup
    var overlay = document.createElement('div');
    overlay.className = 'apf-form-popup';
    var inner = document.createElement('div');
    inner.className = 'apf-form-popup__inner';
    var close = document.createElement('button');
    close.className = 'apf-form-popup__close';
    close.setAttribute('aria-label', 'Zamknij');
    close.innerHTML = '&times;';
    var title = document.createElement('div');
    title.className = 'apf-form-popup__title';
    title.textContent = 'Poproś o spersonalizowaną ofertę';
    var sub = document.createElement('div');
    sub.className = 'apf-form-popup__sub';
    sub.textContent = 'Odpowiemy w ciągu jednego dnia roboczego.';

    inner.appendChild(title);
    inner.appendChild(sub);

    // Move the entire #hubspotForm into the popup body
    var formContainer = document.getElementById('hubspotForm');
    if (formContainer) inner.appendChild(formContainer);

    overlay.appendChild(close);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Create the "Open form" button in the left column where the form was
    var leftCol = demoGrid.firstElementChild;
    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'demo-open-form-mobile';
    openBtn.innerHTML = 'Zostaw kontakt &nbsp;→';
    leftCol.appendChild(openBtn);

    openBtn.addEventListener('click', function () {
      document.body.classList.add('apf-form-open');
    });
    close.addEventListener('click', function () {
      document.body.classList.remove('apf-form-open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.body.classList.remove('apf-form-open');
    });
  }
  // Run once now and again after delay (in case the form renders late)
  setupMobileFormPopup();
  setTimeout(setupMobileFormPopup, 1200);

  // ===== HubSpot form: inject our dark-theme overrides AFTER HubSpot loads =====
  // HubSpot ships its own CSS that wins over our linked stylesheet by source order.
  // We mount a <style> tag at the end of <body> *after* HubSpot renders the form,
  // so our rules load last and take precedence.
  function injectHubspotStyles() {
    if (document.getElementById('apf-hubspot-override')) return;
    var s = document.createElement('style');
    s.id = 'apf-hubspot-override';
    s.textContent = [
      '#hubspotForm, #hubspotForm form, #hubspotForm .hs-form { max-width:100% !important; width:100% !important; box-sizing:border-box !important; color:#FFFFFF !important; }',
      '#hubspotForm label, #hubspotForm .hs-form-field > label, #hubspotForm .hs-form-field label { color:#FFFFFF !important; font-weight:600 !important; font-size:14px !important; display:block !important; margin-bottom:6px !important; }',
      '#hubspotForm .hs-form-field { width:100% !important; margin-bottom:14px !important; }',
      '#hubspotForm .input { width:100% !important; margin:0 !important; }',
      '#hubspotForm input.hs-input, #hubspotForm textarea.hs-input, #hubspotForm select.hs-input, #hubspotForm .hs-input { width:100% !important; max-width:100% !important; box-sizing:border-box !important; color:#FFFFFF !important; background:rgba(255,255,255,0.05) !important; background-color:rgba(255,255,255,0.05) !important; border:1px solid rgba(255,255,255,0.15) !important; border-radius:10px !important; padding:12px 14px !important; font-size:15px !important; display:block !important; -webkit-appearance:none !important; appearance:none !important; -webkit-text-fill-color:#FFFFFF !important; color-scheme:dark !important; }',
      /* iOS Safari autofill — kill the yellow/white background */
      '#hubspotForm input:-webkit-autofill, #hubspotForm input:-webkit-autofill:hover, #hubspotForm input:-webkit-autofill:focus, #hubspotForm textarea:-webkit-autofill, #hubspotForm select:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #2A2627 inset !important; -webkit-text-fill-color:#FFFFFF !important; caret-color:#FFFFFF !important; }',
      /* Field wrappers — ensure transparent so dark theme shows through */
      '#hubspotForm .field, #hubspotForm .input, #hubspotForm .hs-form-field { background:transparent !important; background-color:transparent !important; }',
      '#hubspotForm input.hs-input:focus, #hubspotForm textarea.hs-input:focus, #hubspotForm select.hs-input:focus { border-color:rgba(111,227,157,0.6) !important; outline:none !important; box-shadow:0 0 0 3px rgba(111,227,157,0.15) !important; }',
      '#hubspotForm input.hs-input::placeholder, #hubspotForm textarea.hs-input::placeholder { color:rgba(255,255,255,0.45) !important; }',
      '#hubspotForm select.hs-input option { color:#111 !important; }',
      '#hubspotForm fieldset { max-width:100% !important; width:100% !important; border:0 !important; padding:0 !important; margin:0 !important; }',
      '#hubspotForm fieldset.form-columns-2 .hs-form-field, #hubspotForm fieldset.form-columns-3 .hs-form-field { width:100% !important; float:none !important; }',
      '#hubspotForm .hs-button, #hubspotForm input[type="submit"] { background:#6FE39D !important; color:#052821 !important; border:none !important; border-radius:999px !important; padding:13px 26px !important; font-weight:700 !important; font-size:15px !important; cursor:pointer !important; transition:background 0.2s, transform 0.15s !important; box-shadow:0 6px 20px rgba(111,227,157,0.25) !important; width:100% !important; max-width:100% !important; }',
      '#hubspotForm .hs-button:hover, #hubspotForm input[type="submit"]:hover { background:#8AEDB1 !important; transform:translateY(-1px) !important; }',
      '#hubspotForm .hs_submit, #hubspotForm .actions { width:100% !important; margin-top:8px !important; }',
      '#hubspotForm .hs-richtext, #hubspotForm .hs-richtext p, #hubspotForm legend, #hubspotForm .hs-field-desc, #hubspotForm .legal-consent-container { color:rgba(255,255,255,0.65) !important; font-size:13px !important; width:100% !important; max-width:100% !important; }',
      '#hubspotForm .hs-error-msg, #hubspotForm .hs-error-msgs label { color:#FF9B9B !important; }',
      '#hubspotForm input[type="checkbox"], #hubspotForm input[type="radio"] { width:auto !important; margin-right:6px !important; accent-color:#6FE39D; }'
    ].join('\n');
    document.body.appendChild(s);
  }
  // Run on load + observe DOM in case HubSpot renders async (it does)
  if (document.getElementById('hubspotForm')) {
    injectHubspotStyles();
    setTimeout(injectHubspotStyles, 500);
    setTimeout(injectHubspotStyles, 1500);
    setTimeout(injectHubspotStyles, 3000);
    var mo = new MutationObserver(function () {
      var f = document.querySelector('#hubspotForm form, #hubspotForm .hs-form');
      if (f) {
        injectHubspotStyles();
        // bump our <style> to the very end of body so it wins the cascade
        var s = document.getElementById('apf-hubspot-override');
        if (s && s.parentNode === document.body && s !== document.body.lastChild) {
          document.body.appendChild(s);
        }
      }
    });
    mo.observe(document.getElementById('hubspotForm'), { childList: true, subtree: true });
  }

  // ===== Integration swap — cycle logos every 2.4s =====
  var swapCard = document.querySelector('.iswap-card--cycle');
  if (swapCard) {
    var logos = swapCard.querySelectorAll('.iswap-logo');
    var caption = swapCard.querySelector('.iswap-caption');
    if (logos.length > 1) {
      var idx = 0;
      // Set initial caption
      if (caption && logos[0].dataset.name) caption.textContent = logos[0].dataset.name;
      setInterval(function () {
        logos[idx].classList.remove('is-active');
        idx = (idx + 1) % logos.length;
        logos[idx].classList.add('is-active');
        if (caption && logos[idx].dataset.name) {
          // Fade caption briefly during swap
          caption.style.opacity = '0';
          setTimeout(function () {
            caption.textContent = logos[idx].dataset.name;
            caption.style.opacity = '';
          }, 200);
        }
      }, 2400);
    }
  }

  // ===== Tilda cookie banner: hunt-and-style by content =====
  // The Tilda cookie banner sometimes uses non-standard classes that our CSS
  // can't catch. This finder locates ANY element containing the cookie text
  // and applies brand styling directly (inline + via a unique class).
  function styleCookieBanner() {
    if (document.querySelector('.apf-cookie-styled')) return true;

    // Find candidates: elements that contain Polish cookie-consent phrases
    // and are themselves the OUTER banner container (not a deeply-nested span).
    var phrase = 'plików cookie';
    var candidates = [];
    var allDivs = document.querySelectorAll('div, section, aside');
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      var t = d.textContent || '';
      if (t.indexOf(phrase) === -1) continue;
      // Reject if any child div also contains the phrase (we want the outermost banner)
      var hasChildWithPhrase = false;
      var childDivs = d.querySelectorAll('div, section, aside');
      for (var j = 0; j < childDivs.length; j++) {
        if ((childDivs[j].textContent || '').indexOf(phrase) !== -1) {
          // The phrase exists in a sub-element AND the sub-element is not just the leaf
          if (childDivs[j].querySelectorAll('div').length > 0) {
            hasChildWithPhrase = true;
            break;
          }
        }
      }
      if (hasChildWithPhrase) continue;
      // Reject body/html
      if (d.tagName === 'BODY' || d.tagName === 'HTML') continue;
      candidates.push(d);
    }
    if (candidates.length === 0) return false;

    // Walk UP from a leaf candidate to find the banner root (fixed/sticky/popup)
    var banner = candidates[0];
    var hop = banner;
    while (hop && hop !== document.body) {
      var cs = window.getComputedStyle(hop);
      if (cs.position === 'fixed' || cs.position === 'sticky' ||
          /cookie|popup|dialog|consent/i.test(hop.className || '') ||
          /cookie|popup|dialog|consent/i.test(hop.id || '')) {
        banner = hop;
        break;
      }
      hop = hop.parentElement;
    }
    // If still didn't find a fixed/sticky parent, try one level up to grab a wrapper
    if (banner === candidates[0] && banner.parentElement) {
      banner = banner.parentElement;
    }

    banner.classList.add('apf-cookie-styled');

    // Force fixed positioning at bottom + high z-index + dark theme
    banner.style.cssText += [
      'position: fixed !important',
      'left: 0 !important',
      'right: 0 !important',
      'bottom: 0 !important',
      'top: auto !important',
      'z-index: 99999 !important',
      'background: rgba(35, 31, 32, 0.96) !important',
      'background-color: rgba(35, 31, 32, 0.96) !important',
      'color: rgba(255, 255, 255, 0.85) !important',
      'border-top: 1px solid rgba(255, 255, 255, 0.10) !important',
      'border-radius: 16px 16px 0 0 !important',
      '-webkit-backdrop-filter: blur(12px)',
      'backdrop-filter: blur(12px)',
      'box-shadow: 0 -8px 32px rgba(0,0,0,0.45) !important',
      'padding: 18px 24px !important',
      'max-height: 50vh !important',
      'overflow-y: auto !important',
      'font-family: Inter, system-ui, sans-serif !important'
    ].join('; ') + ';';

    // Recolor inner text/links/buttons by walking children
    var walker = document.createTreeWalker(banner, NodeFilter.SHOW_ELEMENT, null);
    var node;
    while ((node = walker.nextNode())) {
      var tag = node.tagName;
      var classes = (node.className && node.className.baseVal !== undefined)
        ? node.className.baseVal : (node.className || '');
      var txt = (node.textContent || '').trim().toLowerCase();

      // Text nodes (p, span, div with text only)
      if (tag === 'P' || tag === 'SPAN' || tag === 'DIV' || tag === 'STRONG' || tag === 'B') {
        node.style.setProperty('color', 'rgba(255, 255, 255, 0.78)', 'important');
        node.style.setProperty('background', 'transparent', 'important');
        node.style.setProperty('background-color', 'transparent', 'important');
      }
      // Links — lime accent
      if (tag === 'A') {
        node.style.setProperty('color', '#6FE39D', 'important');
        node.style.setProperty('text-decoration', 'underline', 'important');
        node.style.setProperty('text-decoration-color', 'rgba(111,227,157,0.4)', 'important');
      }
      // Buttons — primary vs secondary by text content
      if (tag === 'BUTTON' || (tag === 'A' && /btn|button/i.test(classes))) {
        var isPrimary = /zaakceptuj|akceptuj|accept|zgadzam|wszystkie/.test(txt);
        var isDecline = /odrzuć|odrzuc|reject|decline|nie zgadzam/.test(txt);
        var isSettings = /ustawieni|settings|customize|preferenc/.test(txt);

        if (isPrimary) {
          node.style.cssText += [
            'background: #6FE39D !important',
            'background-color: #6FE39D !important',
            'color: #052821 !important',
            'border: none !important',
            'border-radius: 999px !important',
            'padding: 10px 22px !important',
            'font: 700 14px Inter, system-ui, sans-serif !important',
            'box-shadow: 0 0 0 1px rgba(111,227,157,0.30), 0 6px 22px rgba(111,227,157,0.35) !important',
            'cursor: pointer !important',
            'margin: 4px !important'
          ].join('; ') + ';';
        } else if (isDecline || isSettings) {
          node.style.cssText += [
            'background: transparent !important',
            'background-color: transparent !important',
            'color: rgba(255,255,255,0.85) !important',
            'border: 1px solid rgba(255,255,255,0.22) !important',
            'border-radius: 999px !important',
            'padding: 9px 20px !important',
            'font: 600 14px Inter, system-ui, sans-serif !important',
            'cursor: pointer !important',
            'margin: 4px !important'
          ].join('; ') + ';';
        }
      }
    }

    // Mobile: smaller padding
    if (window.innerWidth <= 768) {
      banner.style.setProperty('padding', '14px 16px', 'important');
      banner.style.setProperty('font-size', '13px', 'important');
    }

    return true;
  }

  // Try several times — Tilda may inject the banner async after the page renders
  styleCookieBanner();
  setTimeout(styleCookieBanner, 500);
  setTimeout(styleCookieBanner, 1500);
  setTimeout(styleCookieBanner, 3000);
  setTimeout(styleCookieBanner, 5000);

  // Also watch for late insertion (e.g. user scrolls down or banner re-mounts)
  var cookieMo = new MutationObserver(function () {
    if (!document.querySelector('.apf-cookie-styled')) styleCookieBanner();
  });
  cookieMo.observe(document.body, { childList: true, subtree: true });
})();
