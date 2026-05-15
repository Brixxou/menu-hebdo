import { initTabs } from './js/ui/tabs.js';
import { createState } from './js/state.js';
import { loadData } from './js/data.js';
import { renderSemaine } from './js/views/semaine.js';
import { openRecipeModal } from './js/views/recipe-modal.js';
import { openWizard } from './js/views/wizard.js';
import { openSwapModal } from './js/views/swap-modal.js';
import { renderCourses } from './js/views/courses.js';

const state = createState();

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
      }
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
    onChangePeople: (n) => {
      state.mutate(d => { if (d.activeWeek) d.activeWeek.peopleGlobal = n; });
      rerender();
    },
    onOpenRecipe: (day, slot, recipeId) => openRecipeFor(day, slot, recipeId),
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
    onShare: () => console.log('TODO: share'),
    onShoppingMode: () => console.log('TODO: shopping mode')
  };
  renderSemaine(document.getElementById('view-semaine'), { state: s, data: _dataCache, callbacks });
  renderCourses(document.getElementById('view-courses'), { state: s, data: _dataCache, callbacks });
}

document.addEventListener('DOMContentLoaded', main);
