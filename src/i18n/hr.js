// Interface text. Croatian only; checked against Ductus docs/PRODUCT.md §5.
export const hr = {
  app: {
    name: "Ductura",
    variant: "Web",
    description: "Ductura za Firefox, Safari i ostale podržane preglednike na računalu",
  },
  popis: { naslov: "Moji dokumenti", prazno: "Još nemate dokumenata." },
  dokument: {
    ogranicenja: "U ovom sučelju možete čitati rad, uređivati običan tekst i spremati ga na poslužitelj. Za spremanje je potrebna internetska veza. Ovdje nisu dostupni oblikovanje teksta, zapis pisanja ni predaja rada.",
    naslov: "Naslov",
    sadrzaj: "Sadržaj",
    spremi: "Spremi",
    rijeci: (n) => `${n} riječi`,
    nedostupan: "Dokument nije dostupan.",
    natrag: "Natrag na popis",
    spremanje: {
      idle: "",
      dirty: "Nespremljene izmjene",
      saving: "Spremanje…",
      saved: "Spremljeno na poslužitelju",
      error: "Greška pri spremanju. Pokušajte ponovno gumbom Spremi.",
    },
  },
  greske: {
    nedostupan: "Poslužitelj trenutačno ne odgovara. Pokušajte ponovno za nekoliko trenutaka.",
    pokusajPonovno: "Pokušaj ponovno",
  },
};
