// ==UserScript==
// @name        YouTube: No list autoplay
// @namespace   https://benblank.github.io/user-scripts/
// @version     2.0.0
// @author      Ben "535" Blank
// @description Prevents videos opened from a list autoplaying the next video.
// @homepageURL https://benblank.github.io/user-scripts/scripts/youtube-no-list-autoplay.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/scripts/youtube-no-list-autoplay.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.youtube.com/playlist
// @inject-into content
// @run-at      document-start
// ==/UserScript==

const EVENTS_TO_ISOLATE = [
  'change',
  'click',
  'down',
  'input',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'pointerdown',
  'pointerup',
  'tap',
  'touchend',
  'touchstart',
  'up',
];

const appObserver = new MutationObserver(handleAppMutations);

/** @type {Set<Element>} */
const isolatedRenderers = new Set();

/** @type {WeakMap<Element, Record<string, Set<EventListenerOrEventListenerObject>>>} */
const knownEventHandlers = new WeakMap();

const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

/**
 * @this {EventTarget}
 * @type {typeof EventTarget.prototype.addEventListener}
 */
function addEventListenerWrapper(type, handler, options, ...rest) {
  try {
    if (handler && EVENTS_TO_ISOLATE.includes(type) && this instanceof Element) {
      if (isIsolated(this)) {
        // Refuse to add new listeners to a renderer which has already been
        // isolated.

        return;
      }

      const handlers = knownEventHandlers.get(this) ?? {};
      const capture = Boolean(typeof options === 'object' ? options.capture : options);
      const key = `${capture}-${type}`;

      if (key in handlers) {
        handlers[key].add(handler);
      } else {
        handlers[key] = new Set([handler]);
      }

      knownEventHandlers.set(this, handlers);
    }
  } catch (error) {
    console.error('An error occurred while adding intercepted event handlers:', error);
  }

  originalAddEventListener.call(this, type, handler, options, ...rest);
}

/** @type {MutationCallback} */
function handleAppMutations(mutations) {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        if (node.tagName === 'YTD-PLAYLIST-VIDEO-RENDERER') {
          processRenderer(node);
        } else {
          for (const element of node.querySelectorAll('ytd-playlist-video-renderer')) {
            processRenderer(element);
          }
        }
      }
    }
  }
}

/** @type {(event: Event) => void} */
function handleIsolatedEvent(event) {
  console.log(event);
  event.preventDefault();
  event.stopPropagation();
}

/** @type {(element: Element) => boolean } */
function isIsolated(element) {
  /** @type {Element | null} */
  let current = element;

  while (current) {
    if (isolatedRenderers.has(current)) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

/** @type {(element: Element) => void} */
function isolateEvents(element) {
  console.info('isolating events for', element);

  removeEventHandlers(element);

  console.info('adding isolated event handlers to', element);

  for (const type of EVENTS_TO_ISOLATE) {
    element.addEventListener(type, handleIsolatedEvent);
  }
}

/** @type {(element: Element) => void} */
function processRenderer(renderer) {
  if (isolatedRenderers.has(renderer)) {
    return;
  }

  console.info('processing renderer', renderer);

  isolatedRenderers.add(renderer);
  isolateEvents(renderer);
  removeListParameters(renderer);
  // TODO?: something something MutationObserver?
}

/**
 * @this {EventTarget}
 * @type {typeof EventTarget.prototype.removeEventListener}
 */
function removeEventListenerWrapper(type, handler, options, ...rest) {
  try {
    if (handler && EVENTS_TO_ISOLATE.includes(type) && this instanceof Element) {
      const handlers = knownEventHandlers.get(this);
      const capture = Boolean(typeof options === 'object' ? options.capture : options);
      const key = `${capture}-${type}`;

      if (capture) {
        console.warn(`Recording capturing ${type} event handler for`, this);
      }

      if (handlers && key in handlers) {
        handlers[key].delete(handler);
      }
    }
  } catch (error) {
    console.error('An error occurred while removing intercepted event handlers:', error);
  }

  originalRemoveEventListener.call(this, type, handler, options, ...rest);
}

/** Remove YouTube's playlist parameters from a node's href= attribute.
 *
 * Removes the list= and index= parameters from href= attributes which point to
 * YouTube's /watch page.
 *
 * If the element doesn't have an href= attribute (or the href= attribute
 * doesn't point at the /watch page), it is not affected.
 *
 * @param {Element} element The element from which to remove the parameters, if
 * they exist.
 */
function removeListParameters(element) {
  try {
    const href = element.getAttribute('href');

    if (!href) {
      return;
    }

    const url = new URL(href, document.baseURI);

    if (url.pathname === '/watch') {
      // The list= parameter controls "list mode". The index= parameter is
      // simply unnecessary witout list=.
      url.searchParams.delete('index');
      url.searchParams.delete('list');

      element.setAttribute('href', url.href);
    }
  } catch (error) {
    // The href attribute wasn't a valid URL, which doesn't need handled.
  }

  for (const child of element.children) {
    removeListParameters(child);
  }
}

/** @type {(element: Element) => void} */
function removeEventHandlers(element) {
  for (const [key, handlers] of Object.entries(knownEventHandlers.get(element) ?? {})) {
    const keyParts = key.split('-', 2);
    const capture = keyParts[0] === 'true';
    const type = keyParts[1];

    console.info(`removing ${handlers.size} ${key} event handlers from`, element);

    for (const handler of handlers) {
      element.removeEventListener(type, handler, { capture });
    }
  }

  for (const child of element.children) {
    removeEventHandlers(child);
  }
}

EventTarget.prototype.addEventListener = addEventListenerWrapper;
EventTarget.prototype.removeEventListener = removeEventListenerWrapper;

document.addEventListener(
  'DOMContentLoaded',
  () => {
    for (const app of document.getElementsByTagName('ytd-app')) {
      appObserver.observe(app, { childList: true, subtree: true });

      for (const renderer of app.getElementsByTagName('ytd-playlist-video-renderer')) {
        processRenderer(renderer);
      }
    }
  },
  { once: true },
);
