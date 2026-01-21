describe("Dubby Demo", () => {
  it("uploads → generates → shows download link", () => {
    cy.visit("http://localhost:5173/");

    cy.fixture("sample.mp3", "binary")
      .then(Cypress.Blob.binaryStringToBlob)
      .then((blob) => {
        const file = new File([blob], "sample.mp3", { type: "audio/mpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);

        cy.get('[data-cy="file-input"]').then((input) => {
          const el = input[0] as HTMLInputElement;
          el.files = dt.files;
          cy.wrap(input).trigger("change", { force: true });
        });
      });

    cy.get('[data-cy="file-name"]').should("contain", "sample.mp3");
    cy.get('[data-cy="lang-select"]').select("French");
    cy.get('[data-cy="voice-select"]').select("Warm");
    cy.get('[data-cy="generate-btn"]').click();

    cy.get('[data-cy="status"]', { timeout: 12000 }).should("contain", "Done");
    cy.get('[data-cy="download-link"]')
      .should("have.attr", "href")
      .and("include", "/download");
  });
});
