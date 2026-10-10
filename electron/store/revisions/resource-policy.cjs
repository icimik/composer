// Explicit fixed allocation chosen under the sender's scale/hardware-based delegation.
// Not a promise of unlimited history, a fraction of physical RAM, or a whole-workspace copy.
const resourcePolicy = Object.freeze({
  maxStagedBytes: 256 * 1024 * 1024,
  minFreeBytes: 256 * 1024 * 1024
});
module.exports = { resourcePolicy };
