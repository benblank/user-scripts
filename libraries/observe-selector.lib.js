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

// eslint-disable-next-line no-unused-vars
class SelectorObserver {
  #active;
  #callback;
  #mutationObserver;
  #observerOptions;
  #onMutation;

  constructor(callback, selector, { root, startPaused } = { root: document.body, startPaused: false }) {
    Object.defineProperties(this, {
      active: { enumerable: true, get: () => this.#active },
      selector: { enumerable: true, value: selector },
      root: { enumerable: true, value: root },
    });

    this.#callback = callback;

    // TODO: detect needed attributes
    this.#observerOptions = { attributes: true, attributeFilter: ['class', 'id'], childList: true, subtree: true };

    this.#onMutation = (mutations) => {
      for (const mutation of mutations) {
        switch (mutation.type) {
          case 'attributes':
            if (mutation.target.matches(selector)) {
              this.#callback(mutation.target);

              if (!this.#active) {
                return;
              }
            }

            break;

          case 'childList':
            for (const child of mutation.addedNodes) {
              if (child.matches?.(selector)) {
                this.#callback(child);

                if (!this.#active) {
                  return;
                }
              }
            }

            break;
        }
      }
    };

    this.#mutationObserver = new MutationObserver(this.#onMutation);

    if (!startPaused) {
      // Trigger the callback for any matches which already exist.
      Array.from(root.querySelectorAll(selector)).forEach((target) => {
        // Callbacks initiated in the constructor are done via microtasks, just
        // as they would be were they initiated by the `.#mutationObserver`.
        // This also prevents the callbacks from attempting to access the
        // SelectorObserver instance before it is fully initialized.
        queueMicrotask(() => callback(target));
      });

      this.resume();
    }
  }

  resume() {
    if (!this.#active) {
      this.#mutationObserver.observe(this.root, this.#observerOptions);
    }

    this.#active = true;
  }

  pause() {
    if (this.#active) {
      this.#mutationObserver.disconnect();
    }

    this.#active = false;
  }
}

/** Obtain the first element to match a selector.
 *
 * In particular, if a matching element does not currently exist, the returned
 * promise will one resolve once one is added.
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
function observeSelectorOnce(selector, root) {
  return new Promise((resolve, reject) => {
    try {
      const observer = new SelectorObserver(
        (target) => {
          observer.pause();
          resolve(target);
        },
        selector,
        { root },
      );
    } catch (error) {
      reject(error);
    }
  });
}
