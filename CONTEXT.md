# Putt Putt Scorecard

A web app for keeping score across a fixed 9-hole putt putt course. One person
acts as scorekeeper, entering every player's score as the group plays through.

## Language

**Round**:
One play-through of all 9 holes by a group, from start to declared winner. The
top-level thing that gets created, played, and finished. Has a fixed roster of
Players set at creation — the roster does not change once the Round starts. Only
one Round is active at a time; starting a new Round discards any in-progress one.
_Avoid_: Game, game session, match

**Scorecard**:
The read-only overview of a Round — every Player's Score on every Hole, with
running Totals. Acts as the hub: each Hole is tappable to open its Hole Entry
Page. A representation of the Round, not a separate concept (its on-screen
orientation is a layout choice, not part of the definition).
_Avoid_: Scoresheet

**Hole Entry Page**:
The per-Hole screen for entering every Player's score on a single Hole. Opened
from the Scorecard; saving returns to the Scorecard. Holes may be entered in any
order, not strictly sequentially.
_Avoid_: Hole page, hole screen

**Player**:
One participant within a Round, owning a single row of scores.

**Hole**:
One of the fixed 9 obstacles on the course. Has a name and a par value; the par
is shown as context while putting but is not used in scoring or to pick the
Winner. This configuration persists across Rounds and is edited only outside an
active Round.

**Score**:
The number of strokes a Player took on one Hole. A positive integer capped at 9
— failing to sink it by 9 means picking up and taking a 9. A Hole with no Score
entered for a Player is "not yet entered," distinct from any numeric value.
_Avoid_: Strokes, points

**Total**:
The sum of a Player's Scores across all entered Holes. Lowest Total wins.

**Winner**:
The Player with the lowest Total in a _complete_ Round (all Players scored on
all Holes). Ties yield co-Winners with no tiebreaker. An incomplete Round has no
Winner, even if finished early.

**Scorekeeper**:
The single person operating the app, entering scores on behalf of all Players.
