'use strict';

describe('Restmod collection:', function() {

  var restmod, $httpBackend, Bike, query;

  beforeEach(module('restmod'));

  beforeEach(inject(function($injector) {
    restmod = $injector.get('restmod');

    Bike = restmod.model('/api/bikes');
    query = Bike.$collection({ brand: 'trek' });

    // mock api
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', '/api/bikes?brand=trek').respond([ { model: 'Slash' }, { model: 'Remedy' } ]);
    $httpBackend.when('GET', '/api/bikes?brand=giant').respond([ { model: 'Reign' } ]);
  }));

  describe('$fetch', function() {

    it('should retrieve a collection of items of same type', function() {
      query.$fetch();
      expect(query.length).toEqual(0);
      expect(query.$resolved).toBe(false);
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      expect(query.$resolved).toBe(true);
      expect(query[0] instanceof Bike).toBeTruthy();
    });

    it('should append new items if called again', function() {
      query = query.$fetch();
      $httpBackend.flush();
      expect(query.$resolved).toBe(true);
      expect(query.length).toEqual(2);
      query.$fetch({ brand: 'giant' });
      $httpBackend.flush();
      expect(query.length).toEqual(3);
    });

  });

  describe('$reset', function() {

    it('should make the next call to $fetch clear old items', function() {
      query.$fetch();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      query.$reset().$fetch({ brand: 'giant' });
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

  describe('$refresh', function() {

    it('should clear old items on resolve', function() {
      query.$fetch();
      $httpBackend.flush();
      expect(query.length).toEqual(2);
      query.$refresh({ brand: 'giant' });
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

    it('should clear old items on resolve when called consecutivelly', function() {
      query.$refresh({ brand: 'giant' });
      query.$refresh({ brand: 'giant' });
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

  describe('$build', function() {

    it('should not add resource to collection by default', function() {
      query.$build({ model: 'Teocali' });
      expect(query.length).toEqual(0);
    });

  });

  describe('$create', function() {

    it('should add resource to collection after success', function() {
      query.$create({ model: 'Teocali' });
      expect(query.length).toEqual(0);
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(query.length).toEqual(1);
    });

  });

  describe('$add', function() {

    it('should add a new object to the back of the array and trigger after-add', function() {
      var col = Bike.$collection(),
          spy = jasmine.createSpy('callback');

      col.$on('after-add', spy);
      col.$add(Bike.$build());

      expect(col.length).toEqual(1);
      expect(spy).toHaveBeenCalled();
    });

    it('should add a new object to the specified index if index is provided', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(obj, 1);

      expect(col[1]).toEqual(obj);
    });
  });

  describe('$remove', function() {

    it('should remove an object if already in the array and triger after-remove', function() {
      var col = Bike.$collection(),
          obj = Bike.$build(),
          spy = jasmine.createSpy('callback');

      col.$on('after-remove', spy);
      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());
      col.$remove(obj);

      expect(col.length).toEqual(2);
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$indexOf', function() {

    it('should return index if object found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(1);
    });

    it('should return -1 if object not found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(-1);
    });


    it('should return index if object found when searching using a function', function() {
      var col = Bike.$collection(),
          obj = Bike.$build({ brand: 'Giant' });

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(function(_obj) {
        return _obj.brand === 'Giant';
      })).toEqual(1);
    });

  });

  describe('$unwrap', function() {

    it('should call the packer unpackMany method if a packer is provided', function() {
      var packer = { unpackMany: null };
      spyOn(packer, 'unpackMany').andReturn([]);

      var bikes = restmod.model('/api/bikes', function() {
        this.setPacker(packer);
      }).$collection();

      var raw = [{}];
      bikes.$unwrap(raw);
      expect(packer.unpackMany).toHaveBeenCalledWith(raw, bikes);
    });

    it('should call $feed', function() {
      var bikes = Bike.$collection();
      spyOn(bikes, '$feed');
      bikes.$unwrap([{}]);
      expect(bikes.$feed).toHaveBeenCalled();
    });

  });

});

