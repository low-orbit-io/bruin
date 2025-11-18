const { createStore } = require('./src/vanilla.ts');

const store = createStore(() => ({
  count: 0,
  hovering: false
}));

console.log('Initial:', store.getState());

store.setState({ count: 1 });
console.log('After count:1:', store.getState());

store.setState({ hovering: true }, false, { skipHistory: true });
console.log('After hovering:true (skipped):', store.getState());

store.setState({ count: 2 });
console.log('After count:2:', store.getState());

console.log('History:', store.getHistory().map(h => h.state));

store.undo();
console.log('After undo:', store.getState());