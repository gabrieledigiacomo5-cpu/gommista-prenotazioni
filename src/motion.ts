// "?motion" nell'indirizzo forza l'animazione (solo per le prove: ignora l'impostazione "riduci animazioni" del sistema)
export const reducedMotion = () => !new URLSearchParams(window.location.search).has('motion')
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
