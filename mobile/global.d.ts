// JSX.ElementClass in @types/react@19 requires `render(): ReactNode`, which
// React Native 0.81's built-in class components (View, Text, ScrollView, etc.)
// do not explicitly satisfy under strict TypeScript. Relax the constraint so
// RN primitives type-check. Build/runtime behavior is unchanged.

import 'react';

declare module 'react' {
  namespace JSX {
    interface ElementClass {}
  }
}

declare global {
  namespace JSX {
    interface ElementClass {}
  }
}

export {};
