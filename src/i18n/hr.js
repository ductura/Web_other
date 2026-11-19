// Interface text. Croatian only; checked against Ductus docs/PRODUCT.md §5.
export const hr = {
  app: {
    name: "Ductura",
    variant: "Web",
    description: "Ductura za Firefox, Safari, Edge, Operu i ostale preglednike na računalu",
  },
  popis: { naslov: "Moji dokumenti", prazno: "Još nemate dokumenata." },
  dokument: {
    naslov: "Naslov",
    sadrzaj: "Sadržaj",
    spremi: "Spremi",
    rijeci: (n) => `${n} riječi`,
    nedostupan: "Dokument nije dostupan.",
    natrag: "Natrag na popis",
  },
  greske: {
    nedostupan: "Poslužitelj trenutačno ne odgovara. Pokušajte ponovno za nekoliko trenutaka.",
    pokusajPonovno: "Pokušaj ponovno",
  },
};
