## Steam Community: Toggleable spoilers in guides

I recently found myself wanting to reveal multiple spoilers in a Steam Community
guide, but *without* just revealing them all. That can be done a couple of
different ways using the browser console, but I wouldn't call any of them
particularly *convenient* and it would all be lost when refreshing the page,
anyway.

This script was created to solve both problems. Clicking a spoiler will disable
it, so that the text can be seen even when not hovering over it. Clicking it
again (disabled spoilers are marked with a bit of black bar on either end) will
hide it again. Which spoilers you've disabled are stored in your browser and
will still be disabled when you visit the same guide again.

### Caveat

Because Steam doesn't provide any way to distinguish between one spoiler and
another, the script just numbers them so that it has something to keep track of
when disabling them. The downside to this is that when a guide is updated,
there's no way to know if the spoilers are the same, so the script simply resets
itself rather than reveal something you didn't ask it to.

In other words, every time a guide is updated, all your disabled spoilers will
come back. Sorry about that; I don't think there's anything that can be done
about it.
