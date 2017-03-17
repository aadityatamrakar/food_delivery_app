angular.module('tromboy', ['ionic', 'tromboy.controllers', 'tromboy.api', 'ion-floating-menu', 'ngCordova.plugins.push_v5'])

  .run(function($ionicPlatform, $cordovaPushV5, $http, $rootScope) {
    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
      $cordovaPushV5.initialize({
        android: {
          senderID: "858760510176"
        },
        ios: {
          alert: "true",
          badge: true,
          sound: 'false'
        }
      }).then(function() {
        console.log("PushReg: ok");
        $cordovaPushV5.onNotification();
        $cordovaPushV5.onError();
        $cordovaPushV5.register().then(function(registrationId) {
          console.log("RegID: "+registrationId);
          PushNotification.hasPermission(function(data) {
            if (data.isEnabled) {
              console.log('isEnabled');
            }
          });
        })
      });

      $rootScope.$on('$cordovaPushV5:notificationReceived', function(event, data){
        console.log("Data: "+JSON.stringify(data));
        // data.message, // data.title, // data.count,
        // data.sound, // data.image, // data.additionalData
      });

      $rootScope.$on('$cordovaPushV5:errorOcurred', function(event, e){
        console.log("Err: "+e.message);
      });
    });
  })
  .config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom');

    $stateProvider

      .state('app_b', {
        url: '/app_b',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })

      .state('app_b.tabs', {
        url: '/tabs',
        abstract: true,
        views: {
          "menuContent": {
            templateUrl: 'templates/tabs.html',
            controller: 'TabsCtrl'
          }
        }
      })

      .state('app_b.profile', {
        url: '/profile',
        views: {
          "menuContent": {
            templateUrl: 'templates/profile.html',
            controller: 'ProfileCtrl'
          }
        }
      })

      .state('app_b.tabs.main', {
        url: '/main',
        views: {
          "tab-food": {
            templateUrl: 'templates/main.html',
            controller: 'MainCtrl'
          }
        }
      })

      .state('app_b.tabs.restaurant', {
        url: '/restaurant',
        views: {
          "tab-food": {
            templateUrl: 'templates/restaurant/main.html',
            controller: 'RestaurantMainCtrl'
          }
        }
      })

      .state('app_b.tabs.restaurant_index', {
        url: '/restaurant_index/:city/:area/:type',
        views: {
          "tab-food": {
            templateUrl: 'templates/restaurant/index.html',
            controller: 'RestaurantCtrl'
          }
        }
      })

      .state('app_b.tabs.restaurant.menu', {
        url: '/menu/:restaurant',
        views: {
          "res_view": {
            templateUrl: 'templates/restaurant/menu.html',
            controller: 'RestaurantMenuCtrl'
          }
        }
      })

      .state('app_b.tabs.restaurant.product', {
        url: '/product/:restaurant/:category',
        views: {
          "res_view": {
            templateUrl: 'templates/restaurant/product.html',
            controller: 'RestaurantProductCtrl'
          }
        }
      })

      .state('app.tabs.add_money', {
        url: '/add_money',
        views: {
          "tab-food": {
            templateUrl: 'templates/add_money.html',
            // controller: 'MainCtrl'
          }
        }
      })


      .state('app_b.tabs.cart', {
        url: '/cart',
        views: {
          "tab-food": {
            templateUrl: 'templates/cart.html',
            controller: 'CartCtrl'
          }
        }
      })

      .state('app_b.tabs.confirm_order', {
        url: '/confirm_order',
        views: {
          "tab-food": {
            templateUrl: 'templates/confirm_order.html',
            controller: 'ConfirmOrderCtrl'
          }
        }
      })

      .state('app_b.wallet', {
        url: '/wallet',
        views: {
          "menuContent": {
            templateUrl: 'templates/wallet.html',
            controller: 'WalletCtrl'
          }
        }
      })

      .state('app_b.orders', {
        url: '/orders',
        views: {
          "menuContent": {
            templateUrl: 'templates/orders.html',
            controller: 'OrdersCtrl'
          }
        }
      })

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login_first.html',
        controller: 'LoginCtrl'
      })

      .state('signup_form', {
        url: '/signup_form',
        templateUrl: 'templates/signup_form.html',
        controller: 'SignupCtrl'
      });

    $urlRouterProvider.otherwise('/login');
  });
