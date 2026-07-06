'use strict';

function getRuntimeCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasProcess = typeof process !== 'undefined' && Boolean(process.versions?.node);

  return {
    runtime: hasWindow ? 'browser' : hasProcess ? 'node' : 'unknown',
    canUseDom: hasWindow && typeof document !== 'undefined',
    canUseFileSystem: hasProcess
  };
}

console.log(getRuntimeCapabilities());
