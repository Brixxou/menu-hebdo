import { initTabs } from './js/ui/tabs.js';
import { createState } from './js/state.js';
import { loadData } from './js/data.js';
import { renderSemaine } from './js/views/semaine.js';
import { openRecipeModal } from './js/views/recipe-modal.js';

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
    onStartWeek: () => console.log('TODO: wizard'),
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
        console.log('TODO: open swap modal', day, slot);
      }
    },
    onChangePeopleForMeal: (day, slot, n) => {
      state.mutate(d => {
        const dayObj = d.activeWeek.days.find(x => x.day === day);
        if (dayObj && dayObj[slot]) dayObj[slot].peopleOverride = n;
      });
      rerender();
    }
  };
  renderSemaine(document.getElementById('view-semaine'), { state: s, data: _dataCache, callbacks });
}

document.addEventListener('DOMContentLoaded', main);
