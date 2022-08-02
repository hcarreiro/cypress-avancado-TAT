/// <reference types="Cypress" />

describe('Hacker Stories', () => {

  // beforeEach 1
  beforeEach(() => {

    // Aqui estamos setando um ponto de interceptação onde vamos interceptar uma requisição
    //cy.intercept(
    // Tipo da requisição que estaremos monitorando
    //'GET',
    // Rota que estaremos monitorando
    //'**/search?query=React&page=0'
    // Daremos um alias para essa requisição
    //).as('getStories')

    // Nova implementação utilizando um objeto e query strings
    cy.intercept({
      // Método a ser monitorado
      method: 'GET',
      // path entre a urlBase e a query string
      pathname: '**/search',
      // Objeto query com query e page
      query: {
        query: 'React',
        page: '0'
      }
    }).as('getStories')


    // Acessamos a raiz do nosso sisitema
    cy.visit('/')
    // Damos um wait aguardando o @getStories que é o alias da requisição GET com o endereço declarados acima.
    cy.wait('@getStories')

    // Simulamos um cenário onde acessamos a aplicação e aguardamos o carregamento da página.

    // CÓDIGO DEFASADO
    //cy.assertLoadingIsShownAndHidden()
    //cy.contains('More').should('be.visible')
  })

  it('shows the footer', () => {
    cy.get('footer')
      .should('be.visible')
      .and('contain', 'Icons made by Freepik from www.flaticon.com')
  })

  context('List of stories', () => {
    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I assert on the data?
    // This is why this test is being skipped.
    // TODO: Find a way to test it out.
    it.skip('shows the right data for all rendered stories', () => { })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {

      // Faço uma interceptação quando identificar uma requisição com conteúdo descrito
      cy.intercept({
        // Método a ser monitorado
        method: 'GET',
        // path entre a urlBase e a query string
        pathname: '**/search',
        // Objeto query com query e page
        query: {
          query: 'React',
          // Valor 1 pois é o resultado quando clicamos no botão 'more'
          page: '1'
        }
      }).as('getNextStories')

      cy.get('.item').should('have.length', 20)

      cy.contains('More').click()

      // Novo comando para interceptar a requisição ao inves de usar outra validação Flaky
      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })

    it('shows only nineteen stories after dimissing the first story', () => {
      cy.get('.button-small')
        .first()
        .click()

      cy.get('.item').should('have.length', 19)
    })

    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I test ordering?
    // This is why these tests are being skipped.
    // TODO: Find a way to test them out.
    context.skip('Order by', () => {
      it('orders by title', () => { })

      it('orders by author', () => { })

      it('orders by comments', () => { })

      it('orders by points', () => { })
    })

    context('Errors', () => {

      const errorMessage = 'Something went wrong ...'

      it('shows "Something went wrong ..." in case of a server error', () => {

        // Geramos um cy.intercep para interceptar qualquer requisição GET para este endereço e retornar agora um status code 500
        cy.intercept(
          'GET',
          '**/search**',
          { statusCode: 500 }
        ).as('getServerFailure')

        // Acesso a home que já por padrão dá um GET por React e assim já temos um GET com um search
        cy.visit('/')
        // Interceptamos o search de acesso a home, e lançamos um status code 500
        cy.wait('@getServerFailure')

        // A aplicação neste caso exibe uma msg de erro a estamos validando se ela está visível
        cy.get(`p:contains(${errorMessage})`)
          .should('be.visible')
      })

      it('shows "Something went wrong ..." in case of a network error', () => {

        // Geramos um cy.intercep para interceptar qualquer requisição GET para este endereço e retornar agora um erro de rede
        cy.intercept(
          'GET',
          '**/search**',
          // Envia um erro simulando uma falha de rede
          { forceNetworkError: true }
        ).as('getNetworkFailure')

        // Acesso a home que já por padrão dá um GET por React e assim já temos um GET com um search
        cy.visit('/')
        // Interceptamos o search de acesso a home, e lançamos um erro de rede
        cy.wait('@getNetworkFailure')

        // A aplicação neste caso exibe uma msg de erro a estamos validando se ela está visível
        cy.get(`p:contains(${errorMessage})`)
          .should('be.visible')

      })

    })
  })

  context('Search', () => {
    const initialTerm = 'React'
    const newTerm = 'Cypress'

    // beroreEach 2
    beforeEach(() => {

      // Aqui estamos setando um ponto de interceptação onde vamos interceptar uma requisição
      cy.intercept(
        // Tipo da requisição que estaremos monitorando
        'GET',
        // Rota que estaremos monitorando
        `**/search?query=${newTerm}&page=0`
        // Daremos um alias para essa requisição
      ).as('getNewTermStories')

      cy.get('#search')
        .clear()
    })

    it('types and hits ENTER', () => {

      // Como ao acessar a aplicação já vem como default uma pesquisa por React
      // Precisamos limpar o valor do campo para uma nova pesquisa
      cy.get('#search')
        .type(`${newTerm}{enter}`)

      cy.wait('@getNewTermStories')

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('types and clicks the submit button', () => {
      cy.get('#search')
        .type(newTerm)
      cy.contains('Submit')
        .click()

      // Nova implementação
      cy.wait('@getNewTermStories')

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    // TESTE QUE NÃO REFLETE A AÇÃO DE UM USUÁRIO
    it('types and clicks the submit button', () => {
      cy.get('#search')
        .type(newTerm)

      // Em um cenário de simulação de usuário ELE NÃO REFLETE A REALIDADE pois um usuário não submete um formulário.
      cy.get('form').submit()

      cy.get('.item').should('have.length', 20)
    })

    context('Last searches', () => {

      it('searches via the last searched term', () => {
        cy.get('#search')
          .type(`${newTerm}{enter}`)

        // Nova implementação
        cy.wait('@getNewTermStories')

        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
          .click()

        cy.wait('@getStories')

        cy.get('.item').should('have.length', 20)
        cy.get('.item')
          .first()
          .should('contain', initialTerm)
        cy.get(`button:contains(${newTerm})`)
          .should('be.visible')
      })

      it('shows a max of 5 buttons for the last searched terms', () => {
        const faker = require('faker')

        cy.intercept(
          'GET',
          // Como serão requisições aleatórias, posso apenas validar se existe o GET com um search para "aguardar" este tipo de requisição
          '**/search**'
        ).as('getRandomStories')

        // Comando para executar o mesmo conteúdo 6x
        Cypress._.times(6, () => {
          cy.get('#search')
            .clear()
            .type(`${faker.random.word()}{enter}`)

          // Coloco o wait aqui para ele aguardar o carregamento da página ao final de cada execução
          cy.wait('@getRandomStories')
        })

        cy.get('.last-searches button')
          .should('have.length', 5)
      })
    })
  })
})
