describe('Dashboard Providers Page', () => {
  const host = process.env.DASHBOARD_HOST || 'http://localhost:3000/';

  describe('When not logged in', () => {
    it('should redirect to login page', () => {
      cy.visit(`${host}#/providers`);
      cy.url().should('include', '/#/auth');
      cy.get('div[class=modal__internal]').within(() => {
        cy.get('a').should('have.attr', 'href').and('include', 'token?');
        cy.get('a').should('have.text', 'Login with Earthdata Login');
      });
    });
  });

  describe('When logged in', () => {
    beforeEach(() => {
      cy.login(host);
    });

    it('displays a link to view providers', () => {
      cy.visit(host);

      cy.get('nav li a').contains('Providers').should('exist').as('providers');
      cy.get('@providers').should('have.attr', 'href', '#/providers');
      cy.get('@providers').click();

      cy.url().should('include', 'providers');
      cy.get('.heading--xlarge').should('have.text', 'Providers');

      cy.get('table tbody tr').its('length').should('be.gt', 1);
    });

    it('providers page displays a button to add a new provider', () => {
      cy.visit(`${host}/#providers`);

      cy.get('a').contains('Add a Provider').should('exist').as('addProvider');
      cy.get('@addProvider').should('have.attr', 'href', '#/providers/add');
      cy.get('@addProvider').click();

      cy.get('.heading--xlarge').should('have.text', 'Providers');
      cy.get('.heading--large').should('have.text', 'Create a provider');

      // fill the form and submit
      // we need to use fake provider under test/fake-api-fixtures/providers, so the
      // verification would work
      cy.get('form div ul').as('providerinput');
      cy.get('@providerinput').contains('Provider Name').siblings('input').type('s3_provider');
      cy.get('@providerinput').contains('Concurrent Connnection Limit').siblings('input').clear().type(5);
      cy.get('@providerinput').contains('Protocol').siblings().children('select').select('s3').should('have.value', 's3');
      cy.get('@providerinput').contains('Host').siblings('input').type('cumulus-test-sandbox-internal');

      cy.get('form div input[value=Submit]').click();

      // displays the new provider
      cy.get('.heading--xlarge').should('have.text', 'Providers');
      cy.get('.heading--large').should('have.text', 's3_provider');
      cy.url().should('include', '#/providers/provider/s3_provider');
    });

    it('provider page has buttons to edit or delete the provider', () => {
      cy.visit(`${host}/#/providers/provider/s3_provider`);
      cy.get('.heading--large').should('have.text', 's3_provider');
      cy.get('a').contains('Edit').should('exist').as('editprovider');
      cy.get('@editprovider').should('have.attr', 'href').and('include', '#/providers/edit/s3_provider');
      cy.get('@editprovider').click();

      cy.get('.heading--large').should('have.text', 'Edit s3_provider');

      cy.get('form div ul').as('providerinput');
      cy.get('@providerinput').contains('Concurrent Connnection Limit').siblings('input').clear().type(12);
      cy.get('@providerinput').contains('Host').siblings('input').clear().type('cumulus-test-sandbox-internal-new');

      cy.get('form div input[value=Submit]').click();

      // displays the updated provider
      cy.get('.heading--xlarge').should('have.text', 'Providers');
      cy.get('.heading--large').should('have.text', 's3_provider');

      // delete provider
      cy.get('.dropdown__options__btn').click();
      cy.get('span').contains('Delete').click();
      cy.get('button').contains('Confirm').click();

      // goes back to providers list
      cy.url().should('include', 'providers');
      cy.get('.heading--xlarge').should('have.text', 'Providers');
      cy.get('table tbody tr').its('length').should('be.gt', 1);
    });
  });
});
