// ==UserScript==
// @name        YouTube: Watched badge
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0
// @author      Ben "535" Blank
// @description Adds or improves "watched" badges on watched videos' thumbnails.
// @homepageURL https://benblank.github.io/user-scripts/scripts/youtube-watched-badge.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/scripts/youtube-watched-badge.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.youtube.com/*
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require     https://benblank.github.io/user-scripts/libraries/gm-config-range-type.lib.js?v=1.0.2
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @inject-into content
// ==/UserScript==

/* globals GM_config, GM_config_range_type */

const BADGE_CSS = `
  .ytwb-badge {
    background-color: var(--yt-spec-static-overlay-background-heavy);
    border-radius: 2px;
    bottom: 0;
    color: var(--yt-spec-static-brand-white);
    font-size: var(--ytd-badge_-_font-size);
    font-weight: var(--ytd-badge_-_font-weight);
    left: 0;
    letter-spacing: 0.5px;
    line-height: var(--ytd-badge_-_line-height);
    margin: 4px;
    padding: 3px 4px;
    position: absolute;
  }
`;

// How long to wait before handling an event. New events arriving within this
// window cancel the previous timeout and start a new one, meaning that a
// debounced function only fires this many milliseconds after the last event in
// a batch. Lower timeouts make the function more responsive, but may
// unnecessarily increase load, especially if DOM manipulations are performed.
const DEBOUNCE_TIMEOUT = 50;

// This is YouTube's built-in watched badge, and may be present on some views.
const YOUTUBE_BADGE_SELECTOR = 'ytd-thumbnail-overlay-playback-status-renderer';

const INTERPRET_AS_ATTRIBUTES = new Set([
  'accesskey',
  'class',
  'for',
  'href',
  'id',
  'name',
  'src',
  'style',
  'type',
  'value',
]);

function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);

  for (const [key, value] of Object.entries(attributes)) {
    if (INTERPRET_AS_ATTRIBUTES.has(key)) {
      // If the key is recognized to be primarily an attribute, set it as such.
      element.setAttribute(key, value);
    } else {
      // Otherwise, just set it as a property.
      element[key] = value;
    }
  }

  function appendChild(child) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else {
      console.error(`Couldn't interpret '${child}' as a child type while creating element '${tagName}'.`);
    }
  }

  if (Array.isArray(children)) {
    // If chilren is an array, append them all.
    for (const child of children) {
      appendChild(child);
    }
  } else {
    // Otherwise, just append it directly.
    appendChild(children);
  }

  return element;
}

GM_registerMenuCommand('Configure watched badge', () => GM_config.open());

function debounce(fn) {
  return () => {
    clearTimeout(fn.timeout);

    fn.timeout = setTimeout(fn, DEBOUNCE_TIMEOUT);
  };
}

function setBadge(thumbnail) {
  const progress = thumbnail.querySelector('#progress');

  // If the progress bar is absent, parseFloat will return NaN, which always
  // compares false.
  const shouldBeBadged = parseFloat(progress?.style.width) >= GM_config.get('minimumPercent');

  const badge = thumbnail.querySelector(YOUTUBE_BADGE_SELECTOR) ?? thumbnail.querySelector('.ytwb-badge');
  const img = thumbnail.querySelector('#img');

  if (shouldBeBadged) {
    if (img) {
      img.style.opacity = 0.5;
    }

    if (!badge) {
      thumbnail.querySelector('#overlays')?.appendChild(createElement('span', { class: 'ytwb-badge' }, 'WATCHED'));
    }
  } else {
    if (img) {
      img.style.removeProperty('opacity');
    }

    if (badge) {
      badge.remove();
    }
  }
}

document.head.appendChild(createElement('style', undefined, BADGE_CSS));

const setBadges = debounce(() => Array.from(document.querySelectorAll('ytd-thumbnail') ?? []).forEach(setBadge));

// These events are overly broad, but YouTube no longer produces a narrower,
// more appropriate event. (That I know of.)
document.addEventListener('dom-change', setBadges);
document.addEventListener('yt-action', setBadges);

GM_config.init({
  id: 'watchedBadge',
  title: "'Watched badge' settings",

  fields: {
    // The video's play percentage is extracted from the thumbnail's progress
    // bar, where it is stored as a CSS width. Becuase the width is specified
    // using the percentage unit, this field uses the same, to avoid needing to
    // convert the value.
    minimumPercent: {
      label: 'Minimum percent watched to add badge',
      type: 'range',
      default: 80,
      min: 0,
      max: 100,
      unitLabels: '%',
    },
  },

  types: {
    range: GM_config_range_type,
  },

  events: {
    close: setBadges,
  },
});
