// Módulo vazio para substituir react-refresh e evitar erros
// Este módulo é usado para desabilitar completamente o React Refresh

// Definir funções vazias para React Refresh
if (typeof window !== 'undefined') {
  window.$RefreshReg$ = function() {};
  window.$RefreshSig$ = function() { return function() {}; };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
}

// Exportar funções vazias
module.exports = {
  register: function() {},
  createSignatureFunctionForTransform: function() { return function() {}; },
  isLikelyComponentType: function() { return false; },
  getFamilyByType: function() { return undefined; },
  getFamilyByID: function() { return undefined; },
  findAffectedHostInstances: function() { return []; },
  injectIntoGlobalHook: function() {},
  hasUnrecoverableErrors: function() { return false; },
  performReactRefresh: function() { return null; },
};

// Para compatibilidade com diferentes formatos de importação
if (typeof exports !== 'undefined') {
  Object.assign(exports, module.exports);
}{}