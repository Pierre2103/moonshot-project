// A simple nanoid implementation for generating unique IDs
const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export function nanoid(size = 21): string {
  let id = '';
  // A compact alternative to `for (var i = 0; i < size; i++)` 
  let i = size;
  while (i--) {
    // `| 0` is more compact and faster than `Math.floor()`
    id += urlAlphabet[(Math.random() * 64) | 0];
  }
  return id;
}