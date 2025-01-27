// ==UserScript==
// @name        Girl Genius Online: Wiki links for each page
// @namespace   https://benblank.github.io/user-scripts/
// @version     1.0.0
// @author      Ben "535" Blank
// @description Adds a link to the current page's wiki entry to the top and bottom navigation.
// @homepageURL https://benblank.github.io/user-scripts/scripts/ggo-wikilinks.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @license     BSD-3-Clause
// @copyright   2025 Ben Blank
// @match       https://www.girlgeniusonline.com/*
// @grant       none
// ==/UserScript==

// prettier-ignore
const linkImage =
  "data:image/png;base64,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" +
  "6npSDdU0t2TIFyKa2kOWLG9mg8YaVIo8JMvfXphT0k4nuO5tsO8Wd9DU1EbvuirnJ60FhBfe+AqJmTYVlUkae1eS1E6iXD" +
  "uFIHCEJTHstP1Qjv75OJqbM1z/x7e5/+8f8dWsZVx06k5UphNs0L+OP92wP7c9+BFrmjMxtcwSocUyVNaH5xlR1+SwkSXT" +
  "kcVPpxC1rGnKEESWybceTlWFTyZb4L6/fsALr8/h6MO35/hfjKaiIkEYRKRSSdozQbz5RglzWTojS7Kqhr59qmlpyzJqSI" +
  "p+vdNEUeRKqphUfMphm3L7P2bRmolKlWVJgAr77LQBddWOBWXUuGLHePxq/21ZuLiZ1W0RvWoT+IV2gnwHQRCCCDYCYy1+" +
  "wqcq7VM7qJ7br9iPu/8+neenfsu3C1u54eIJbDy4nlQCLjt1R75d0IQNQ0RcVA4VFLO+PE9cu1YdubuQ6cTaCLURp/xqNL" +
  "86dDSpVIIvZi3h+jvewPM8/nH3L9h4ZD8U+OTThZx7+YtkcwF77jqC9z9aSD4fEwOjPIUgJF2Rp762jn59qnntw/kEgXah" +
  "RQi11Sn61ido7QydD17L7zXUpXjxrVlYqyXSkBGhtibN0MENBPNXkm1dQz6XBxuVSNgVqQReyvDS1Lmsbspx4Rm7Ud+rkk" +
  "vO2INttxzMdX98l+N/+yKXnrErE3cZio0ihg6sdUhKHJk9WbfG8Lu5vHiYYaREhRxBIc/geo+hewwm05Hhvodn8vhzX3Dw" +
  "T0dx8Zm7k6hIEeZD/vnGXK657XU8lEvP2oND9tuCppYstz/wHi9OneNurhFhtoNAQz77uoBJV9HalqOtNcNazK0uDcruZv" +
  "voK991OUbxPENdfTVVlQmCznay7e0EQVDyUyowfqdhnHjUFtjI4/yrp/LGBwtZ3TaV2ydNpLY2xSETN2Przfpx4fWvc9kt" +
  "bzBj7ijO/PX2GDRuvTqOtvkx4Rkp+0W1Shg4v2XFY9nKHDf/ZRotLTmuvWgvfjJ2CPl8SKEQ8ugLM7lr8gdUpX2uumgvdh" +
  "o7lEJoqaur4Kor9uW4I7fn8uteZe781YgquWyWICiQqshSX1NPbU1v2tqydHTksLEPK2ub9tg58zyhrr6Gmqo0UT5DvqWF" +
  "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" +
  "+wAAAABJRU5ErkJggg==";

// prettier-ignore
const numberWords = {
  zero:     0, one:      1, two:        2, three:     3,      four: 4,
  five:     5, six:      6, seven:      7, eight:     8,      nine: 9,
  ten:     10, eleven:  11, twelve:    12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty:  20, thirty:  30, forty:     40, fifty:    50,
  sixty:   60, seventy: 70, eighty:    80, ninety:   90,
};

// prettier-ignore
const romanNumerals = [
  "N",  "I",   "II",   "III",   "IV",
  "V",  "VI",  "VII",  "VIII",  "IX",
  "X",  "XI",  "XII",  "XIII",  "XIV",
  "XV", "XVI", "XVII", "XVIII", "XIX",
];

const volumePattern = /^---volume (?<volume>\S+)(?: \(act (?<act>\S+): book (?<book>\S+)\))?---/;

/** @returns { void } */
function addWikiLink() {
  const date = getDate();

  if (!date) throw 'Could not get date from URL.';

  const wikiUrl = buildWikiUrl(getVolumeText(), date);
  const topnav = document.getElementById('topnav');
  const bottomnav = document.getElementById('bottomnav');

  if (!topnav && !bottomnav) throw 'Could not find navigation controls.';

  const image = document.createElement('img');

  image.src = linkImage;
  image.style.display = 'block';

  const toplink = document.createElement('a');

  toplink.href = wikiUrl;
  toplink.style.display = 'block';
  toplink.style.position = 'absolute';

  toplink.append(image);

  if (topnav) {
    toplink.style.left = '377px';
    toplink.style.top = '-15px';

    topnav.append(toplink);
  }

  if (bottomnav) {
    /** @type {HTMLAnchorElement} */
    // @ts-expect-error -- A cloned node is of the same type as the original.
    const bottomlink = toplink.cloneNode(true);

    bottomlink.style.left = '380px';
    bottomlink.style.top = '9px';

    bottomnav.append(bottomlink);
  }
}

/** @returns { string } */
function buildWikiUrl(/** @type {string} */ volumeText, /** @type {string} */ date) {
  const match = volumePattern.exec(volumeText);

  if (!match) throw `Could not parse '${volumeText}' as a volume.`;

  /** @type {{ [key: string]: string }} */
  // @ts-expect-error -- The pattern has named groups, so `.groups` will exist.
  const groups = match.groups;

  const volume = parseVolumeNumber(groups['volume']);
  const act = groups['act'] ? parseVolumeNumber(groups['act']) : null;
  const book = groups['book'] ? parseVolumeNumber(groups['book']) : null;
  const page = act && book ? `${act}-${book}` : romanNumerals[volume];

  return `https://girlgenius.fandom.com/wiki/Chronology_-_Volume_${page}#${date}`;
}

/** @returns { string } */
function getDate() {
  const urlDate = new URL(document.location.href).searchParams.get('date');

  if (urlDate) return urlDate;

  const link = document.getElementById('savebookmark');

  if (!link) throw 'Could not find bookmark link.';

  const href = link.getAttribute('href');

  if (!href) throw 'No href on bookmark link.';

  const match = /setPage\((\d{8})\)/.exec(href);

  if (!match) throw `Could not extract date from href '${href}'.`;

  return match[1];
}

/** @returns { string } */
function getVolumeText() {
  let current = document.querySelector('#storylines option[selected]');

  if (!current) throw 'Could not find the current storyline.';

  while (current) {
    const text = current.textContent?.toLocaleLowerCase();

    if (text?.startsWith('---volume')) {
      return text;
    }

    current = current.previousElementSibling;
  }

  throw "Could not determine the current storyline's volume.";
}

/** @returns { number } */
function parseVolumeNumber(/** @type {string} */ volume) {
  if (/^[0-9]+$/.test(volume)) {
    return parseInt(volume, 10);
  }

  return volume.split(/[-\s]/).reduce((acc, word) => {
    if (word in numberWords) return acc + numberWords[word];

    throw `Could not interpret '${word}' as a number word.`;
  }, 0);
}

try {
  addWikiLink();
} catch (/** @type {unknown} */ error) {
  if (typeof error === 'string') {
    console.warn('[ggo-wikilinks]', error);
  } else {
    throw error;
  }
}
