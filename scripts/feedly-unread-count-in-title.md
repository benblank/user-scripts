## Feedly: Unread count in title

Feedly doesn't provide a way for you to know how many unread items you have in
your feed when you aren't actually looking at it (e.g. Feedly is minimized or in
a different tab). This script places the number of unread items in the page
title, so that you can see it even when Feedly isn't visible.

### Settings

- **Show count of all unread items, not just items in the selected category**

  When checked, the count added to the title includes _all_ unread items (i.e.
  in all categories) and the count is marked with an asterisk to indicate that
  it includes all categories.

  When unchecked (the default), the count added to the title includes only the
  unread items in the currently-selected category or feed.

- **Hide the count when there are no unread items**

  When checked (the default), the unread count will disappear entirely when
  there are no unread items. When unchecked, the unread count will still appear
  (as a zero) when there are no unread items.

- **Check for unread items every…**

  Normally, Feedly only updates the uread counts while the tab is visible. This
  script therefore checks for unread items itself every five minutes (by
  default). This setting allows you to change how often that check occurs. The
  minimum is every one minute, to avoid spamming the servers. The maximum is
  every sixty minutes, which coincides with Feedly's own update schedule.

- **Show unread count at the beginning of the title instead of the end**

  When checked, the unread count will be prepended to the beginning of the
  title. When unchecked (the default), it will be appended to the end.

### Troubleshooting

- _The number of unread items isn't appearing in the title!_

  By default, no count is displayed if there are no unread items. If you prefer
  to see a zero when there are no unread items, go into the script's settings
  (your user script extension should have a menu item called "Configure unread
  count in title") and uncheck the box for "Hide the count when there are no
  unread items".

- _I can't see the number of unread items because my category's name is so long
  that it gets cut off._

  If you have long category names, you'll probably want to move the unread count
  to the beginning of the title instead of the end. To do so, open the script's
  settings (your user script extension should have a menu item called "Configure
  unread count in title") and check the box for "Show unread count at the
  beginning of the title instead of the end".

- _The unread count is incorrect or keeps changing._

  Feedly sometimes gets confused about how many items are unread, which can lead
  to it and this script "arguing" over how many there are. If you notice this
  behavior, the simplest fix is to reload Feedly (Ctrl-R or Cmd-R, in most
  browsers), which should get the two back in agreement.

- _The unread count is missing or zero, but I have unread items._

  This could be a miscommunication between Feedly and this script; try reloading
  Feedly (Ctrl-R or Cmd-R, in most browsers).

  If that doesn't fix it, or if this happens frequently, it could be that Feedly
  made a change to their website which breaks this script. [Open an issue][1]
  (if one doesn't already exist), and I'll see what I can do to get things
  working again.

[1]: https://github.com/benblank/user-scripts/issues
