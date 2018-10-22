describe('Dashboard Collections Page', () => {
  const host = process.env.DASHBOARD_HOST || 'http://localhost:3000/';

  describe('When not logged in', () => {
    it('should redirect to login page', () => {
      cy.visit(`${host}#/collections`);
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

    it('displays a link to view collections', () => {
      cy.visit(host);

      cy.get('nav li a').contains('Collections').should('exist').as('collections');
      cy.get('@collections').should('have.attr', 'href', '#/collections');
      cy.get('@collections').click();

      cy.url().should('include', 'collections');
      cy.get('.heading--xlarge').should('have.text', 'Collections');

      cy.get('table tbody tr').its('length').should('be.gt', 1);
    });

    it('collections page displays a button to add a new collection', () => {
      cy.visit(`${host}/#collections`);

      cy.get('a').contains('Add a Collection').should('exist').as('addCollection');
      cy.get('@addCollection').should('have.attr', 'href', '#/collections/add');
      cy.get('@addCollection').click();

      // fill the form and submit
      // we need to use fake collection under test/fake-api-fixtures/collections, so the
      // verification would work
      const collection = '{{}"name":"MOD09GQ","version":"006","dataType":"MOD09GQ"}';
      cy.get('textarea').type(collection, {force: true});
      cy.get('form').get('input').contains('Submit').click();

      // displays the new collection
      cy.get('.heading--xlarge').should('have.text', 'Collections');
      cy.get('.heading--large').should('have.text', 'MOD09GQ / 006');
      cy.url().should('include', '#/collections/collection/MOD09GQ/006');
    });

    it('collection page has buttons to edit or delete the collection', () => {
      cy.visit(`${host}/#/collections/collection/MOD09GQ/006`);
      cy.get('a').contains('Edit').should('exist').as('editCollection');
      cy.get('@editCollection').should('have.attr', 'href').and('include', '#/collections/edit/MOD09GQ/006');
      cy.get('@editCollection').click();

      cy.get('.heading--large').should('have.text', 'Edit MOD09GQ___006');

      // cy.clear doesn't work for textarea, maybe it's related to https://github.com/cypress-io/cypress/issues/2056
      // const collection = '{{}"name":"MOD09GQ","version":"006","dataType":"MOD09GQ"}';
      // cy.get('textarea').clear({force: true}).type(collection, {force: true});
      cy.get('textarea').type(' ', {force: true});
      cy.get('form').get('input').contains('Submit').click();

      // displays the updated collection and its granules
      cy.get('.heading--xlarge').should('have.text', 'Collections');
      cy.get('.heading--large').should('have.text', 'MOD09GQ / 006');
      cy.get('table tbody tr').its('length').should('be.gt', 1);

      // delete collection
      cy.get('button').contains('Delete').should('exist').click();
      cy.get('button').contains('Confirm').click();

      // goes back to collections list
      cy.url().should('include', 'collections');
      cy.get('.heading--xlarge').should('have.text', 'Collections');
      cy.get('table tbody tr').its('length').should('be.gt', 1);
    });
  });
});
