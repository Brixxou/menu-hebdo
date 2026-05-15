import { initTabs } from './js/ui/tabs.js';
import { createState } from './js/state.js';
import { loadData } from './js/data.js';
import { renderSemaine } from './js/views/semaine.js';
import { openRecipeModal } from './js/views/recipe-modal.js';
import { openWizard } from './js/views/wizard.js';
import { openSwapModal } from './js/views/swap-modal.js';
import { renderCourses } from './js/views/courses.js';
import { renderRecettes } from './js/views/recettes.js';
import { enterShoppingMode, exitShoppingMode } from './js/ui/shopping-mode.js';
import { shareShoppingList } from './js/ui/share.js';
import { buildShoppingList } from './js/shopping.js';
import { openHistory } from './js/views/history.js';

const state = createState();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW failed:', err));
}

let _dataCache;
async function main() {
  _dataCache = await loadData();
  initTabs();
  rerender();
}

function openRecipeFor(day, slot, recipeId) {
  const recipe = _dataCache.recipesById[recipeId];
  const cur = state.load();
  const meal = cur.activeWeek.days.find(x => x.day === day)[slot];
  const peopleEffective = meal.peopleOverride ?? cur.activeWeek.peopleGlobal;
  openRecipeModal({
    recipe,
    meal,
    seasonality: _dataCache.seasonality,
    peopleEffective,
    isFavorite: cur.preferences.favorites.includes(recipeId),
    isCooked: !!meal.cooked,
    note: cur.activeWeek.notes?.[recipeId],
    callbacks: {
      onToggleFavorite: () => {
        state.mutate(d => {
          const i = d.preferences.favorites.indexOf(recipeId);
          if (i >= 0) d.preferences.favorites.splice(i, 1);
          else d.preferences.favorites.push(recipeId);
        });
        rerender();
        openRecipeFor(day, slot, recipeId);
      },
      onToggleCooked: () => {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          dayObj[slot].cooked = !dayObj[slot].cooked;
        });
        rerender();
        openRecipeFor(day, slot, recipeId);
      },
      onPeopleOverride: (n) => {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          dayObj[slot].peopleOverride = n;
        });
        rerender();
        openRecipeFor(day, slot, recipeId);
      },
      onNoteChange: (text) => {
        state.mutate(d => {
          if (!d.activeWeek.notes) d.activeWeek.notes = {};
          d.activeWeek.notes[recipeId] = text;
        });
      },
      onSubstitute: (origName, newName) => {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          const m = dayObj[slot];
          m.substitutes = m.substitutes ?? {};
          m.substitutes[origName] = newName;
        });
        rerender();
        openRecipeFor(day, slot, recipeId);
      }
    }
  });
}

function openRecipeStandalone(recipeId) {
  const s = state.load();
  const recipe = _dataCache.recipesById[recipeId];
  openRecipeModal({
    recipe,
    seasonality: _dataCache.seasonality,
    peopleEffective: s.preferences.defaultPeople,
    isFavorite: s.preferences.favorites.includes(recipeId),
    isCooked: false,
    note: undefined,
    callbacks: {
      onToggleFavorite: () => {
        state.mutate(d => {
          const i = d.preferences.favorites.indexOf(recipeId);
          if (i >= 0) d.preferences.favorites.splice(i, 1);
          else d.preferences.favorites.push(recipeId);
        });
        rerender();
        openRecipeStandalone(recipeId);
      },
      onPeopleOverride: () => {},
      onNoteChange: () => {},
      onToggleCooked: () => {},
      onSubstitute: () => {}
    }
  });
}

function rerender() {
  const s = state.load();
  const callbacks = {
    onStartWeek: () => {
      const cur = state.load();
      openWizard({
        data: _dataCache,
        currentDefaults: {
          peopleGlobal: cur.activeWeek?.peopleGlobal ?? cur.preferences.defaultPeople,
          aisleOrder: cur.preferences.aisleOrder
        },
        callbacks: {
          onPickRecipeForSlot: (day, slot, draft, done) => {
            const currentId = draft.days.find(d => d.day === day)[slot]?.recipeId;
            const menu = draft.menuId ? _dataCache.menusById[draft.menuId] : null;
            openSwapModal({
              data: _dataCache,
              slot,
              currentRecipeId: currentId,
              defaultConstraints: menu?.defaultConstraints,
              favorites: state.load().preferences.favorites,
              onPick: (newId) => done(newId)
            });
          },
          onValidate: (draft) => {
            state.archiveAndStart(draft);
            rerender();
          }
        }
      });
    },
    onOpenHistory: () => {
      const s = state.load();
      openHistory({
        history: s.history,
        data: _dataCache,
        onRestart: (idx) => {
          const week = JSON.parse(JSON.stringify(s.history[idx]));
          week.startedAt = new Date().toISOString().slice(0, 10);
          // reset cooked + checked for the restored week
          week.days.forEach(d => {
            if (d.lunch) d.lunch.cooked = false;
            if (d.dinner) d.dinner.cooked = false;
          });
          state.archiveAndStart(week);
          rerender();
        }
      });
    },
    onChangePeople: (n) => {
      state.mutate(d => { if (d.activeWeek) d.activeWeek.peopleGlobal = n; });
      rerender();
    },
    onOpenRecipe: (day, slot, recipeId) => openRecipeFor(day, slot, recipeId),
    onOpenRecipeStandalone: (recipeId) => openRecipeStandalone(recipeId),
    onMealAction: (day, slot) => {
      const action = prompt('Action : "cooked" / "swap" / annuler');
      if (action === 'cooked') {
        state.mutate(d => {
          const dayObj = d.activeWeek.days.find(x => x.day === day);
          if (dayObj && dayObj[slot]) dayObj[slot].cooked = !dayObj[slot].cooked;
        });
        rerender();
      } else if (action === 'swap') {
        const cur = state.load();
        const meal = cur.activeWeek.days.find(x => x.day === day)[slot];
        const menu = cur.activeWeek.menuId ? _dataCache.menusById[cur.activeWeek.menuId] : null;
        openSwapModal({
          data: _dataCache,
          slot,
          currentRecipeId: meal?.recipeId,
          defaultConstraints: menu?.defaultConstraints,
          favorites: cur.preferences.favorites,
          onPick: (newId) => {
            state.mutate(d => {
              const dayObj = d.activeWeek.days.find(x => x.day === day);
              dayObj[slot] = { recipeId: newId, peopleOverride: null, cooked: false };
            });
            rerender();
          }
        });
      }
    },
    onChangePeopleForMeal: (day, slot, n) => {
      state.mutate(d => {
        const dayObj = d.activeWeek.days.find(x => x.day === day);
        if (dayObj && dayObj[slot]) dayObj[slot].peopleOverride = n;
      });
      rerender();
    },
    onToggleChecked: (k) => {
      state.mutate(d => { d.shoppingList.checked[k] = !d.shoppingList.checked[k]; });
      rerender();
    },
    onMarkInStock: (k) => {
      state.mutate(d => { d.shoppingList.inStock[k] = true; });
      rerender();
    },
    onUncheckAll: () => {
      state.mutate(d => { d.shoppingList.checked = {}; });
      rerender();
    },
    onShare: async () => {
      const s = state.load();
      if (!s.activeWeek) return;
      const list = buildShoppingList(s.activeWeek, _dataCache.recipesById, s.preferences.aisleOrder);
      const result = await shareShoppingList(list, s);
      if (result === 'copied') alert('Liste copiée dans le presse-papier');
    },
    onShoppingMode: () => {
      enterShoppingMode();
      let exitBtn = document.querySelector('.shopping-exit');
      if (!exitBtn) {
        exitBtn = document.createElement('button');
        exitBtn.className = 'shopping-exit';
        exitBtn.textContent = 'Sortir';
        exitBtn.addEventListener('click', () => { exitShoppingMode(); exitBtn.remove(); });
        document.body.appendChild(exitBtn);
      }
    },
    onReorderAisles: (movedCat, targetCat) => {
      state.mutate(d => {
        const order = d.preferences.aisleOrder.slice();
        const fromIdx = order.indexOf(movedCat);
        const toIdx = order.indexOf(targetCat);
        order.splice(fromIdx, 1);
        order.splice(toIdx, 0, movedCat);
        d.preferences.aisleOrder = order;
      });
      rerender();
    },
    onMoveAisle: (cat, dir) => {
      state.mutate(d => {
        const order = d.preferences.aisleOrder.slice();
        const i = order.indexOf(cat);
        const j = i + dir;
        if (j < 0 || j >= order.length) return;
        [order[i], order[j]] = [order[j], order[i]];
        d.preferences.aisleOrder = order;
      });
      rerender();
    }
  };
  renderSemaine(document.getElementById('view-semaine'), { state: s, data: _dataCache, callbacks });
  renderCourses(document.getElementById('view-courses'), { state: s, data: _dataCache, callbacks });
  renderRecettes(document.getElementById('view-recettes'), { state: s, data: _dataCache, callbacks });
}

document.addEventListener('DOMContentLoaded', main);
