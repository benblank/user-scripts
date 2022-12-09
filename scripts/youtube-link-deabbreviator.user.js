Array.from(
  document.body
    .querySelector('ytd-watch-metadata')
    .querySelector('#description')
    .querySelectorAll('a.yt-formatted-string'),
)
  .filter((link) => /^https?:\/\//.test(link.textContent))
  .forEach((link) => {
    let url = link.getAttribute('href');

    if (/^https:\/\/www.youtube.com\/redirect\?/.test(url)) {
      url = new URL(url).searchParams.get('q');
    } else if (url[0] === '/') {
      const parsed = new URL(url, document.location);

      if (parsed.pathname === '/watch') {
        if (/*shouldBeShort*/ true) {
          const short = new URL('https://youtu.be/');

          short.pathname = '/' + parsed.searchParams.get('v');

          const startTime = parsed.searchParams.get('t');

          if (startTime !== '0s') {
            short.searchParams.append('t', startTime.substring(0, -1));
          }

          url = short.toString();
        } else {
          if (parsed.searchParams.get('t') === '0s') {
            parsed.searchParams.delete('t');
          }

          url = parsed.toString();
        }
      }
    }

    link.textContent = url;
  });
