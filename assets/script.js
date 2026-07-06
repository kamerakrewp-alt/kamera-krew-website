/* Kamera Krew — v2 shared behavior */
document.addEventListener('DOMContentLoaded', function () {

  /* Sticky header shrink + shadow */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* Scroll-reveal animation */
  var revealTargets = document.querySelectorAll('.section > .wrap, .page-hero .wrap, .marquee, .links-page > *');
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* Lazy-load fade-in for tagged images (native loading="lazy" handles the network side) */
  document.querySelectorAll('img.lazy').forEach(function (img) {
    function markLoaded() { img.classList.add('loaded'); }
    if (img.complete && img.naturalWidth > 0) markLoaded();
    else img.addEventListener('load', markLoaded);
  });

  /* Gallery view icon + lightbox wiring */
  var viewIconSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var galleryPhs = Array.prototype.slice.call(document.querySelectorAll('.grid .ph, .masonry .ph, .category-grid .ph'));
  galleryPhs.forEach(function (ph) {
    if (ph.closest('.category-card')) return; // category cards link to pages, not lightbox
    if (!ph.querySelector('.view-icon')) {
      var icon = document.createElement('span');
      icon.className = 'view-icon';
      icon.innerHTML = viewIconSVG;
      ph.appendChild(icon);
    }
  });

  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = document.getElementById('lb-img');
    var lbCount = document.getElementById('lb-count');
    var currentGroup = [];
    var currentIndex = 0;

    function renderAt(i) {
      currentIndex = (i + currentGroup.length) % currentGroup.length;
      var img = currentGroup[currentIndex].querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      if (lbCount) lbCount.textContent = (currentIndex + 1) + ' / ' + currentGroup.length;
    }
    function openLightbox(group, index) {
      currentGroup = group;
      renderAt(index);
      lightbox.classList.add('open');
    }
    function closeLightbox() { lightbox.classList.remove('open'); }

    var lightboxable = Array.prototype.slice.call(document.querySelectorAll('.grid .ph, .masonry .ph')).filter(function (p) {
      return !p.closest('.category-card');
    });
    lightboxable.forEach(function (ph) {
      ph.addEventListener('click', function () {
        var img = ph.querySelector('img');
        if (img.style.display === 'none') return;
        var scope = ph.closest('.tab-panel') || ph.closest('.masonry') || ph.closest('.grid').parentElement;
        var group = Array.prototype.slice.call(scope.querySelectorAll('.grid .ph, .masonry .ph')).filter(function (p) {
          var i = p.querySelector('img');
          return i && i.style.display !== 'none';
        });
        var index = group.indexOf(ph);
        openLightbox(group, index < 0 ? 0 : index);
      });
    });

    var lbClose = document.getElementById('lb-close');
    var lbPrev = document.getElementById('lb-prev');
    var lbNext = document.getElementById('lb-next');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { renderAt(currentIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', function () { renderAt(currentIndex + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') renderAt(currentIndex - 1);
      if (e.key === 'ArrowRight') renderAt(currentIndex + 1);
    });

    /* basic swipe support for touch devices */
    var touchStartX = null;
    lightbox.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx > 0 ? renderAt(currentIndex - 1) : renderAt(currentIndex + 1); }
      touchStartX = null;
    }, { passive: true });
  }

  /* Filter tabs (category filter within a gallery page: Photos / Videos / All) */
  document.querySelectorAll('.filter-tabs').forEach(function (tabGroup) {
    var btns = tabGroup.querySelectorAll('.tab-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        var target = document.querySelector(tabGroup.getAttribute('data-target'));
        if (!target) return;
        target.querySelectorAll('[data-type]').forEach(function (item) {
          var show = (filter === 'all') || (item.getAttribute('data-type') === filter);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* Portfolio tabs (multi-category single-page tab system, used on portfolio.html gallery previews) */
  var tabBtns = document.querySelectorAll('.tabs .tab-btn[data-tab]');
  function activateTab(target) {
    var btn = document.querySelector('.tab-btn[data-tab="' + target + '"]');
    var panel = document.getElementById(target);
    if (!btn || !panel) return false;
    document.querySelectorAll('.tab-btn[data-tab]').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    btn.classList.add('active');
    panel.classList.add('active');
    return true;
  }
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { activateTab(btn.getAttribute('data-tab')); });
    });
    if (window.location.hash) activateTab(window.location.hash.replace('#', ''));
  }

  /* Infinite-scroll style progressive reveal for large masonry galleries */
  document.querySelectorAll('.masonry[data-batch]').forEach(function (masonry) {
    var batchSize = parseInt(masonry.getAttribute('data-batch'), 10) || 12;
    var items = Array.prototype.slice.call(masonry.children);
    items.forEach(function (item, i) { if (i >= batchSize) item.style.display = 'none'; });
    if (items.length <= batchSize) return;
    var sentinel = document.createElement('div');
    sentinel.className = 'infinite-sentinel';
    sentinel.style.cssText = 'height:1px';
    masonry.parentElement.appendChild(sentinel);
    var shown = batchSize;
    var sentinelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && shown < items.length) {
          for (var i = shown; i < Math.min(shown + batchSize, items.length); i++) {
            items[i].style.display = '';
          }
          shown += batchSize;
          if (shown >= items.length) sentinelObserver.disconnect();
        }
      });
    }, { rootMargin: '400px' });
    sentinelObserver.observe(sentinel);
  });

  /* Contact form -> mailto fallback (static site, no backend) */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value;
      var phone = form.phone ? form.phone.value : '';
      var email = form.email ? form.email.value : '';
      var eventType = form.eventType ? form.eventType.value : '';
      var eventDate = form.eventDate ? form.eventDate.value : '';
      var location = form.location ? form.location.value : '';
      var msg = form.message.value;
      var lines = [
        'Name: ' + name,
        phone ? 'Phone: ' + phone : '',
        email ? 'Email: ' + email : '',
        eventType ? 'Event Type: ' + eventType : '',
        eventDate ? 'Event Date: ' + eventDate : '',
        location ? 'Location: ' + location : '',
        '', msg
      ].filter(Boolean).join('\n');
      var body = encodeURIComponent(lines);
      window.location.href = 'mailto:Kamerakrewp@gmail.com?subject=' + encodeURIComponent('Booking Inquiry — ' + name) + '&body=' + body;
    });
  }
});
