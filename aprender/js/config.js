/* BFit · Área de Aprendizado — configuração
 * Para ligar o backend real (Supabase), preencha as duas chaves abaixo.
 * Vazias => MODO DEMONSTRAÇÃO (dados só no navegador, faixa dourada visível).
 * A anon key do Supabase é pública por desenho; a segurança vem das políticas RLS e das RPCs.
 */
window.BFIT_CONFIG = {
  SUPABASE_URL: "https://vuwtbtabvtmzclhqjbjf.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_PbFtGugyEN9IIOCYI1Il5w_u0YkiQxh",
  MAX_TENTATIVAS: 3,
  NOTA_MINIMA: 7,
  TOTAL_MODULOS: 10,
  /* Mostrar o gabarito (alternativa correta + explicação) mesmo quando reprovado e ainda há tentativas? */
  MOSTRAR_GABARITO_SE_REPROVADO: true
};
/* ?mock=1 força o modo demonstração só para testes locais (precisa do mock-key.js local, que nunca é publicado). */
window.BFIT_MOCK = (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]mock=1\b/.test(location.search)) || !(window.BFIT_CONFIG.SUPABASE_URL && window.BFIT_CONFIG.SUPABASE_ANON_KEY);
