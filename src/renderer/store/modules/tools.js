/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;

const actions = {
  // source: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Converting_a_digest_to_a_hex_string
  hashString({}, payload) {
      const encodedString = new TextEncoder().encode(payload.string); // encode as (utf-8) Uint8Array
      return crypto.subtle.digest(payload.algorithm, encodedString).then(
        hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return Promise.resolve(hashHexString)
        }
      );
  }
};

export default {
  namespaced,
  actions
}
