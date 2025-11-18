import { createStore } from './src/vanilla';

const store = createStore(() => ({
  count: 1,
  get doubled() {
    return this.count * 2;
  }
}));

console.log('Initial state:', store.getState());
console.log('Doubled:', store.getState().doubled);
console.log('Type of doubled:', typeof store.getState().doubled);

const descriptors = Object.getOwnPropertyDescriptors(store.getState());
console.log('Descriptor for doubled:', descriptors.doubled);

store.setState({ count: 5 });
console.log('\nAfter setState:');
console.log('State:', store.getState());
console.log('Doubled:', store.getState().doubled);
const descriptors2 = Object.getOwnPropertyDescriptors(store.getState());
console.log('Descriptor for doubled after:', descriptors2.doubled);