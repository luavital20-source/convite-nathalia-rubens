/**
 * Tabela OFICIAL de presentes (fonte de verdade dos preços).
 *
 * O valor cobrado no cartão vem SEMPRE daqui — nunca do navegador.
 * Isso impede que alguém troque o preço pelo DevTools e pague R$ 1
 * por uma cota de R$ 5.000.
 *
 * Ao alterar um preço, altere TAMBÉM no card correspondente do
 * index.html (o `data-valor` do botão Pix daquela cota, que é só
 * para exibição). A ordem aqui precisa bater com a ordem dos cards.
 */

const PRESENTES = [
  { id: 1,  nome: 'Petiscos gourmet da Florida',                            valor: 100 },
  { id: 2,  nome: 'Camarote do Safadão',                                     valor: 1000 },
  { id: 3,  nome: 'Café da manhã na cama para os recém-casados',            valor: 250 },
  { id: 4,  nome: 'Ingresso para o próximo Fortal',                          valor: 900 },
  { id: 5,  nome: 'Uma taça de vinho para brindar o amor',                   valor: 150 },
  { id: 6,  nome: 'Um jantar sem falar da organização do casamento',         valor: 300 },
  { id: 7,  nome: 'Degustação de vinhos para especialistas de Instagram',    valor: 450 },
  { id: 8,  nome: 'Sobremesa romântica sem dividir a última colherada',      valor: 200 },
  { id: 9,  nome: 'Jantar dos 12 anos de amor',                              valor: 2000 },
  { id: 10, nome: 'Massagem para recuperar as energias da noiva',           valor: 350 },
  { id: 11, nome: 'Terapia pós-casamento: “e agora?”',                       valor: 400 },
  { id: 12, nome: 'Uma dose extra de paciência para os noivos',             valor: 70 },
  { id: 13, nome: 'Café italiano para começar o dia apaixonados',          valor: 90 },
  { id: 14, nome: 'Sorvete para sobreviver ao calor da lua de mel',         valor: 100 },
  { id: 15, nome: 'Almoço romântico com vista inesquecível',               valor: 500 },
  { id: 16, nome: 'Dia de luxo sem olhar a fatura',                          valor: 1500 },
  { id: 17, nome: 'Passeio inesquecível na lua de mel',                     valor: 2500 },
  { id: 18, nome: 'Terapia preventiva para discutir onde jantar',           valor: 180 },
  { id: 19, nome: 'Gelato para dividir sem brigar pelo sabor',              valor: 80 },
  { id: 20, nome: 'Passeio sem GPS e sem discutir o caminho',              valor: 600 },
  { id: 21, nome: 'Experiência VIP para colecionar histórias',             valor: 3500 },
  { id: 22, nome: 'Final de semana romântico digno de filme',              valor: 4500 },
  { id: 23, nome: 'Cota Premium da Lua de Mel NR',                          valor: 5000 },
  { id: 24, nome: 'Jantar especial de lua de mel',                          valor: 800 },
  { id: 25, nome: 'Patrocine uma lembrança para contarmos aos netos',      valor: 4000 },
  { id: 26, nome: 'Passeio privativo para os apaixonados',                 valor: 1200 },
  { id: 27, nome: 'Spa completo para o casal',                              valor: 1500 },
  { id: 28, nome: 'Reserva para nossa próxima aventura em família',        valor: 1800 },
  { id: 29, nome: 'Upgrade para uma suíte dos sonhos',                      valor: 3000 },
  { id: 30, nome: 'Experiência gastronômica para virar indicação da Nath', valor: 1000 },
  { id: 31, nome: 'Massagem para o noivo sobreviver aos preparativos',     valor: 350 },
  { id: 32, nome: 'Upgrade estratégico para evitar perrengues',            valor: 700 },
];

function buscarPresente(id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  return PRESENTES.find((p) => p.id === n) || null;
}

module.exports = { PRESENTES, buscarPresente };
