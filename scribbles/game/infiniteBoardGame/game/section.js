import props from '../props';

/** Rows advanced when the pawn hits a section trigger. */
export function getSectionStride() {
  return Math.floor(props.boardHeight - props.boardPadding);
}

/** First padding cell offset from section start (triggers section advance). */
export function getSectionTriggerOffset() {
  return Math.floor(props.boardHeight - props.boardPadding);
}

/**
 * Path rows in each section's padding zone (the last boardPadding cells).
 * @param {number} y
 */
export function isAdvanceTriggerRow(y) {
  const stride = getSectionStride();
  const padding = Math.max(0, Math.floor(props.boardPadding));
  const first = getSectionTriggerOffset();
  if (stride <= 0 || padding <= 0 || y < first) return false;
  return ((y - first) % stride) < padding;
}

/** Next section-trigger row strictly ahead of fromY. */
export function getNextSectionTriggerY(fromY) {
  const first = getSectionTriggerOffset();
  const stride = getSectionStride();
  if (stride <= 0) return first;
  if (fromY < first) return first;
  const k = Math.floor((fromY - first) / stride);
  return first + (k + 1) * stride;
}
