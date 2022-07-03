// ==UserScript==
// @name        YouTube: Watched badge
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.1.2
// @author      Ben "535" Blank
// @description Adds or improves "watched" badges on watched videos' thumbnails.
// @homepageURL https://benblank.github.io/user-scripts/scripts/youtube-watched-badge.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/scripts/youtube-watched-badge.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// @match       https://*.youtube.com/*
// @require     https://openuserjs.org/src/libs/sizzle/GM_config.js
// @require     https://benblank.github.io/user-scripts/libraries/gm-config-range-type.lib.js?v=1.0.4
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
    font-size: var(--yt-badge-font-size,1.2rem);
    font-weight: var(--yt-badge-font-weight,500);
    left: 0;
    letter-spacing: var(--yt-badge-letter-spacing,0.5px);
    line-height: var(--yt-badge-line-height-size,1.2rem);
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

const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_MINUTE = 60;

// This is YouTube's built-in watched badge, and may be present on some views.
const YOUTUBE_BADGE_SELECTOR = 'ytd-thumbnail-overlay-playback-status-renderer';

const YOUTUBE_TIME_SELECTOR = 'ytd-thumbnail-overlay-time-status-renderer';

const VALUE_BOTH = 'Both';
const VALUE_PERCENT = 'Percentage viewed';
const VALUE_TIME = 'Time Remaining';
const VALUES_PERCENT = new Set([VALUE_BOTH, VALUE_PERCENT]);
const VALUES_TIME = new Set([VALUE_BOTH, VALUE_TIME]);

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

function parseTime(text) {
  if (!text) {
    return NaN;
  }

  const segments = text.split(':');

  if (segments.length > 2) {
    // YouTube doesn't format times with more than three segments.
    return (
      parseInt(segments[0], 10) * SECONDS_PER_HOUR +
      parseInt(segments[1], 10) * SECONDS_PER_MINUTE +
      parseInt(segments[2], 10)
    );
  }

  return parseInt(segments[0], 10) * SECONDS_PER_MINUTE + parseInt(segments[1]);
}

function setBadge(thumbnail) {
  const progress = thumbnail.querySelector('#progress');
  const time = thumbnail.querySelector(YOUTUBE_TIME_SELECTOR);
  const basis = GM_config.get('basis');
  const percentWatchedLimit = GM_config.get('percentWatched');
  const timeRemainingLimit = GM_config.get('timeRemaining');

  // If the progress bar is absent, parseFloat will return NaN, which always
  // compares false.
  const percentWatched = parseFloat(progress?.style.width);

  // Similarly parseTime will return NaN.
  const videoTime = parseTime(time?.textContent);

  const isShortVideo = videoTime <= timeRemainingLimit;
  const timeRemaining = videoTime - (videoTime * percentWatched) / 100;

  const shouldBeBadged =
    (VALUES_PERCENT.has(basis) && percentWatched >= percentWatchedLimit) ||
    (VALUES_TIME.has(basis) && !isShortVideo && timeRemaining <= timeRemainingLimit);

  const badge = thumbnail.querySelector(YOUTUBE_BADGE_SELECTOR) ?? thumbnail.querySelector('.ytwb-badge');
  const img = thumbnail.querySelector('#img');
  const hidingPlaybackStatus = thumbnail.hasAttribute('hide-playback-status');

  if (shouldBeBadged && (!hidingPlaybackStatus || GM_config.get('unhide'))) {
    if (img) {
      img.style.opacity = 0.5;
    }

    const badgeText = hidingPlaybackStatus ? 'W' : 'WATCHED';

    if (badge) {
      if (hidingPlaybackStatus) {
        // An existing badge only needs tweaked if the thumbnail is trying to
        // hide it.

        const formattedString = badge.querySelector('yt-formatted-string');

        if (formattedString) {
          formattedString.textContent = badgeText;
          badge.style.display = 'revert';
        }
      }
    } else {
      thumbnail.querySelector('#overlays')?.appendChild(createElement('span', { class: 'ytwb-badge' }, badgeText));
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
    basis: {
      label: 'Mark videos as watched based on…',
      type: 'select',
      options: [VALUE_PERCENT, VALUE_TIME, VALUE_BOTH],
      default: 'Both',
    },

    // The video's play percentage is extracted from the thumbnail's progress
    // bar, where it is stored as a CSS width. Becuase the width is specified
    // using the percentage unit, this field uses the same, to avoid needing to
    // convert the value.
    percentWatched: {
      label: 'Add a badge if the percent watched is at least…',
      type: 'range',
      default: 80,
      min: 0,
      max: 100,
      unitLabels: '%',
    },

    timeRemaining: {
      label: 'Add a badge if the time remaining is less than…',
      type: 'range',
      default: 90,
      min: 0,
      max: SECONDS_PER_HOUR,

      formatter(value) {
        let remaining = value;
        const segments = [];

        if (remaining >= SECONDS_PER_HOUR) {
          segments.push(Math.trunc(value / SECONDS_PER_HOUR));
          remaining = remaining % SECONDS_PER_HOUR;
        }

        segments.push(Math.trunc(remaining / SECONDS_PER_MINUTE));
        segments.push(remaining % SECONDS_PER_MINUTE);

        return segments.map((segment, index) => (index !== 0 && segment < 10 ? `0${segment}` : segment)).join(':');
      },
    },

    unhide: {
      label: 'Add a badge even to thumbnails which would normally hide it',
      type: 'checkbox',
      default: true,
    },
  },

  types: {
    range: GM_config_range_type,
  },

  events: {
    close: setBadges,
  },
});
