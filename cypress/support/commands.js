// Importação da bliblioteca que analisa o local storage do navegador
import 'cypress-localstorage-commands'


// Comando que verifica se o loading está visível e depois invisível
Cypress.Commands.add('assertLoadingIsShownAndHidden', () => {
  cy.contains('Loading ...').should('be.visible')
  cy.contains('Loading ...').should('not.exist')
})
