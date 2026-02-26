// Fix React 19 JSX compatibility with React Native libraries
// React 19 changed component types, older RN libs haven't updated yet
// This declaration merges the missing 'refs' property

import 'react';

declare module 'react' {
  interface Component<P = {}, S = {}, SS = any> {
    refs: { [key: string]: any };
  }
}
