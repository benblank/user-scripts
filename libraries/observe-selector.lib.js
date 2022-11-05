// ==UserScript==
// @namespace   https://benblank.github.io/user-scripts/
// @exclude     *

// ==UserLibrary==
// @name        observeSelector
// @version     1.0.0
// @author      Ben "535" Blank
// @description Provides a function which resolves a promise when a node appears in the DOM.
// @homepageURL https://benblank.github.io/user-scripts/libraries/observe-selector.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/libraries/observe-selector.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// ==/UserLibrary==

// ==/UserScript==

/** Obtain an element which matches a selector when it appears in the DOM.
 *
 * Try to use as specific a root as possible; the smaller the observation space,
 * the faster the search.
 *
 * Only the "id" and "class" attributes are observed (to improve speed), so
 * selector should not look for arbitrary attributes.
 *
 * @param {string} selector A CSS-style selector.
 * @param {HTMLElement} root The root element from which to match the selector.
 * @returns {Promise<HTMLElement>} The first element to appear which matches the
 * selector.
 */
// eslint-disable-next-line no-unused-vars
function observeSelector(selector, root = document.body) {
  const maybeExists = root.querySelector(selector);

  if (maybeExists) {
    return Promise.resolve(maybeExists);
  }

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
