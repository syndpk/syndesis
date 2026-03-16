/**
 * SYNDESIS Static Site — main.js
 * Handles: mobile nav, project filters/tabs, project-details loader,
 *          contact-form feedback, active nav highlighting.
 */

/* =====================================================================
   SHARED: Mobile navigation toggle
   ===================================================================== */
(function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-mobile');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close drawer when a link inside it is clicked
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();


/* =====================================================================
   SHARED: Mark active nav link based on current page
   ===================================================================== */
(function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (
      href === page ||
      (page === 'index.html' && href === 'index.html') ||
      (page === '' && href === 'index.html')
    ) {
      a.classList.add('active');
    }
  });
})();


/* =====================================================================
   PROJECTS PAGE: Tabs + Filters + Card rendering
   ===================================================================== */
(function initProjectsPage() {
  const grid   = document.getElementById('projects-grid');
  const count  = document.getElementById('projects-count');
  if (!grid) return; // not on projects page

  let projectsData = [];
  let activeTab    = 'Ongoing';
  let activeFilters = [];

  // ---------- SVG icons (inline, no external dep) ----------
  const arrowRight = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/></svg>`;

  // ---------- Render ----------
  function renderCards() {
    const filtered = projectsData.filter(p => {
      const tabMatch = p.status === activeTab;
      const filterMatch = activeFilters.length === 0 ||
        activeFilters.some(f => p.tags.includes(f));
      return tabMatch && filterMatch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">No projects found matching your filters.</div>';
      if (count) count.textContent = '';
      return;
    }

    if (count) {
      const label = activeTab === 'Ongoing' ? 'ongoing' : 'completed';
      count.textContent = `Showing ${filtered.length} ${label} project${filtered.length !== 1 ? 's' : ''}`;
    }

    grid.innerHTML = filtered.map(p => {
      const statusClass = p.status === 'Ongoing' ? 'badge-ongoing' : 'badge-completed';
      const tagChips = p.tags.map(t => `<span class="tag-chip">${t}</span>`).join('');
      return `
        <article class="project-card">
          <div class="project-card-logo">${p.logo}</div>
          <h3>${p.title}</h3>
          <p class="project-card-summary">${p.summary}</p>
          <div class="project-card-tags">${tagChips}</div>
          <a href="project-details.html?id=${p.id}" class="project-card-cta">
            View Project ${arrowRight}
          </a>
        </article>`;
    }).join('');
  }

  // ---------- Tabs ----------
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderCards();
    });
  });

  // ---------- Filter chips ----------
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.filter;
      if (activeFilters.includes(val)) {
        activeFilters = activeFilters.filter(f => f !== val);
        btn.classList.remove('active');
      } else {
        activeFilters.push(val);
        btn.classList.add('active');
      }
      updateClearBtn();
      renderCards();
    });
  });

  // ---------- Clear ----------
  const clearBtn = document.getElementById('filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      activeFilters = [];
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      updateClearBtn();
      renderCards();
    });
  }

  function updateClearBtn() {
    if (clearBtn) {
      clearBtn.style.display = activeFilters.length > 0 ? '' : 'none';
    }
  }

  // ---------- Load data ----------
  // Inline data (projects-data.js) works under file:// without CORS issues.
  // Fall back to fetch() when running on a server.
  if (window.__PROJECTS__) {
    projectsData = window.__PROJECTS__;
    renderCards();
  } else {
    fetch('assets/projects.json')
      .then(r => r.json())
      .then(data => {
        projectsData = data.projects;
        renderCards();
      })
      .catch(() => {
        grid.innerHTML = '<div class="no-results">Could not load project data.</div>';
      });
  }
})();


/* =====================================================================
   PROJECT DETAILS PAGE: Load project from JSON by ?id= query param
   ===================================================================== */
(function initProjectDetails() {
  const root = document.getElementById('project-detail-root');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'secant';

  // SVGs
  const icons = {
    arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 5 5 12 12 19"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/></svg>`,
    externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/></svg>`
  };

  function renderProject(p) {
    // Update page title
    document.title = `${p.title} | SYNDESIS`;

    // Build hero
    const heroEl = document.getElementById('project-hero');
    if (heroEl) {
      heroEl.innerHTML = `
        <div class="hero-blobs"><div class="hero-blob-1"></div><div class="hero-blob-2"></div></div>
        <div class="container">
          <div class="hero-inner">
            <a href="projects.html" class="hero-back">${icons.arrowLeft} Back to Projects</a>
            <div class="project-hero-layout">
              <div class="project-hero-logo">${p.logo}</div>
              <div style="flex-grow:1">
                <h1>${p.title}</h1>
                <p class="hero-subtitle">${p.subtitle}</p>
                <div class="project-hero-meta">
                  <div class="project-hero-meta-item">
                    ${icons.calendar}
                    <div>
                      <div class="project-hero-meta-label">Duration</div>
                      <div class="project-hero-meta-value">${p.duration}</div>
                    </div>
                  </div>
                  <div class="project-hero-meta-item">
                    ${icons.award}
                    <div>
                      <div class="project-hero-meta-label">Funding</div>
                      <div class="project-hero-meta-value">${p.funding}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }

    // Build body sections
    root.innerHTML = `
      <!-- Challenge -->
      <section class="project-detail-section section-bg-white">
        <div class="container">
          <div class="project-detail-max">
            <h2>Project Overview</h2>
            <p>${p.challenge}</p>
          </div>
        </div>
      </section>

      <!-- Approach -->
      <section class="project-detail-section section-bg-gray">
        <div class="container">
          <div class="project-detail-max">
            <h2>Project Center</h2>
            <p>${p.approach}</p>
          </div>
        </div>
      </section>

      <!-- Results -->
      <section class="project-detail-section section-bg-white">
        <div class="container">
          <div class="project-detail-max">
            <h2>Syndesis Contibution</h2>
            <ul class="results-list">
              ${p.results.map(r => `
                <li class="result-item">
                  ${icons.check}
                  <span>${r}</span>
                </li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

      <!-- Technologies -->
      <section class="project-detail-section section-bg-gray">
        <div class="container">
          <div class="project-detail-max">
            <h2>Key Themes & Technologies</h2>
            <div class="tech-tags">
              ${p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Partners -->
      <section class="project-detail-section section-bg-white">
        <div class="container">
          <div class="project-detail-max">
            <h2>Metadata</h2>
            <div class="partners-grid">
              ${p.partners.map(partner => `
                <div class="partner-card">
                  ${icons.users}
                  <span>${partner}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </section>

      ${p.publications && p.publications.length > 0 ? `
      <!-- Publications -->
      <section class="project-detail-section section-bg-gray">
        <div class="container">
          <div class="project-detail-max">
            <h2>Publications</h2>
            <div class="publications-list">
              ${p.publications.map(pub => `
                <div class="pub-card">
                  <div class="pub-card-inner">
                    <div class="pub-left">
                      ${icons.file}
                      <div>
                        <div class="pub-title">${pub.title}</div>
                        <div class="pub-venue">${pub.venue}</div>
                      </div>
                    </div>
                    <a href="${pub.link}" class="pub-ext" aria-label="External link">${icons.externalLink}</a>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </section>` : ''}

      <!-- CTA -->
      <section class="section section-bg-dark">
        <div class="container section-cta-dark">
          <h2>Interested in this work?</h2>
          <p>Contact us to learn more about ${p.title} or discuss how our expertise can support your projects.</p>
          <a href="contact.html" class="btn btn-primary">
            Contact us about this work ${icons.arrowRight}
          </a>
        </div>
      </section>`;
  }

  function showNotFound(requestedId) {
    document.title = 'Project Not Found | SYNDESIS';
    const heroEl = document.getElementById('project-hero');
    if (heroEl) heroEl.innerHTML = '';
    root.innerHTML = `
      <section class="section section-bg-white">
        <div class="container" style="text-align:center;padding:5rem 0">
          <h2 style="font-size:2rem;color:var(--gray-900);margin-bottom:1rem">Project not found</h2>
          <p style="color:var(--gray-600);margin-bottom:2rem">No project with ID "<strong>${requestedId}</strong>" exists.</p>
          <a href="projects.html" class="btn btn-primary">Back to Projects</a>
        </div>
      </section>`;
  }

  // Inline data first (file:// safe), then fetch fallback
  if (window.__PROJECTS__) {
    const project = window.__PROJECTS__.find(p => p.id === id);
    if (project) { renderProject(project); } else { showNotFound(id); }
  } else {
    fetch('assets/projects.json')
      .then(r => r.json())
      .then(data => {
        const project = data.projects.find(p => p.id === id);
        if (project) { renderProject(project); } else { showNotFound(id); }
      })
      .catch(() => { showNotFound(id); });
  }
})();


/* =====================================================================
   CONTACT FORM: Client-side validation + success message
   ===================================================================== */
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    

    // Simple field validation feedback
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = '#dc2626';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) return;

    // Show success message (replace form)
    const wrapper = form.parentElement;
    wrapper.innerHTML = `
      <div style="text-align:center;padding:3rem 0">
        <div style="width:4rem;height:4rem;background:var(--teal-50);border-radius:50%;
          display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal-600)" stroke-width="2"
            style="width:2rem;height:2rem" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-size:1.5rem;color:var(--gray-900);margin-bottom:0.75rem">Message sent!</h3>
        <p style="color:var(--gray-600)">Thank you for reaching out. We'll get back to you shortly.</p>
      </div>`;
  });
})();
