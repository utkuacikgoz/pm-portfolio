declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      mesh: Omit<Record<string, unknown>, 'key' | 'ref'>;
      group: Omit<Record<string, unknown>, 'key' | 'ref'>;
      meshStandardMaterial: Omit<Record<string, unknown>, 'key' | 'ref'>;
      [key: string]: Omit<Record<string, unknown>, 'key' | 'ref'>;
    }
  }
}
