/* XOR MLP: explicit forward pass, analytical backpropagation and Adam/SGD.
 * W[input][hidden]; parameters ordered W row-major, b_hidden, v, b_output.
 * Float64 JavaScript numbers. No framework, network request or fitted animation.
 */
(function (root) {
  'use strict';
  const X = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const Y = [0, 1, 1, 0];
  const defaults = {hidden: 2, activation: 'sigmoid', optimizer: 'adam', lr: 0.03, epochs: 300, init: 'course', seed: 42};
  const sigmoid = x => x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
  const softplus = x => Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x)));
  function random(seed) {
    let s = seed >>> 0;
    return () => {s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;};
  }
  class MLP {
    constructor(config = {}) {
      this.config = {...defaults, ...config};
      const c = this.config, h = c.hidden;
      if (![0, 2, 4, 8].includes(h)) throw new Error('Unsupported hidden size');
      this.names = h === 0 ? ['w₁', 'w₂', 'bₒ'] : [
        ...[0, 1].flatMap(i => Array.from({length: h}, (_, j) => `W[${i + 1},${j + 1}]`)),
        ...Array.from({length: h}, (_, j) => `bₕ[${j + 1}]`),
        ...Array.from({length: h}, (_, j) => `v[${j + 1}]`), 'bₒ'];
      if (h === 2 && c.init === 'course') this.p = [2, -2, -2, 2, -1, -1, 3, 3, -2.5];
      else {
        const rng = random(c.seed);
        this.p = h === 0 ? [0, 0, 0] : [
          ...Array.from({length: 2 * h}, () => (rng() * 2 - 1) * Math.sqrt(6 / (2 + h))),
          ...Array(h).fill(0),
          ...Array.from({length: h}, () => (rng() * 2 - 1) * Math.sqrt(6 / (h + 1))), 0];
      }
      this.initial = [...this.p]; this.m = this.p.map(() => 0); this.v = [...this.m]; this.epoch = 0;
    }
    forward(x) {
      const h = this.config.hidden, p = this.p;
      if (!h) {const z = x[0] * p[0] + x[1] * p[1] + p[2]; return {hidden: [], z, prob: sigmoid(z)};}
      const hidden = Array.from({length: h}, (_, j) => {
        const z = x[0] * p[j] + x[1] * p[h + j] + p[2 * h + j];
        return this.config.activation === 'tanh' ? Math.tanh(z) : sigmoid(z);
      });
      const z = hidden.reduce((s, a, j) => s + a * p[3 * h + j], p[4 * h]);
      return {hidden, z, prob: sigmoid(z)};
    }
    evaluate() {
      const grad = this.p.map(() => 0), h = this.config.hidden;
      let loss = 0, correct = 0;
      const predictions = X.map((x, i) => {
        const f = this.forward(x), delta = (f.prob - Y[i]) / X.length;
        loss += (softplus(f.z) - Y[i] * f.z) / X.length;
        correct += Number(Number(f.prob >= 0.5) === Y[i]);
        if (!h) {grad[0] += delta * x[0]; grad[1] += delta * x[1]; grad[2] += delta;}
        else {
          grad[4 * h] += delta;
          f.hidden.forEach((a, j) => {
            grad[3 * h + j] += delta * a;
            const dh = delta * this.p[3 * h + j] * (this.config.activation === 'tanh' ? 1 - a * a : a * (1 - a));
            grad[j] += dh * x[0]; grad[h + j] += dh * x[1]; grad[2 * h + j] += dh;
          });
        }
        return {...f, x, target: Y[i], label: Number(f.prob >= 0.5)};
      });
      return {loss, accuracy: correct / X.length, grad, predictions};
    }
    snapshot() {return {epoch: this.epoch, p: [...this.p], ...this.evaluate()};}
    step() {
      const {grad} = this.evaluate(), c = this.config;
      this.epoch++;
      this.p = this.p.map((p, i) => {
        if (c.optimizer === 'sgd') return p - c.lr * grad[i];
        this.m[i] = 0.9 * this.m[i] + 0.1 * grad[i];
        this.v[i] = 0.999 * this.v[i] + 0.001 * grad[i] ** 2;
        const mh = this.m[i] / (1 - 0.9 ** this.epoch), vh = this.v[i] / (1 - 0.999 ** this.epoch);
        return p - c.lr * mh / (Math.sqrt(vh) + 1e-8);
      });
      if (!this.p.every(Number.isFinite)) throw new Error('Non-finite parameters');
      return this.snapshot();
    }
  }
  function train(config = {}) {
    const model = new MLP(config), history = [model.snapshot()];
    for (let i = 0; i < model.config.epochs; i++) history.push(model.step());
    return {config: model.config, history, names: model.names, initial: model.initial};
  }
  const api = {MLP, train, X, Y, defaults, sigmoid};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MLPLab = api;
})(typeof window !== 'undefined' ? window : globalThis);
