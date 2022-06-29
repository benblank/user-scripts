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
// @require     https://benblank.github.io/user-scripts/libraries/gm-config-range-type.lib.js?v=1.0.1
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @inject-into content
// ==/UserScript==

/* globals GM_config */

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

// This is YouTube's built-in watched badge, and may be present on some views.
const YOUTUBE_BADGE_SELECTOR = 'ytd-thumbnail-overlay-playback-status-renderer';

GM_registerMenuCommand('Configure watched badge', () => GM_config.open());

const options = {
  debounce: 50,
  opacity: 0.5,

  // The video's play percentage is extracted from the thumbnail's progress bar,
  // where it is stored as a CSS width. Becuase the width is specified using the
  // percentage unit, the threshold here uses the same, to avoid needing to
  // convert the value.
  threshold: 80,
};

function debounce(fn) {
  return () => {
  clearTimeout(fn.timeout);

  fn.timeout = setTimeout(fn, options.debounce);
  };
}

function setBadge(thumbnail) {
  const progress = thumbnail.querySelector('#progress');

  // If the progress bar is absent, parseFloat will return NaN, which always
  // compares false.
  const shouldBeBadged = parseFloat(progress?.style.width) >= options.threshold;

  const badge = thumbnail.querySelector(YOUTUBE_BADGE_SELECTOR) ?? thumbnail.querySelector('.ytwb-badge');
  const img = thumbnail.querySelector('#img');

  if (shouldBeBadged) {
    if (img) {
      img.style.opacity = options.opacity;
    }

    if (!badge) {
      const newBadge = document.createElement('span');

      newBadge.className = 'ytwb-badge';
      newBadge.appendChild(document.createTextNode('WATCHED'));

      thumbnail.querySelector('#overlays')?.appendChild(newBadge);
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

const css = document.createElement('style');

css.appendChild(document.createTextNode(BADGE_CSS));

document.head.appendChild(css);

const setBadges = debounce(() => Array.from(document.querySelectorAll('ytd-thumbnail') ?? []).forEach(setBadge));

// These events are overly broad, but YouTube no longer produces a narrower,
// more appropriate event. (That I know of.)
document.addEventListener('dom-change', setBadges);
document.addEventListener('yt-action', setBadges);
