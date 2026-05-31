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
})();
