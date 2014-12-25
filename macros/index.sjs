macro $specify_core__load {
  rule { } => {
    typeof module !== 'undefined' && typeof require !== 'undefined'?  require('specify-core')
    :                                                                 window.Specify.core
  }
}

macro spec {
  rule { $title { $a ... } } => {
    (function(specify) {
      var _scope = {
        specify     : specify,
        tests      : [],
        beforeAll  : [],
        afterAll   : [],
        beforeEach : [],
        afterEach  : []
      };

      $specify__definition _scope { spec $title { $a ... }}

      return _scope.tests[0];
    }($specify_core__load))
  }
}

macro $specify__definition {
  rule { $scope { it $title { $a ... } $b ... } } => {
    $scope.tests.push($scope.specify.Test.Case.create({
      name: $title,
      timeout: new $scope.specify._Maybe.Nothing(),
      slow: new $scope.specify._Maybe.Nothing(),
      enabled: new $scope.specify._Maybe.Nothing(),
      test: new $scope.specify._Future(function(reject, resolve) {
        try {
          (function(){ $a ... }());
          resolve();
        } catch (e) {
          reject(e);
        }
      })
    }));

    $specify__definition $scope { $b ... }
  }

  rule { $scope { xit $title { $a ... } $b ... }} => {
    $specify__definition $scope { it $title { $a ... } }
    $scope.tests[$scope.tests.length - 1].enabled = new $scope.specify._Maybe.Just(
      function(){ return false }
    );
    $specify__definition $scope { $b ... }
  }

  rule { $scope { async $title { $test ... } $a ... } } => {
    $scope.tests.push($scope.specify.Test.Case.create({
      name: $title,
      timeout: new $scope.specify._Maybe.Nothing(),
      slow: new $scope.specify._Maybe.Nothing(),
      enabled: new $scope.specify._Maybe.Nothing(),
      test: function(){ $test ... }()
    }));


    $specify__definition $scope { $a ... }
  }

  rule { $scope { xasync $title { $a ... } $b ... }} => {
    $specify__definition $scope { async $title { $a ... } }
    $scope.tests[$scope.tests.length - 1].enabled = new $scope.specify._Maybe.Just(
      function(){ return false }
    );
    $specify__definition $scope { $b ... }
  }

  rule { $scope { spec $title { $a ... } $b ... } } => {
    (function() {
      var _scope = {
        specify     : $scope.specify,
        tests      : [],
        beforeAll  : [],
        afterAll   : [],
        beforeEach : [],
        afterEach  : []
      };

      $specify__definition _scope { $a ... }
      
      $scope.tests.push($scope.specify.Test.Suite.create({
        name       : $title,
        tests      : _scope.tests,
        beforeAll  : $scope.specify.Hook(_scope.beforeAll),
        beforeEach : $scope.specify.Hook(_scope.beforeEach),
        afterAll   : $scope.specify.Hook(_scope.afterAll),
        afterEach  : $scope.specify.Hook(_scope.afterEach)
      }));
    })();

    $specify__definition $scope { $b ... }
  }

  rule { $scope { beforeAll { $a ... } $b ... } } => {
    $scope.beforeAll.push(function(){
      $a ...
    }());

    $specify__definition $scope { $b ... }
  }

  rule { $scope { beforeEach { $a ... } $b ... } } => {
    $scope.beforeEach.push(function(){
      $a ...
    }());

    $specify__definition $scope { $b ... }
  }
  
  rule { $scope { afterAll { $a ... } $b ... } } => {
    $scope.afterAll.push(function(){
      $a ...
    }());

    $specify__definition $scope { $b ... }
  }

  rule { $scope { afterEach { $a ... } $b ... } } => {
    $scope.afterEach.push(function(){
      $a ...
    }());

    $specify__definition $scope { $b ... }
  }


  rule { _ { } } => { }
}

export spec
