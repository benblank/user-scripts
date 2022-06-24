// ==UserScript==
// @name        Feedly unread count in title
// @namespace   https://userscripts.five35.com/
// @version     1.0
// @author      Ben "535" Blank
// @description Adds the number of unread items to the Feedly window title.
// @license     BSD-3-Clause
// @match       https://*.feedly.com/*
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// ==/UserScript==

/* globals GM_config */

const ALL_TITLE = 'All';
const CURRENT_ROW_SELECTOR = '.LeftnavListRow--selected';
const FEED_LIST_SELECTOR = '.LeftnavList__feed-list';
const MS_PER_MINUTE = 60 * 1000;
const ROOT_ID = 'root';
const ROW_COUNT_SELECTOR = '.LeftnavListRow__count';
const ROW_SELECTOR = '.LeftnavListRow';
const TITLE_UNREAD_COUNT_PATTERN = / \(\*?\d+\)$/;

GM_registerMenuCommand('Configure unread count in title', () => GM_config.open());

function formatCurrentValue(value, unitLabels) {
  if (!unitLabels) {
    return String(value);
  }

  if (Array.isArray(unitLabels)) {
    return `${value}${unitLabels[value === 1 ? 0 : 1]}`;
  }

  return `${value}${unitLabels}`;
}

function getFeedId(feedList, countAll) {
  // If we're counting everything, return the ID for the "All" category.
  if (countAll) {
    return `user/${getSessionValue('feedlyId')}/category/global.all`;
  }

  const selected = feedList.querySelector(CURRENT_ROW_SELECTOR);

  // The "All" category, which is identified by its title, doesn't store its ID
  // in the DOM.
  if (selected.title === ALL_TITLE) {
    return `user/${getSessionValue('feedlyId')}/category/global.all`;
  }

  // Other categories' IDs can be most easily obtained from their great-
  // grandparents' "id" attributes.
  const ggParentId = selected.parentNode.parentNode.parentNode.getAttribute('id');

  if (ggParentId) {
    return ggParentId;
  }

  // Individual feeds have their feed ID stored in the selected element's
  // parent's draggable data.
  const draggableId = selected.parentNode.dataset.rbdDraggableId;

  if (draggableId) {
    return JSON.parse(draggableId).feedId;
  }

  // Implicitly return undefined if no category ID could be found.
}

function getSessionValue(key) {
  return JSON.parse(localStorage.getItem('feedly.session'))[key];
}

function getUnreadCountFromFeedList(feedList, countAll) {
  if (countAll) {
    return feedList.querySelector(`${ROW_SELECTOR}[title=${ALL_TITLE}] ${ROW_COUNT_SELECTOR}`)?.textContent;
  }

  return feedList.querySelector(`${CURRENT_ROW_SELECTOR} ${ROW_COUNT_SELECTOR}`)?.textContent;
}

function getUnreadCountFromResponse(response, categoryId) {
  for (const item of response.unreadcounts) {
    if (item.id === categoryId) {
      return item.count;
    }
  }

  // Implicitly return undefined if no matching category could be found.
}

function observeSelector(root, selector) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        switch (mutation.type) {
          case 'attributes':
            if (mutation.target.matches(selector)) {
              observer.disconnect();

              resolve(mutation.target);

              return;
            }

            break;

          case 'childList':
            for (const child of mutation.addedNodes) {
              if (child.matches?.(selector)) {
                observer.disconnect();

                resolve(child);

                return;
              }
            }

            break;
        }
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class', 'id'], childList: true, subtree: true });
  });
}

function setTitleCount(unreadCount, countAll) {
  const existingTitleBase = document.title.replace(TITLE_UNREAD_COUNT_PATTERN, '');

  if (!unreadCount) {
    // Count was zero, missing, or empty, all of which indicate no unread items.
    document.title = existingTitleBase;
  } else {
    document.title = `${existingTitleBase} (${countAll ? '*' : ''}${unreadCount})`;
  }
}

observeSelector(document.getElementById(ROOT_ID), FEED_LIST_SELECTOR).then((feedList) => {
  // The observer callback wraps onChange in an arrow function to prevent
  // argument leaking; that function's behavior changes when an argument is
  // provided.
  const observer = new MutationObserver(() => onChange());
  let timeout = null;

  function onChange(response = null) {
    // Make sure our setting of the title doesn't get observed!
    observer.disconnect();

    // Passing isOpen as the second parameter ("get current value instead of
    // saved value"), plus the change listener below, cause the title to update
    // in real time while the config is open.
    const countAll = GM_config.get('countAll', GM_config.isOpen);

    setTitleCount(
      response
        ? getUnreadCountFromResponse(response, getFeedId(feedList, countAll))
        : getUnreadCountFromFeedList(feedList, countAll),
      countAll,
    );

    observer.observe(feedList, { characterData: true, subtree: true });
    observer.observe(document.querySelector('head title'), { childList: true });
    scheduleRequest();
  }

  function scheduleRequest() {
    window.clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      const type = unsafeWindow.feedlyApplicationType;
      const version = unsafeWindow.feedlyApplicationVersion;

      fetch(`/v3/markers/counts?ck=${Date.now()}&ct=${type}&cv=${version}`, {
        headers: { authorization: `Bearer ${getSessionValue('feedlyToken')}` },
      })
        .then((response) => response.json())
        .then(onChange);
    }, GM_config.get('pollFrequency') * MS_PER_MINUTE);
    1;
  }

  GM_config.init({
    id: 'unreadCountInTitle',
    title: "'Unread count in title' settings",

    fields: {
      countAll: {
        label: 'Show count of all unread items, not just items in the selected folder',
        type: 'checkbox',
      },

      pollFrequency: {
        label: 'Check for unread items every…',
        type: 'range',
        default: 5,
        min: 1,
        max: 60,
        unitLabels: [' min', ' mins'],
      },
    },

    types: {
      range: {
        reset() {
          if (this.wrapper) {
            this.wrapper.querySelector(`#${this.configId}_field_${this.id}`).value = this.settings.default;
          }
        },

        toNode() {
          const container = this.create('div', {
            className: 'config_var',
            id: `${this.configId}_${this.id}_var`,
            title: this.title || '',
          });

          container.appendChild(
            this.create('label', {
              className: 'field_label',
              for: `${this.configId}_field_${this.id}`,
              id: `${this.configId}_${this.id}_field_label`,
              innerHTML: this.settings.label,
            }),
          );

          const input = this.create('input', {
            id: `${this.configId}_field_${this.id}`,
            max: this.settings.max,
            min: this.settings.min,
            step: this.settings.step,
            type: 'range',
            value: this.value,
          });

          const currentValue = this.create('span', {
            className: `${this.configId}_${this.id}_current_value`,
            innerHTML: formatCurrentValue(this.value, this.settings.unitLabels),
          });

          input.addEventListener(
            'input',
            () => {
              currentValue.textContent = formatCurrentValue(input.valueAsNumber, this.settings.unitLabels);
            },
            { passive: true },
          );

          container.appendChild(input);
          container.appendChild(currentValue);

          return container;
        },

        toValue() {
          if (this.wrapper) {
            return this.wrapper.querySelector(`#${this.configId}_field_${this.id}`).valueAsNumber;
          }
        },
      },
    },

    // These listeners all wrap onChange in an arrow function to prevent
    // argument leaking; that function's behavior changes when an argument is
    // provided.
    events: {
      close: () => onChange(),
      open: () => GM_config.fields.countAll.node.addEventListener('change', () => onChange()),
      save: () => onChange(),
    },
  });

  // Update the page title now (if possible) and start the observer and timeout.
  onChange();
});
