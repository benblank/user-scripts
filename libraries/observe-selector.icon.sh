#!/bin/sh

convert -size 32x32 xc:white -font "Ubuntu-Bold" -pointsize 14 -fill blue -annotate +2+13 '#a >' -annotate +3+29 ' .bcd' observe-selector.icon.png
