macro $hifive__load {
  rule { } => {
    typeof module !== 'undefined' && typeof require !== 'undefined'?  require('hifive')
    :                                                                 window.hifive
  }
}

macro spec {
  rule { $title { $a ... } } => {
    (function(hifive) {
      var _scope = {
        hifive     : hifive,
        tests      : [],
        beforeAll  : [],
        afterAll   : [],
        beforeEach : [],
        afterEach  : []
      };

      $hifive__definition _scope { spec $title { $a ... }}

      return _scope.tests[0];
    }($hifive__load))
  }
}

macro $hifive__definition {
  rule { $scope { it $title { $a ... } $b ... } } => {
    $scope.tests.push($scope.hifive.Test.Case.create({
      name: $title,
      timeout: new $scope.hifive._Maybe.Nothing(),
      slow: new $scope.hifive._Maybe.Nothing(),
      enabled: new $scope.hifive._Maybe.Nothing(),
      test: new $scope.hifive._Future(function(reject, resolve) {
        try {
          $a ...;
          resolve();
        } catch (e) {
          reject(e);
        }
      })
    }));

    $hifive__definition $scope { $b ... }
  }

  rule { $scope { xit $title { $a ... } $b ... }} => {
    $hifive__definition $scope { it $title { $a ... } }
    $scope.tests[$scope.tests.length - 1].enabled = new $scope.hifive._Maybe.Just(
      function(){ return false }
    );
    $hifive__definition $scope { $b ... }
  }

  rule { $scope { async $title { $test ... } $a ... } } => {
    $scope.tests.push($scope.hifive.Test.Case.create({
      name: $title,
      timeout: new $scope.hifive._Maybe.Nothing(),
      slow: new $scope.hifive._Maybe.Nothing(),
      enabled: new $scope.hifive._Maybe.Nothing(),
      test: function(){ $test ... }()
    }));


    $hifive__definition $scope { $a ... }
  }

  rule { $scope { xasync $title { $a ... } $b ... }} => {
    $hifive__definition $scope { async $title { $a ... } }
    $scope.tests[$scope.tests.length - 1].enabled = new $scope.hifive._Maybe.Just(
      function(){ return false }
    );
    $hifive__definition $scope { $b ... }
  }

  rule { $scope { spec $title { $a ... } $b ... } } => {
    (function() {
      var _scope = {
        hifive     : $scope.hifive,
        tests      : [],
        beforeAll  : [],
        afterAll   : [],
        beforeEach : [],
        afterEach  : []
      };

      $hifive__definition _scope { $a ... }
      
      $scope.tests.push($scope.hifive.Test.Suite.create({
        name       : $title,
        tests      : _scope.tests,
        beforeAll  : $scope.hifive.Hook(_scope.beforeAll),
        beforeEach : $scope.hifive.Hook(_scope.beforeEach),
        afterAll   : $scope.hifive.Hook(_scope.afterAll),
        afterEach  : $scope.hifive.Hook(_scope.afterEach)
      }));
    })();

    $hifive__definition $scope { $b ... }
  }

  rule { $scope { beforeAll { $a ... } $b ... } } => {
    $scope.beforeAll.push(function(){
      $a ...
    }());

    $hifive__definition $scope { $b ... }
  }

  rule { $scope { beforeEach { $a ... } $b ... } } => {
    $scope.beforeEach.push(function(){
      $a ...
    }());

    $hifive__definition $scope { $b ... }
  }
  
  rule { $scope { afterAll { $a ... } $b ... } } => {
    $scope.afterAll.push(function(){
      $a ...
    }());

    $hifive__definition $scope { $b ... }
  }

  rule { $scope { afterEach { $a ... } $b ... } } => {
    $scope.afterEach.push(function(){
      $a ...
    }());

    $hifive__definition $scope { $b ... }
  }


  rule { _ { } } => { }
}

export spec
