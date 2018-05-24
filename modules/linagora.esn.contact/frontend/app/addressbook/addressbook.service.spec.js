'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookService service', function() {
  var $rootScope;
  var contactAddressbookService, ContactAPIClient, session;
  var CONTACT_ADDRESSBOOK_EVENTS, CONTACT_SHARING_INVITE_STATUS;

  beforeEach(function() {
    module('linagora.esn.contact');
    module(function($provide) {
      ContactAPIClient = {};
      session = {
        user: {
          _id: '123'
        },
        ready: {
          then: angular.noop
        }
      };

      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('session', session);
    });
    inject(function(
      _$rootScope_,
      _contactAddressbookService_,
      _CONTACT_ADDRESSBOOK_EVENTS_,
      _CONTACT_SHARING_INVITE_STATUS_
    ) {
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
      CONTACT_ADDRESSBOOK_EVENTS = _CONTACT_ADDRESSBOOK_EVENTS_;
      CONTACT_SHARING_INVITE_STATUS = _CONTACT_SHARING_INVITE_STATUS_;
    });
  });

  describe('The listAddressbooks function', function() {
    it('should call contactAPIClient to list addressbooks', function() {
      var listSpy = sinon.spy();

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      };

      contactAddressbookService.listAddressbooks();

      expect(listSpy).to.have.been.calledWith({
        personal: true,
        subscribed: true,
        shared: true,
        inviteStatus: CONTACT_SHARING_INVITE_STATUS.ACCEPTED
      });
    });
  });

  describe('The getAddressbookByBookName function', function() {
    it('should call contactAPIClient to get an addressbook with given bookName', function() {
      var getSpy = sinon.spy();

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(name) {
            expect(name).to.equal('contacts');

            return {
              get: getSpy
            };
          }
        };
      };

      contactAddressbookService.getAddressbookByBookName('contacts');

      expect(getSpy).to.have.been.called;
    });
  });

  describe('The createAddressbook function', function() {
    it('should reject if there is no addressbook', function(done) {
      contactAddressbookService
        .createAddressbook()
        .catch(function(err) {
          expect(err.message).to.equal('Address book is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if there is no addressbook\'s name', function(done) {
      contactAddressbookService
        .createAddressbook({})
        .catch(function(err) {
          expect(err.message).to.equal('Address book\'s name is required');
          done();
        });

      $rootScope.$digest();
    });

    it('should reject if failed to create addressbook', function(done) {
      var addressbook = { name: 'test' };
      var createSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .catch(function() {
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to create addressbook', function(done) {
      var addressbook = { name: 'test' };
      var createSpy = sinon.stub().returns($q.when({}));

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: createSpy
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .then(function() {
          expect(createSpy).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });

    it('should broadcast event if success to create addressbook', function(done) {
      var addressbook = { name: 'test' };

      $rootScope.$broadcast = sinon.spy();
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              create: function() {
                return $q.when({});
              }
            };
          }
        };
      };

      contactAddressbookService
        .createAddressbook(addressbook)
        .then(function() {
          expect($rootScope.$broadcast).to.have.been.calledOnce;
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });

  describe('The removeAddressbook function', function() {
    it('should reject if removing addressbook failed', function(done) {
      var addressbook = {
        bookName: 'toto'
      };
      var removeSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              remove: removeSpy
            };
          }
        };
      };

      contactAddressbookService
        .removeAddressbook(addressbook)
        .catch(function() {
          expect(removeSpy).to.have.been.called;
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve and broadcast event when successfully removing addressbook', function(done) {
      var addressbook = {
        bookName: 'toto'
      };
      var removeSpy = sinon.stub().returns($q.when());

      $rootScope.$broadcast = sinon.spy();
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              remove: removeSpy
            };
          }
        };
      };

      contactAddressbookService
        .removeAddressbook(addressbook)
        .then(function() {
          expect(removeSpy).to.have.been.calledOnce;
          expect($rootScope.$broadcast).to.have.been.calledWith(CONTACT_ADDRESSBOOK_EVENTS.DELETED, addressbook);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The updateAddressbook function', function() {
    it('should reject if updating addressbook failed', function(done) {
      var addressbook = {
        name: 'toto',
        bookName: 'tata'
      };
      var updateSpy = sinon.stub().returns($q.reject());

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              update: updateSpy
            };
          }
        };
      };

      contactAddressbookService
        .updateAddressbook(addressbook)
        .catch(function() {
          expect(updateSpy).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve and broadcast event when successfully updating addressbook', function(done) {
      var addressbook = {
        name: 'toto',
        bookName: 'tata'
      };
      var updateSpy = sinon.stub().returns($q.when());

      $rootScope.$broadcast = sinon.spy();
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbook.bookName);

            return {
              update: updateSpy
            };
          }
        };
      };

      contactAddressbookService
        .updateAddressbook(addressbook)
        .then(function() {
          expect(updateSpy).to.have.been.calledWith(addressbook);
          expect($rootScope.$broadcast).to.have.been.calledWith(CONTACT_ADDRESSBOOK_EVENTS.UPDATED, addressbook);
          done();
        })
        .catch(done);

      $rootScope.$digest();
    });
  });

  describe('The listSubscribableAddressbooks function', function() {
    it('should call ContactAPIClient with public param to get subscribable address book list of given bookId', function() {
      var listSpy = sinon.spy();
      var bookId = '123';

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal('123');

        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      };
      contactAddressbookService.listSubscribableAddressbooks(bookId);

      expect(listSpy).to.have.been.calledWith({ public: true });
    });
  });

  describe('The listSubscribedAddressbooks function', function() {
    it('should call ContactAPIClient with subscribed param to get subscribed address books of current user', function() {
      var listSpy = sinon.spy();

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function() {
            return {
              list: listSpy
            };
          }
        };
      };
      contactAddressbookService.listSubscribedAddressbooks();

      expect(listSpy).to.have.been.calledWith({ subscribed: true });
    });
  });

  describe('The subscribeAddressbooks function', function() {
    var addressbookSpy;

    beforeEach(function() {
      addressbookSpy = sinon.stub();
      ContactAPIClient.addressbookHome = sinon.stub().returns({
        addressbook: addressbookSpy
      });
    });

    describe('subscribe to public address book', function() {
      it('should call ContactAPIClient with formatted subscription to subscribe to public address books', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            _links: {
              self: {
                href: '/addressbooks/123/456.vcf'
              }
            }
          }
        ];
        var createSpy = sinon.stub().returns($q.when());

        addressbookSpy.returns({
          create: createSpy
        });

        contactAddressbookService.subscribeAddressbooks(addressbookShells);
        $rootScope.$digest();

        expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(session.user._id);
        expect(addressbookSpy).to.have.been.calledWith();
        expect(createSpy).to.have.been.calledWith({
          description: addressbookShells[0].description,
          name: addressbookShells[0].name,
          type: 'subscription',
          'openpaas:source': {
            _links: {
              self: {
                href: addressbookShells[0].href
              }
            }
          }
        });
      });

      it('should broadcast event if success to subscribe to a public address book', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            _links: {
              self: {
                href: '/addressbooks/123/456.vcf'
              }
            }
          }
        ];
        var createdAddressbook = {
          name: 'you created me'
        };
        var createSpy = sinon.stub().returns($q.when(createdAddressbook));

        addressbookSpy.returns({
          create: createSpy
        });

        // somehow, $rootScope.$broadcast is called when digest is triggered. So I trigger
        // digest to 'flush' the pending call before mocking $rootScope.$broadcast
        $rootScope.$digest();
        $rootScope.$broadcast = sinon.spy();

        contactAddressbookService.subscribeAddressbooks(addressbookShells);

        $rootScope.$digest();
        expect($rootScope.$broadcast).to.have.been.calledWith(
          CONTACT_ADDRESSBOOK_EVENTS.CREATED,
          createdAddressbook
        );
      });
    });

    describe('subscribe to delegated (shared) address book', function() {
      var CONTACT_SHARING_SUBSCRIPTION_TYPE;

      beforeEach(inject(function(_CONTACT_SHARING_SUBSCRIPTION_TYPE_) {
        CONTACT_SHARING_SUBSCRIPTION_TYPE = _CONTACT_SHARING_SUBSCRIPTION_TYPE_;
      }));

      it('should call ContactAPIClient to accept shared address books', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            bookName: 'bookName',
            bookId: 'bookId',
            subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
            source: {
              name: 'source name'
            }
          }
        ];
        var acceptSpy = sinon.stub().returns($q.when());

        addressbookSpy.returns({
          acceptShare: acceptSpy
        });

        contactAddressbookService.subscribeAddressbooks(addressbookShells);
        $rootScope.$digest();

        expect(ContactAPIClient.addressbookHome).to.have.been.calledWith(addressbookShells[0].bookId);
        expect(addressbookSpy).to.have.been.calledWith(addressbookShells[0].bookName);
        expect(acceptSpy).to.have.been.calledWith({
          displayname: addressbookShells[0].source.name
        });
      });

      it('should broadcast event if success to accept shared address book', function() {
        var addressbookShells = [
          {
            description: '',
            name: 'public addressbook1',
            bookName: 'bookName',
            bookId: 'bookId',
            subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
            source: {
              name: 'source name'
            }
          }
        ];
        var acceptSpy = sinon.stub().returns($q.when());
        var createdAddressbook = {
          name: addressbookShells[0].source.name
        };

        addressbookSpy.returns({
          acceptShare: acceptSpy
        });

        // somehow, $rootScope.$broadcast is called when digest is triggered. So I trigger
        // digest to 'flush' the pending call before mocking $rootScope.$broadcast
        $rootScope.$digest();
        $rootScope.$broadcast = sinon.spy();

        contactAddressbookService.subscribeAddressbooks(addressbookShells);

        $rootScope.$digest();
        expect($rootScope.$broadcast).to.have.been.calledWith(
          CONTACT_ADDRESSBOOK_EVENTS.CREATED,
          sinon.match(createdAddressbook)
        );
      });
    });
  });

  describe('The shareAddressbook function', function() {
    it('should call the ContactAPIClient with the addressbook shell containing sharees information', function(done) {
      var addressbookShell = {
        bookID: '123123',
        bookName: 'addressbook1',
        sharees: ['user1', 'user2']
      };

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbookShell.bookdId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbookShell.bookName);

            return {
              share: function(sharees) {
                expect(sharees).to.deep.equal(addressbookShell.sharees);
                done();

                return $q.when();
              }
            };
          }
        };
      };

      contactAddressbookService.shareAddressbook(addressbookShell, addressbookShell.sharees);
      $rootScope.$digest();
    });

    it('should adapt when address book is a subscription', function(done) {
      var addressbookShell = {
        bookId: '123123',
        bookName: 'addressbook1',
        isSubscription: true,
        source: {
          bookId: 'sourceBookId',
          bookName: 'sourceBookName'
        }
      };
      var sharees = ['user1', 'user2'];

      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(addressbookShell.source.bookId);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal(addressbookShell.source.bookName);

            return {
              share: function(_sharees_) {
                expect(_sharees_).to.deep.equal(sharees);
                done();
              }
            };
          }
        };
      };

      contactAddressbookService.shareAddressbook(addressbookShell, sharees);
      $rootScope.$digest();
    });
  });
});
