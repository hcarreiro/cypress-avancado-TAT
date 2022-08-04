/// <reference types="Cypress" />

describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'

  // Contexto para armazenar as batidas na API real
  context('Hitting the real API', () => {
    // beforeEach 1
    beforeEach(() => {

      // Nova implementação utilizando um objeto e query strings
      cy.intercept({
        // Método a ser monitorado
        method: 'GET',
        // path entre a urlBase e a query string
        pathname: '**/search',
        // Objeto query com query e page
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories')

      // Acessamos a raiz do nosso sisitema
      cy.visit('/')
      // Damos um wait aguardando o @getStories que é o alias da requisição GET com o endereço declarados acima.
      cy.wait('@getStories')
    })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      // Faço uma interceptação quando identificar uma requisição com conteúdo descrito
      cy.intercept({
        // Método a ser monitorado
        method: 'GET',
        // path entre a urlBase e a query string
        pathname: '**/search',
        // Objeto query com query e page
        query: {
          query: initialTerm,
          // Valor 1 pois é o resultado quando clicamos no botão 'more'
          page: '1'
        }
      }).as('getNextStories')

      cy.get('.item').should('have.length', 20)

      cy.contains('More')
        .should('be.visible')
        .click()

      // Novo comando para interceptar a requisição ao inves de usar outra validação Flaky
      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })

    it('searches via the last searched term', () => {
      // Aqui estamos setando um ponto de interceptação onde vamos interceptar uma requisição
      cy.intercept(
        // Tipo da requisição que estaremos monitorando
        'GET',
        // Rota que estaremos monitorando
        `**/search?query=${newTerm}&page=0`
        // Daremos um alias para essa requisição
      ).as('getNewTermStories')

      cy.get('#search')
        .should('be.visible')
        .clear()
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
        .should('be.visible')
        .and('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`)
        .should('be.visible')
    })
  })

  context('Mocking the API', () => {

    context('Footer and list of stories', () => {

      beforeEach(() => {
        cy.intercept(
        // Tipo da requisição que estaremos monitorando
          'GET',
          // Rota que estaremos monitorando
          `**/search?query=${initialTerm}&page=0`,
          { fixture: 'stories' }
          // Daremos um alias para essa requisição
        ).as('getStories')
  
        cy.visit('/')
        cy.wait('@getStories')
      })

      it('shows the footer', () => {
          cy.get('footer')
            .should('be.visible')
            .and('contain', 'Icons made by Freepik from www.flaticon.com')
      })

      context('List of stories', () => {

        // Importo a fixture como uma variável para vacilitar a comparação
        const stories = require('../fixtures/stories')

        it('shows the right data for all rendered stories', () => {

          // Damos um get em item que tem a lista de items
          cy.get('.item')
            // Pego o primeiro item
            .first()
            .should('be.visible')
            // Valido se o item contém o texto com o mesmo conteúdo da fixture 'title' entre outros campos
            .should('contain', stories.hits[0].title)
            .and('contain', stories.hits[0].author)
            .and('contain', stories.hits[0].num_comments)
            .and('contain', stories.hits[0].points)
          
          // Validamos que o elemento 'title' possui um atributo 'href' e que o valor dele é o valor esperado setado no mock
          cy.get(`.item a:contains(${stories.hits[0].title})`)
            .should('have.attr', 'href', stories.hits[0].url)

          // Damos um get em item que tem a lista de items
          cy.get('.item')
          // Pego o último item da lista (temos apenas 2 via mock)
          .last()
          .should('be.visible')
          .should('contain', stories.hits[1].title)
          .and('contain', stories.hits[1].author)
          .and('contain', stories.hits[1].num_comments)
          .and('contain', stories.hits[1].points)

          // Validamos que o elemento 'title' possui um atributo 'href' e que o valor dele é o valor esperado setado no mock
          cy.get(`.item a:contains(${stories.hits[1].title})`)
          .should('have.attr', 'href', stories.hits[1].url)
        })
  
        it('shows one less story after dimissing the first one', () => {
          // No beforeEach demos um intercept que vai retornar duas stories
          // Aqui vamos remover 1 delas
          cy.get('.button-small')
            .first()
            .should('be.visible')
            .click()
  
          // Agora validamos se temos apenas 1 visível, pois tinhamos 2 e removemos 1 nesse teste
          cy.get('.item').should('have.length', 1)
        })
      
        context('Order by', () => {
          it('orders by title', () => {

            // Dou um get no atributo e uso o ':contains(Title)' para caso haja outra classe com o mesmo nome, segmentar pelo conteúdo
            cy.get('.list-header-button:contains(Title)')
              // Como vou clicar neste botão outra vez, crio um alias para reutilização posterior  
              .as('titleHeader')
              .should('be.visible')
              // Primeiro clique não muda porque a lista já está naturalmente ordenada
              .click()

            // Dou um get na classe item que tem o resultado
            cy.get('.item')
              // Pego o primeiro
              .first()
              // Vejo se está visível
              .should('be.visible')
              // Valido se ele contém o texto do índice 0 da fixture que sei que é o primeiro na ordenação
              .and('contain', stories.hits[0].title)
            
            // Valido o link do item
            cy.get(`.item a:contains(${stories.hits[0].title})`)
              .should('have.attr', 'href', stories.hits[0].url)

            // Reutilização do seletor já descrito acima com alias 'as'
            cy.get('@titleHeader')
              // Segundo clique invertendo a ordenação
              .click()

            cy.get('.item')
              .first()
              .should('be.visible')
              .and('contain', stories.hits[1].title)
            
            cy.get(`.item a:contains(${stories.hits[1].title})`)
              .should('have.attr', 'href', stories.hits[1].url)
          })
  
          it('orders by author', () => {

            // Dou um get no atributo e uso o ':contains(Title)' para caso haja outra classe com o mesmo nome, segmentar pelo conteúdo
            cy.get('.list-header-button:contains(Author)')
            // Como vou clicar neste botão outra vez, crio um alias para reutilização posterior  
              .as('titleAuthor')
              .should('be.visible')
              // Primeiro clique não muda porque a lista já está naturalmente ordenada
              .click()

            // Dou um get na classe item que tem o resultado
            cy.get('.item')
              // Pego o primeiro
              .first()
              // Vejo se está visível
              .should('be.visible')
              // Valido se ele contém o texto do índice 0 da fixture que sei que é o primeiro na ordenação
              .and('contain', stories.hits[0].author)

            // Reutilização do seletor já descrito acima com alias 'as'
            cy.get('@titleAuthor')
              // Segundo clique invertendo a ordenação
              .click()

            cy.get('.item')
              .first()
              .should('be.visible')
              .and('contain', stories.hits[1].author)
          })
  
          it('orders by comments', () => {

            // Dou um get no atributo e uso o ':contains(Title)' para caso haja outra classe com o mesmo nome, segmentar pelo conteúdo
            cy.get('.list-header-button:contains(Comments)')
              // Como vou clicar neste botão outra vez, crio um alias para reutilização posterior  
              .as('titleComments')
              .should('be.visible')
              // Primeiro clique já altera a ordenação
              .click()

            // Dou um get na classe item que tem o resultado
            cy.get('.item')
              // Pego o primeiro
              .first()
              // Vejo se está visível
              .should('be.visible')
              // Valido se ele contém o texto do índice 0 da fixture que sei que é o primeiro na ordenação
              .and('contain', stories.hits[1].num_comments)

            // Reutilização do seletor já descrito acima com alias 'as'
            cy.get('@titleComments')
              // Segundo clique invertendo a ordenação
              .click()

            cy.get('.item')
              .first()
              .should('be.visible')
              .and('contain', stories.hits[0].num_comments)
          })
  
          it('orders by points', () => {
            // Dou um get no atributo e uso o ':contains(Title)' para caso haja outra classe com o mesmo nome, segmentar pelo conteúdo
            cy.get('.list-header-button:contains(Points)')
              // Como vou clicar neste botão outra vez, crio um alias para reutilização posterior  
              .as('titlePoints')
              .should('be.visible')
              /// Primeiro clique já altera a ordenação
              .click()

            // Dou um get na classe item que tem o resultado
            cy.get('.item')
              // Pego o primeiro
              .first()
              // Vejo se está visível
              .should('be.visible')
              // Valido se ele contém o texto do índice 0 da fixture que sei que é o primeiro na ordenação
              .and('contain', stories.hits[1].points)

            // Reutilização do seletor já descrito acima com alias 'as'
            cy.get('@titlePoints')
              // Segundo clique invertendo a ordenação
              .click()

            cy.get('.item')
              .first()
              .should('be.visible')
              .and('contain', stories.hits[0].points)
          })
        })
      })
    })

    context('Search', () => {
      // beroreEach 2
      beforeEach(() => {
        // Aqui estamos setando um ponto de interceptação onde vamos interceptar uma requisição
        cy.intercept(
          // Tipo da requisição que estaremos monitorando
          'GET',
          // Rota que estaremos monitorando
          `**/search?query=${initialTerm}&page=0`,
          { fixture: 'empty' }
          // Daremos um alias para essa requisição
          ).as('getEmptyStories')

        // Aqui estamos setando um ponto de interceptação onde vamos interceptar uma requisição
        cy.intercept(
          // Tipo da requisição que estaremos monitorando
          'GET',
          // Rota que estaremos monitorando
          `**/search?query=${newTerm}&page=0`,
          { fixture: 'stories' }
          // Daremos um alias para essa requisição
          ).as('getStories')

        cy.visit('/')
        cy.wait('@getEmptyStories')

        cy.get('#search')
          .should('be.visible')
          .clear()
      })

      it('shows no story when none is returned', () => {

        cy.get('.item')
          .should('not.exist')
      })

      it('types and hits ENTER', () => {
      // Como ao acessar a aplicação já vem como default uma pesquisa por React
      // Precisamos limpar o valor do campo para uma nova pesquisa
      cy.get('#search')
        .should('be.visible')
        .type(`${newTerm}{enter}`)

      cy.wait('@getStories')

      cy.get('.item').should('have.length', 2)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
      })

      // TESTE QUE NÃO REFLETE A AÇÃO DE UM USUÁRIO
      it('types and clicks the submit button', () => {
        cy.get('#search')
          .should('be.visible')
          .type(newTerm)

        // Em um cenário de simulação de usuário ELE NÃO REFLETE A REALIDADE pois um usuário não submete um formulário.
        cy.get('form')
          .should('be.visible')
          .submit()

        cy.get('.item').should('have.length', 2)
      })

      context('Last searches', () => {

        it('shows a max of 5 buttons for the last searched terms', () => {
          const faker = require('faker')

          cy.intercept(
            'GET',
            // Como serão requisições aleatórias, posso apenas validar se existe o GET com um search para "aguardar" este tipo de requisição
            '**/search**',
            // Passo uma fixture vazia assim dou muito mais performance ao teste onde eu como eu não vou validar o conteúdo
            // não preciso me preocupar em popular a lista vou só validar se aparece os botões de pesquisas
            { fixture: 'empty' }
          ).as('getRandomStories')

          // Comando para executar o mesmo conteúdo 6x
          Cypress._.times(6, () => {
            cy.get('#search')
              /* NÃO TEMOS UM .should('be.visible') PORQUE NÃO HOUVE REFRESH E JÁ FOI FEITO NO beforeEach */
              .clear()
              .type(`${faker.random.word()}{enter}`)

            // Coloco o wait aqui para ele aguardar o carregamento da página ao final de cada execução
            cy.wait('@getRandomStories')
          })

          //cy.get('.last-searches button') - REFATORADO ABAIXO
          //.should('have.length', 5) - REFATORADO ABAIXO

          // Damos um get na classe last-searches como classe pai
          cy.get('.last-searches')
            // Usamos a função de callback within para fazer uma busca dentro da classe
            .within(() => {
              // Damos um get em todos os botões dentro da classe pai
              cy.get('button')
                // E a quantidade de botões deve ser igual a 5
                .should('have.length', 5)
            })
        })
      })
    })
  })
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
