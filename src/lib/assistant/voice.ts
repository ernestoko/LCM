/**
 * Jesselyn's voice polish.
 *
 * Chat replies are assembled from three sources — hand-written canned replies,
 * the knowledge base / FAQ, and the optional LLM fallback. Em- and en-dashes
 * creep in from all three, and in a casual chat bubble they read as machine-
 * written ("the em-dash tell") and add a beat of friction. `deDash` rewrites
 * them to the punctuation a person would actually type, so every line Jesselyn
 * sends sounds human. It runs at the single render choke-point, covering all
 * three sources at once.
 *
 * Only true em/en dashes (— U+2014, – U+2013) are touched. Ordinary hyphens in
 * "door-to-door", "half-drum" or "6-digit" are left exactly as they are.
 */
export function deDash(text: string): string {
  return text
    // A dash right after sentence-ending punctuation is usually a sign-off or an
    // aside ("...right here. — Jesselyn"): keep the punctuation, drop the dash.
    .replace(/([.!?])[ \t]*[—–][ \t]*/g, "$1 ")
    // Otherwise it's a clause break or parenthetical ("Air — fastest"): a comma
    // is what a person types. Keep newlines intact (never span line breaks).
    .replace(/[ \t]*[—–][ \t]*/g, ", ")
    // Tidy up: no space before a comma, no doubled commas, single spaces, and
    // never leave a line starting with a comma (a line-leading dash became one).
    .replace(/ +,/g, ",")
    .replace(/,[ \t]*,/g, ", ")
    .replace(/(^|\n)[ \t]*,[ \t]*/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}
