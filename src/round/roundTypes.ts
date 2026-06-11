// Core Round shapes. A Round is a roster of Players, locked at creation, each
// carrying one Score per Hole. Only one Round is active at a time (ADR-0001).

// A Score is "not yet entered" (null) until the Scorekeeper records strokes for
// that Player on that Hole. scores has one entry per Hole.
export type Player = {
  name: string;
  scores: (number | null)[];
};

export type Round = {
  players: Player[];
};
