/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const namespaced = true;
const crypto = require('crypto');

const actions = {
  /**
   * @param {Object} payload
   * @param {String} payload.algorithm - algorithm to use, to display supported list: console.log(crypto.getHashes())
   * @param {String} payload.string - string to hash.
   */
  hashString({}, payload) {
    return crypto.createHash(payload.algorithm).update(payload.string).digest("hex");
  },
  /**
   * @param {Object} payload
   * @param {String} payload.algorithm - Algorithm to use for the hash, to list available hash: console.log(crypto.getHashes())
   * @param {Object} payload.file - Node file Buffer object to hash.
   */
  hashFile({}, payload) {
    return crypto.createHash(payload.algorithm).update(payload.file).digest("hex");

  }
};

export default {
  namespaced,
  actions
}
