## YouTube: Watched badge

YouTube used to display a nice "watched" badge on videos which you'd already
finished watching:

![video thumbnail with watched badge](youtube-watched-badge.screenshot.png)

Maybe it's still supposed to. But for me, they stopped appearing some time ago.
This script brings them back, with customization for when they appear.

### Settings

- **Mark videos as watched based on…**

  You can choose to mark a video as watched based on what percentage of the
  video you've watched, how much unwatched time remains at the end of the video,
  or both (the default). See the below settings to control what percentage and
  time remaining are used.

  Note that when using "Both", a badge will be added if _either_ the percentage
  or time remaining checks would add a badge.

- **Add a badge if the percent watched is at least…**

  When adding badges based on percentage watched, this is the threshold used
  (80%, by default). If you've watched at least this much of the video, a badge
  will be added.

- **Add a badge if the time remaining is less than…**

  When adding badges based on time remaining, this is the threshold used (one
  and a half minutes, by default). If no more than this amount of time remains
  unwatched at the end of the video, a badge will be added.

  Note that there is an exception to this; if the entire video is shorter than
  the time remaining you have set, a badge will never be added based on time
  remaining.

- **Add a badge even to thumbnails which would normally hide it**

  In some views (such as playlists), the thumbnails are small enough that
  YouTube hides the watched badge, even if it would otherwise be shown. When
  checked (the default), badges will be shown on those thumbnails anyway (though
  the text will be abbreviated to just "W" due to the small size). When
  unchecked, watched videos will still be faded, but the badge will not be
  visible.

### Troubleshooting

- _The badge doesn't show up on the video I've watched most recently._

  YouTube has a lot of moving parts, and they don't always talk to each other
  quickly. Often, after you leave a video, the progress bar that YouTube
  displays on its thumbnails won't update for as long as a few minutes. Because
  the watched badge is always placed based on the that progress bar, it won't
  know to add the badge until YouTube finishes updating.

  One possible solution to this is to reduce the "Add a badge if the percent
  watched is greater than…" setting. YouTube generally knows that you watched
  _some_ of a video immediately after you close it, even if the latest value
  isn't available.

- _The badge never appears on any video._

  You may have your settings set up in such a way that no videos are triggering
  the badges. To fix this, open the script's settings (your user script
  extension should have a menu item called "Configure watched badge") and
  adjust them to your liking. There is a "Reset to defaults" link if you don't
  know what they should be.

  If that doesn't fix it, it could be that YouTube made a change which breaks
  this script. [Open an issue][1] (if one doesn't already exist), and I'll see
  what I can do to get things working again.

[1]: https://github.com/benblank/user-scripts/issues
