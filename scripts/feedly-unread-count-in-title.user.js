// ==UserScript==
// @name        Feedly: Unread count in title
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.3
// @author      Ben "535" Blank
// @description Adds the number of unread items to the Feedly window title.
// @homepageURL https://benblank.github.io/user-scripts/scripts/feedly-unread-count-in-title.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/scripts/feedly-unread-count-in-title.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.feedly.com/*
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require     https://benblank.github.io/user-scripts/libraries/gm-config-range-type.lib.js?v=1.0.1
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @inject-into content
// ==/UserScript==

/* globals GM_config, GM_config_range_type */

const ALL_TITLE = 'All';
const CURRENT_ROW_SELECTOR = '.LeftnavListRow--selected';
const FEED_LIST_SELECTOR = '.LeftnavList__feed-list';
const MS_PER_MINUTE = 60 * 1000;
const ROOT_ID = 'root';
const ROW_COUNT_SELECTOR = '.LeftnavListRow__count';
const ROW_SELECTOR = '.LeftnavListRow';
const TITLE_UNREAD_COUNT_PATTERN = /^\(\*?\d+\) | \(\*?\d+\)$/;

GM_registerMenuCommand('Configure unread count in title', () => GM_config.open());

/** Get the ID of the feed or category which should be counted.
 *
 * If `countAll` is true, the ID for the "All" category will be returned.
 * Otherwise, the DOM will be scanned for the currently-selected category or
 * feed and its ID will be returned.
 *
 * @param {HTMLElement} feedList The root node of the feed list.
 * @param {boolean} countAll Whether all items should be counted (instead of
 * just the selected feed/category).
 * @returns {string} The relevant feed ID.
 */
function getFeedId(feedList, countAll) {
  // If we're counting everything, return the ID for the "All" category.
  if (countAll) {
    return `user/${getSessionValue('feedlyId')}/category/global.all`;
  }

  const selected = feedList.querySelector(CURRENT_ROW_SELECTOR);

  // The "All" category, which is identified by its title, doesn't store its ID
  // in the DOM.
  if (selected?.title === ALL_TITLE) {
    return `user/${getSessionValue('feedlyId')}/category/global.all`;
  }

  // Other categories' IDs can be most easily obtained from their great-
  // grandparents' "id" attributes.
  const ggParentId = selected?.parentNode?.parentNode?.parentNode?.getAttribute('id');

  if (ggParentId) {
    return ggParentId;
  }

  // Individual feeds have their feed ID stored in the selected element's
  // parent's draggable data.
  const draggableId = selected?.parentNode?.dataset.rbdDraggableId;

  if (draggableId) {
    try {
      return JSON.parse(draggableId).feedId;
    } catch {
      console.error(`Could not parse draggableId '${draggableId} as JSON.`);
    }
  }

  // Implicitly return undefined if no category ID could be found.
}

/** Get a value from Feedly's session.
 *
 * Feedly stores information about the current session as a JSON blob in local
 * storage. This function retrieves the requested property from that session.
 *
 * @param {string} key The key of the property to return.
 * @returns {unknown} The value of the requested property, if it exists.
 */
function getSessionValue(key) {
  const session = localStorage.getItem('feedly.session');

  try {
    return JSON.parse(session)[key];
  } catch {
    console.error(`Could not parse session '${session} as JSON.`);
  }

  // Implicitly return undefined if the session was missing or invalid.
}

/** Get the current number of unread items by scanning the DOM.
 *
 * If `countAll` is true, the count for the "All" category will be returned.
 * Otherwise, the count of the currently-selected category or feed will be
 * returned.
 *
 * @param {HTMLElement} feedList The root node of the feed list.
 * @param {boolean} countAll Whether all items should be counted (instead of
 * just the selected feed/category).
 * @returns {string?} The number of unread items.
 */
function getUnreadCountFromFeedList(feedList, countAll) {
  if (countAll) {
    return feedList.querySelector(`${ROW_SELECTOR}[title=${ALL_TITLE}] ${ROW_COUNT_SELECTOR}`)?.textContent;
  }

  return feedList.querySelector(`${CURRENT_ROW_SELECTOR} ${ROW_COUNT_SELECTOR}`)?.textContent;
}

/** Get the current number of unread items from a response from Feedly's API.
 *
 * @param {object} response A response from Feedly's "counts" endpoint.
 * @param {string} feedId The feed ID for which to get the unread count.
 * @returns {number?} The unread count for the requested feed or category.
 */
function getUnreadCountFromResponse(response, feedId) {
  return response.unreadcounts?.find(({ id }) => id === feedId)?.count;
}

/** Obtain an element which matches a selector when it appears in the DOM.
 *
 * Try to use as specific a root as possible; the smaller the observation space,
 * the faster the search.
 *
 * Only the "id" and "class" attributes are observed (to improve speed), so
 * selector should not look for arbitrary attributes.
 *
 * @param {HTMLElement} root The root element from which to match the selector.
 * @param {string} selector A CSS-style selector.
 * @returns {Promise<HTMLElement>} The first element to appear which matches the
 * selector.
 */
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

/** Add (or remove) the unread count in the page title.
 *
 * @param {number|string?} unreadCount The number of unread items to display.
 * @param {boolean} options.countAll Whether the count represents all unread
 * items, or just those in the selected category or feed.
 * @param {boolean} options.hideWhenZero Whether to hide the unread count
 * entirely when it is (or represents) zero.
 * @param {boolean} options.prepend Whether to add the count to the beginning of
 * the title instead of the end.
 */
function setTitleCount(unreadCount, { countAll, hideWhenZero, prepend }) {
  const existingTitleBase = document.title.replace(TITLE_UNREAD_COUNT_PATTERN, '');

  // Count was zero, missing, or empty, all of which indicate no unread items.
  const unreadCountIsZero = !unreadCount || unreadCount === '0';

  if (unreadCountIsZero && hideWhenZero) {
    document.title = existingTitleBase;
  } else {
    const displayCount = unreadCountIsZero && !hideWhenZero ? 0 : unreadCount;

    if (prepend) {
      document.title = `(${countAll ? '*' : ''}${displayCount}) ${existingTitleBase}`;
    } else {
      document.title = `${existingTitleBase} (${countAll ? '*' : ''}${displayCount})`;
    }
  }
}

observeSelector(document.getElementById(ROOT_ID), FEED_LIST_SELECTOR).then((feedList) => {
  // The observer callback wraps onChange in an arrow function to prevent
  // argument leaking; that function's behavior changes when an argument is
  // provided.
  const observer = new MutationObserver(() => onChange());
  let timeout = null;

  /** Handle a potential change to the unread count.
   *
   * Triggered by either DOM observation or an API response. If the `response`
   * parameter is present, it is treated as a response from Feedly's counts
   * endpoint. Otherwise, a value is extracted from the DOM.
   *
   * @param {object?} response The API response which triggered this change, if
   * any.
   */
  function onChange(response = null) {
    // Make sure our setting of the title doesn't get observed!
    observer.disconnect();

    // Passing isOpen as the second parameter ("get current value instead of
    // saved value"), plus the change listeners below, cause the title to update
    // in real time while the config is open.
    const countAll = GM_config.get('countAll', GM_config.isOpen);
    const hideWhenZero = GM_config.get('hideWhenZero', GM_config.isOpen);
    const prepend = GM_config.get('prepend', GM_config.isOpen);

    setTitleCount(
      response
        ? getUnreadCountFromResponse(response, getFeedId(feedList, countAll))
        : getUnreadCountFromFeedList(feedList, countAll),
      {
        countAll,
        hideWhenZero,
        prepend,
      },
    );

    observer.observe(feedList, { characterData: true, subtree: true });
    observer.observe(document.querySelector('head title'), { childList: true });
    scheduleRequest();
  }

  /** Schedule a request to Feedly's API.
   *
   * Any existing scheduled request is cleared first.
   */
  function scheduleRequest() {
    window.clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      fetch(`/v3/markers/counts?autorefresh=true`, {
        headers: { authorization: `Bearer ${getSessionValue('feedlyToken')}` },
      })
        .then((response) => response.json())
        .then(onChange)
        .catch(scheduleRequest);
    }, GM_config.get('pollFrequency') * MS_PER_MINUTE);
  }

  GM_config.init({
    id: 'unreadCountInTitle',
    title: "'Unread count in title' settings",

    fields: {
      countAll: {
        label: 'Show count of all unread items, not just items in the selected category',
        type: 'checkbox',
      },

      hideWhenZero: {
        label: 'Hide the count when there are no unread items',
        type: 'checkbox',
        default: true,
      },

      pollFrequency: {
        label: 'Check for unread items every…',
        type: 'range',
        default: 5,
        min: 1,
        max: 60,
        unitLabels: [' min', ' mins'],
      },

      prepend: {
        label: 'Show unread count at the beginning of the title instead of the end',
        type: 'checkbox',
      },
    },

    types: {
      range: GM_config_range_type,
    },

    // These listeners all wrap onChange in an arrow function to prevent
    // argument leaking; that function's behavior changes when an argument is
    // provided.
    events: {
      close: () => onChange(),

      open: () => {
        GM_config.fields.countAll.node.addEventListener('change', () => onChange());
        // No listener for pollFrequency, as its value doesn't affect display.
        GM_config.fields.prepend.node.addEventListener('change', () => onChange());
        GM_config.fields.hideWhenZero.node.addEventListener('change', () => onChange());
      },

      save: () => onChange(),
    },
  });

  // Update the page title now (if possible) and start the observer and timeout.
  onChange();
});
