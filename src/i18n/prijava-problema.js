// Interface text for the "Prijavi problem" form. Croatian only.
export const prijavaProblema = {
  naslov: "Prijavi problem",
  uvod: "Opišite što ne radi. Uz opis šaljemo samo vrstu preglednika, verziju aplikacije i stranicu s koje ste došli.",
  vrsta: "Vrsta problema",
  vrste: { technical: "Tehnički problem", account: "Račun i prijava", course: "Kolegij i zadaci" },
  opis: "Opis problema",
  brojac: (n, max) => `${n} od ${max} znakova`,
  posalji: "Pošalji prijavu",
  slanje: "Slanje…",
  potvrda: (ref) => `Prijava je zaprimljena. Broj prijave: ${ref}`,
  nova: "Nova prijava",
  greske: {
    neispravanUnos: "Opis mora imati od 1 do 1000 znakova, bez posebnih znakova za upravljanje.",
    previseOpisa: "Poslali ste previše prijava. Pokušajte ponovno kasnije.",
    zabranjeno: "Prijava nije poslana jer zahtjev nije došao s ove stranice. Osvježite stranicu i pokušajte ponovno.",
    nedostupno: "Poslužitelj trenutačno ne odgovara. Vaš tekst je sačuvan, pokušajte ponovno za nekoliko trenutaka.",
  },
};
