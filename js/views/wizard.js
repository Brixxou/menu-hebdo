// js/views/wizard.js — wizard 3 étapes pour démarrer une nouvelle semaine

export function openWizard({ data, currentDefaults, callbacks }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'wizard-overlay';

  let step = 1;
  let selectedMenuId = null;
  let hasChoice = false;
  let draft = null;     // { startedAt, menuId, days, peopleGlobal, notes }

  function render() {
    overlay.innerHTML = `
      <div class="wizard">
        <header class="wizard-head">
          <button class="wizard-back" aria-label="Retour">${step > 1 ? '←' : '✕'}</button>
          <div class="wizard-progress">${step} / 3</div>
        </header>
        <div class="wizard-body" id="wizard-body"></div>
        <footer class="wizard-foot">
          ${step < 3
            ? `<button class="btn-primary" id="wizard-next" ${step === 1 && !hasChoice ? 'disabled' : ''}>Continuer</button>`
            : `<button class="btn-primary" id="wizard-validate">C'est parti</button>`}
        </footer>
      </div>
    `;
    overlay.querySelector('.wizard-back').addEventListener('click', () => {
      if (step === 1) close();
      else { step--; render(); }
    });
    const next = overlay.querySelector('#wizard-next');
    if (next) next.addEventListener('click', () => { advance(); render(); });
    const validate = overlay.querySelector('#wizard-validate');
    if (validate) validate.addEventListener('click', () => {
      callbacks.onValidate(draft);
      close();
    });
    renderStep();
  }

  function renderStep() {
    const body = overlay.querySelector('#wizard-body');
    if (step === 1) renderStep1(body);
    if (step === 2) renderStep2(body);
    if (step === 3) renderStep3(body);
  }

  function renderStep1(body) {
    body.innerHTML = `
      <h2 class="wizard-title">Choisis ton menu</h2>
      <div class="menu-grid">
        ${data.menus.map(m => `
          <button class="menu-card ${selectedMenuId === m.id ? 'selected' : ''}" data-menu="${m.id}">
            <h3>${escapeHtml(m.name)}</h3>
            <p>${escapeHtml(m.theme)}</p>
          </button>
        `).join('')}
        <button class="menu-card menu-card-special" data-menu="random">🎲<br>Surprends-moi</button>
        <button class="menu-card menu-card-special" data-menu="libre">🧑‍🍳<br>Composer librement</button>
      </div>
    `;
    body.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.menu;
        if (id === 'random') {
          selectedMenuId = data.menus[Math.floor(Math.random() * data.menus.length)].id;
        } else if (id === 'libre') {
          selectedMenuId = null; // signifie composition libre
        } else {
          selectedMenuId = id;
        }
        hasChoice = true;
        render();
      });
    });
  }

  function renderStep2(body) {
    body.innerHTML = `
      <h2 class="wizard-title">Personnalise</h2>
      <p class="wizard-help">Tape sur une recette pour la remplacer.</p>
      <div class="day-list">
        ${draft.days.map((day, i) => `
          <article class="day-card">
            <h3>${day.day}</h3>
            ${['lunch','dinner'].map(slot => {
              const meal = day[slot];
              const recipe = meal?.recipeId ? data.recipesById[meal.recipeId] : null;
              return `
                <div class="meal" data-day="${day.day}" data-slot="${slot}">
                  <div class="meal-label">${slot === 'lunch' ? 'Midi' : 'Soir'}</div>
                  <div class="meal-title">${recipe ? escapeHtml(recipe.title) : '— (tape pour ajouter)'}</div>
                </div>
              `;
            }).join('')}
          </article>
        `).join('')}
      </div>
    `;
    body.querySelectorAll('.meal').forEach(el => {
      el.addEventListener('click', () => {
        callbacks.onPickRecipeForSlot(el.dataset.day, el.dataset.slot, draft, (newRecipeId) => {
          const dayObj = draft.days.find(d => d.day === el.dataset.day);
          if (newRecipeId) dayObj[el.dataset.slot] = { recipeId: newRecipeId, peopleOverride: null, cooked: false };
          else dayObj[el.dataset.slot] = null;
          render();
        });
      });
    });
  }

  function renderStep3(body) {
    const totalRecipes = draft.days.reduce((sum, d) => sum + (d.lunch?1:0) + (d.dinner?1:0), 0);
    const totalTime = draft.days.reduce((sum, d) => {
      for (const slot of ['lunch','dinner']) {
        if (d[slot]?.recipeId) sum += data.recipesById[d[slot].recipeId]?.timeMin ?? 0;
      }
      return sum;
    }, 0);
    body.innerHTML = `
      <h2 class="wizard-title">Récap</h2>
      <div class="wizard-stats">
        <div><span class="big">${totalRecipes}</span><br>recettes</div>
        <div><span class="big">${draft.peopleGlobal}</span><br>personnes</div>
        <div><span class="big">${totalTime}</span><br>min de cuisine</div>
      </div>
      <p class="wizard-help">Une fois validée, l'ancienne semaine sera archivée et la liste de courses sera générée.</p>
    `;
  }

  function advance() {
    if (step === 1) {
      // construit le draft à partir du menu choisi (ou libre)
      const menu = selectedMenuId ? data.menusById[selectedMenuId] : null;
      const today = new Date().toISOString().slice(0, 10);
      draft = {
        startedAt: today,
        menuId: selectedMenuId,
        peopleGlobal: currentDefaults.peopleGlobal,
        notes: {},
        days: menu
          ? menu.days.map(d => ({
              day: d.day,
              lunch: d.lunch ? { recipeId: d.lunch, peopleOverride: null, cooked: false } : null,
              dinner: d.dinner ? { recipeId: d.dinner, peopleOverride: null, cooked: false } : null
            }))
          : ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(day => ({ day, lunch: null, dinner: null }))
      };
      step = 2;
    } else if (step === 2) {
      step = 3;
    }
  }

  function close() { root.innerHTML = ''; }

  root.appendChild(overlay);
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
