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
  zadaci: {
    naslov: "Moji zadaci",
    prazno: "Još nemate kolegija ni zadataka.",
    kolegijBezZadatka: "Za ovaj kolegij nema zadataka.",
    rok: "Rok",
    obavijestPrvo: "Prije rada pročitajte obavijest.",
    nemaPristupa: "Popis zadataka nije dostupan ovom računu.",
    stanje: {
      not_started: "Rad nije započet",
      in_progress: "Rad je u tijeku",
      submitted: "Rad je predan",
    },
  },
  greske: {
    nedostupan: "Poslužitelj trenutačno ne odgovara. Pokušajte ponovno za nekoliko trenutaka.",
    pokusajPonovno: "Pokušaj ponovno",
  },
};
