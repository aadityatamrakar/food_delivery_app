angular.module('tromboy.controllers', ['underscore'])

  .controller('AppCtrl',    function($scope, $ionicModal, $timeout, $rootScope, $cordovaPushV5) {
    $rootScope.user = {
      id: window.localStorage.getItem('user_id'),
      name: window.localStorage.getItem('name'),
      mobile: window.localStorage.getItem('user_mobile'),
      pin: window.localStorage.getItem('user_pin'),
      token: window.localStorage.getItem('token'),
      address: window.localStorage.getItem('address'),
      // city: window.localStorage.getItem('city'),
      email: window.localStorage.getItem('email')
    };

    $scope.openWeb = function (url){
      window.open(url, '_blank');
    }
  })
  .controller('MainCtrl',   function($scope, WebApi, $ionicModal, $ionicLoading, $ionicPopup, $state, $ionicHistory, $ionicSlideBoxDelegate) {
    $scope.cities = [];
    $scope.stations = $scope.areas = $scope.trains =[] ;
    $scope.switch = false;
    $scope.selected = {city: {id: 3, name: "INDORE"}};
    $scope.cityModal = null;
    $scope.train_query = $scope.area_query = $scope.city_query = $scope.station_query = {};
    $scope.template_order_info = '';
    $scope.wallet_balance = 0;
    $scope.banners = $scope.restaurants = [];
    $scope.railway = {};

    $ionicHistory.clearHistory();

    WebApi.get_city().then(function (res){
      $scope.cities = res;
    });

    WebApi.get_banner().then(function (res){
      console.log(res);
      $scope.banners = res;
      $ionicSlideBoxDelegate.update();
    });

    $scope.$on('$ionicView.enter', function(e) {
      $scope.train_query = $scope.area_query = $scope.city_query = $scope.station_query = '';

      WebApi.wallet_balance().then(function (data){
        $scope.wallet_balance = data.data;
      });
      $ionicModal.fromTemplateUrl('templates/modal/city.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.cityModal = modal;
      });
      $ionicModal.fromTemplateUrl('templates/modal/area.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.areaModal = modal;
      });
      $ionicModal.fromTemplateUrl('templates/modal/train.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.trainModal = modal;
      });
      $ionicModal.fromTemplateUrl('templates/modal/station.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.stationModal = modal;
      });
    });
    $scope.closeCityModal = function() {
      $scope.cityModal.hide();
      $scope.city_query = {};
    };
    $scope.openCityModal = function (){
      $scope.cityModal.show();
    };
    $scope.closeStationModal = function() {
      $scope.stationModal.hide();
      $scope.station_query = {station_:{name:''}};
    };
    $scope.openStationModal = function (){
      var today = moment().format('YMMD');
      var yesterday = moment().subtract(1, 'days').format('YMMD');
      var day_before_yesterday = moment().subtract(2, 'days').format('YMMD');
      console.log('selected');
      var template = '<div class="list">' +
        '<ion-radio ng-click="openStationModal_date(\''+today+'\')">Today</ion-radio>' +
        '<ion-radio ng-click="openStationModal_date(\''+yesterday+'\')">Yesterday</ion-radio>' +
        '<ion-radio ng-click="openStationModal_date(\''+day_before_yesterday+'\')">Day Before Yesterday</ion-radio>' +
        '</div>';
      $scope.liveStationModal = $ionicPopup.show({
        template: template,
        title: 'Train Started ?',
        scope: $scope,
        buttons: []
      });
    };

    $scope.openStationModal_date = function (date){
      if($scope.liveStationModal) $scope.liveStationModal.close();
      if($scope.selected.train != null)
      {
        $ionicLoading.show();
        WebApi.get_live_stations($scope.selected.train.id, date).then(function (res){
          $ionicLoading.hide();
          if(res.hasOwnProperty('stations') && res.stations.length > 0){
            $scope.stations = res.stations;
            $scope.restaurants = res.restaurants;
            console.log($scope.stations);
            $scope.stationModal.show();
          }else{
            $ionicPopup.alert({
              title: "Error!",
              template: "Sorry, No Restaurant are open in the Train Route Cities or Train is not running."
            });
          }
        });
      }
    };

    $scope.closeTrainModal = function() {
      $scope.trainModal.hide();
      $scope.train_query  = {name: ''};
    };
    $scope.openTrainModal = function (){
      $scope.trainModal.show();
    };

    $scope.closeAreaModal = function() {
      $scope.areaModal.hide();
      $scope.area_query = {};
    };
    $scope.openAreaModal = function (){
      if($scope.selected.city != null)
      {
        $ionicLoading.show();
        WebApi.get_area($scope.selected.city.id).then(function (res){
          $ionicLoading.hide();
          $scope.areas = res;
          $scope.areaModal.show();
        });
      }
    };

    $scope.selectCity = function(i,n){
      $scope.selected.city = {id:i, name: n};
      $scope.closeCityModal();
      $scope.selected.area = {};
      $scope.openAreaModal();
    };
    $scope.selectArea = function(i,n){
      $scope.selected.area = {id:i, name: n};
      $scope.closeAreaModal();
    };

    $scope.selectTrain = function(i,n){
      $scope.selected.train = {id:i, name: n};
      $scope.closeTrainModal();
      $scope.openStationModal();
    };
    $scope.selectStation = function(i,n){
      $scope.selected.station = {id:i, name: n};
      $scope.closeStationModal();
    };

    $scope.search_trains = function (train_query){
      WebApi.get_trains(train_query)
        .then(function (res){
          $scope.trains = res;
        });
    }

    $scope.selectOrderInfo = function (t){
      if(t == 'local'){
        if($scope.selected.city.hasOwnProperty('id') && $scope.selected.area.hasOwnProperty('id')){
          $scope.template_order_info = $ionicPopup.show({
            templateUrl: 'templates/popup/order_info.html',
            title: 'Order Information',
            scope: $scope
          });
        }
      }else{
        if($scope.selected.train.hasOwnProperty('id') && $scope.selected.station.hasOwnProperty('id')){
          WebApi.store_restaurant($scope.restaurants[$scope.selected.station.id]);
          $state.go('app_b.tabs.restaurant_index', {param1: $scope.selected.train.id, param2: $scope.selected.station.name, type: 'train'});
        }
      }
    };

    // $scope.get_pnr_details = function (){
    //   if($scope.railway.hasOwnProperty('pnr'))
    //   {
    //     $ionicLoading.show();
    //     WebApi.get_pnr($scope.railway.pnr).then(function (res){
    //       $ionicLoading.hide();
    //       if(res.data.status == 'ok'){
    //         if(res.data.passengers[0].status.indexOf('CNF') != -1){
    //           var confirm = $ionicPopup.confirm({title: 'PNR Details',
    //             template: "Train No: "+res.data.train_no+', Seat No: '+res.data.passengers[0].seat_no,
    //             okText: "Proceed ?",
    //             okType: "button-balanced"
    //           });
    //           confirm.then(function (t){
    //             console.log(t);
    //           })
    //         }else{
    //           var confirm = $ionicPopup.confirm({title: 'PNR Details',
    //             template: "Train No: "+res.data.train_no+', Your ticket is not confirm, you are not eligible for COD option.',
    //             okText: "Proceed ?",
    //             okType: "button-balanced"
    //           });
    //           confirm.then(function (t){
    //             console.log(t);
    //           })
    //         }
    //       }else{
    //         var confirm = $ionicPopup.confirm({title: 'Error',
    //           template: "Connection Error, Please Retry."
    //         });
    //         confirm.then(function (t){
    //           console.log(t);
    //         })
    //       }
    //     });
    //   }
    // };

    $scope.deliveryChoose = function (type){
      $scope.template_order_info.close();
      $state.go('app_b.tabs.restaurant_index', {param1: $scope.selected.city.id, param2: $scope.selected.area.id, type: type});
    };
  })
  .controller('LoginCtrl',  function($scope, $ionicLoading, WebApi, $ionicPopup, $state) {
    $scope.openRegister = function (){ $state.go('register') };
    $scope.login = [];

    $scope.$on('$ionicView.enter', function(e) {
      if(window.localStorage.getItem('user_mobile') != null && window.localStorage.getItem('user_pin') != null)
      {
        $state.go('app_b.tabs.main');
      }
    });

    $scope.regen_pin = function (){
      $scope.data = {mobile: '', otp:''};

      var myPopup = $ionicPopup.show({
        template: '<label class="item item-input"><span class="input-label">Mobile</span><input type="number" ng-model="data.mobile"></label>',
        title: 'Enter Mobile No.',
        subTitle: 'You will receive the PIN',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Get PIN</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.mobile) {
                e.preventDefault();
              } else {
                return $scope.data.mobile;
              }
            }
          }
        ]
      });

      myPopup.then(function(res) {
        if(res.toString().length == 10)
        {
          $ionicLoading.show();
          WebApi.req_regen_pin(res).then(function(response){
            $ionicLoading.hide();
            if(response.status == 200 && response.data.status == 'sent'){
              $ionicPopup.alert({title: 'TromBoy', template: 'You will receive your PIN shortly.'});
            }else if(response.data.status == 'error'){
              $ionicPopup.alert({title: 'Error', template: response.data.error});
            }
          });
        }else{
          $ionicPopup.alert({title: 'TromBoy', template: "Enter valid mobile no."});
        }
      });
    };

    $scope.login_submit = function (){
      if($scope.login.pin.toString().length == 4 && $scope.login.mobile.toString().length == 10)
      {
        $ionicLoading.show();
        WebApi.login($scope.login.mobile, $scope.login.pin)
          .then(function (res) {
            $ionicLoading.hide();
            if (res.status == 200 && res.data.status == 'ok') {
              window.localStorage.setItem('user_mobile', $scope.login.mobile);
              window.localStorage.setItem('user_pin', $scope.login.pin);
              window.localStorage.setItem('token', res.data.token);
              window.localStorage.setItem('name', res.data.name);
              window.localStorage.setItem('address', res.data.address);
              window.localStorage.setItem('city', res.data.city);
              window.localStorage.setItem('email', res.data.email);
              window.localStorage.setItem('user_id', res.data.id);
              // $ionicPopup.alert({title: 'Login Success', template: 'Hello'})
              //   .then(function (){
              $state.go('app_b.tabs.main');
              // });
            }else if(res.data.status == 'error'){
              if(res.data.error == 'no_mobile'){
                $ionicPopup.alert({title: 'Login Failed', template: 'Please check entered Mobile No.'});
                $scope.login.mobile = null; $scope.login.pin = null;
              }else{
                $ionicPopup.alert({title: 'Login Failed', template: 'Please check entered PIN.'});
                $scope.login.pin = null;
              }
            }
          });
      }
    }
  })
  .controller('SignupCtrl', function($scope, $state, WebApi, $ionicLoading, $ionicPopup) {
    $scope.user = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', otp: '', city: 3};
    $scope.error = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', city: ''};
    $scope.tc_check = true;
    $scope.popup = '';

    $scope.btn_verify = function (){
      if($scope.user.pin == $scope.user.pin_verify) {
        $ionicLoading.show();
        WebApi.request_otp($scope.user)
          .then(function (res){
            $ionicLoading.hide();
            if(res.status == 200 && res.data.status == 'sent')
              $scope.verify();
            else if(res.data.status == 'error'){
              angular.forEach(res.data.error, function(value, key) {
                $scope.error[key] = value.join(', ');
              });
              $ionicPopup.alert({title: 'Error', template: 'Please check entered details.'});
            }
          });
      }else {
        $ionicPopup.alert({title: 'Error', template: 'PIN Does not match.'});
        $scope.error.pin_verify = 'PIN does not match.';
      }
    };

    $scope.verify = function (){
      $scope.popup = $ionicPopup.show({
        template: '<input type="number" ng-model="user.otp" placeholder="Enter OTP Here.">',
        title: 'Enter OTP',
        subTitle: 'Enter the 6 digit code received in '+$scope.user.mobile,
        scope: $scope,
        buttons: [
          {
            text: '<b>Verify</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.user.otp) {
                e.preventDefault();
              } else {
                e.preventDefault();
                $scope.error = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:''};
                $ionicLoading.show();
                WebApi.register($scope.user)
                  .then(function (res){
                    $ionicLoading.hide();
                    if(res.status == 200)
                    {
                      if(res.data.status == 'ok'){
                        $scope.user = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', otp:''};
                        $ionicPopup.alert({
                          title: 'Registration Successful', template: 'You can now login using mobile no and pin.'
                        }).then(function() {
                          $state.go('login');
                        });
                        $scope.popup.close();
                      }else if(res.data.status == 'error'){
                        angular.forEach(res.data.error, function(value, key) {
                          $scope.error[key] = value.join(', ');
                        });
                        $ionicPopup.alert({title: 'Error', template: 'Please check entered details.'});
                        $scope.popup.close();
                      }else if(res.data.status == 'invalid_otp'){
                        $ionicPopup.alert({title: 'Error', template: "Invalid OTP, Try again."});
                      }
                    }
                  });
              }
            }
          }
        ]
      });
    };

  })
  .controller('FoodCtrl',   function($scope) {})
  .controller('RestaurantCtrl',   function($scope, $stateParams, WebApi, $ionicLoading, $ionicModal, $state, $ionicPopup) {
    $scope.type = $stateParams['type'];
    if($scope.type == 'train'){
      $scope.train = $stateParams['param1'];
      $scope.station = $stateParams['param2'];
      WebApi.station($scope.station);
      WebApi.train_no($scope.train);
    }else{
      $scope.city = $stateParams['param1'];
      $scope.area = $stateParams['param2'];
    }
    $scope.search_form = false;
    $scope.filter = {choice: null, veg_only: false, cod_available: false, status: false, pickup: null, dinein:null};
    $scope.restaurants = [];
    $scope.filtered = [];
    $scope.closed = [];
    $scope.cart = [];
    $scope.logo_path = WebApi.logo_path();
    WebApi.order_type($stateParams['type']);
    $ionicLoading.show();
    if($scope.type == 'train'){
      $ionicLoading.hide();
      $scope.restaurants = WebApi.get_restaurants();
      $scope.filter.cuisines = WebApi.get_cuisines();
    }else{
      WebApi.fetch_restaurant($scope.area, $scope.type)
        .then(function (res){
          $ionicLoading.hide();
          if(res.status == 200)
          {
            WebApi.store_restaurant(res.data.restaurants);
            $scope.restaurants = res.data.restaurants;
            $scope.closed = res.data.closed;
            $scope.filter.cuisines = WebApi.get_cuisines();
          }
        });
    }

    $scope.openRestaurant = function (id, name){
      if($scope.cart.length==0)
        $state.go('app_b.tabs.restaurant.menu', {restaurant: id});
      else{
        WebApi.get_restaurant().then(
          function (restaurant){
            if(restaurant.id != id){
              $ionicPopup.confirm({title: "Empty Cart ?", template: "Your cart contains dishes from "+restaurant.name+'. Do you want to discard the selection and add dishes from '+name+'?', cancelText: "No", cancelType: 'button-assertive', okText: 'Yes', okType: 'button-balanced'})
                .then(function (res){
                  if(res == true) {
                    $scope.cart = [];
                    WebApi.clear_cart();
                  }
                })
            }else
              $state.go('app_b.tabs.restaurant.menu', {restaurant: id});
          });
      }
    }
    $scope.$on('$ionicView.enter', function(e) {
      $scope.cart = WebApi.get_cart();
      $ionicModal.fromTemplateUrl('templates/modal/filter.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.filter_modal = modal;
      });
    });
    $scope.openFilter = function () {
      $scope.filter_modal.show();
    }
    $scope.closeFilterModal = function() {
      $scope.filter_modal.hide();
    }
    $scope.applyFilter = function() {
      $scope.filtered = $scope.restaurants;
      if($scope.filter.veg_only == true){
        $scope.filtered = _.where($scope.filtered, {type: "Pure Veg"});
        $scope.filter.status = true;
      }

      if($scope.filter.cod_available == true){
        $scope.filtered = _.where($scope.filtered, {payment_modes: "Yes"});
        $scope.filter.status = true;
      }

      $scope.selected_cuisines = _.where($scope.filter.cuisines, {check:true});
      if($scope.selected_cuisines.length>0){
        $scope.filtered = _.filter($scope.filtered, function (res){
          for(var k=0; k<$scope.selected_cuisines.length; k++){
            if(res.cuisines.indexOf($scope.selected_cuisines[k].title) != -1){
              return res;
            }
          }
        });
        $scope.filter.status = true;
      }

      if($scope.filter.choice != null){
        if($scope.filter.choice == 'dt')
          $scope.filtered = _.sortBy($scope.filtered, 'delivery_time');
        else if($scope.filter.choice == 'mda')
          $scope.filtered = _.sortBy($scope.filtered, 'min_delivery_amt');

        $scope.filter.status = true;
      }

      if($scope.filter.pickup != null){
        if($scope.filter.pickup == 'pt')
          $scope.filtered = _.sortBy($scope.filtered, 'pickup_time');
        else if($scope.filter.pickup == 'pf')
          $scope.filtered = _.sortBy($scope.filtered, 'packing_fee');

        $scope.filter.status = true;
      }

      if($scope.filter.dinein != null){
        if($scope.filter.dinein == 'dt')
          $scope.filtered = _.sortBy($scope.filtered, 'dinein_time');

        $scope.filter.status = true;
      }

      $scope.closeFilterModal();
    }
    $scope.clearFilter = function () {
      $scope.filter = {choice: null, veg_only: false, status: false, pickup: null, dinein:null};
      $scope.filter.cuisines = WebApi.get_cuisines();
      $scope.filtered = [];
    }
    $scope.search_form_toggle = function (){
      $scope.search_form = !$scope.search_form;
    }
  })
  .controller('RestaurantMenuCtrl',   function($scope, $stateParams, WebApi, $ionicLoading, $rootScope) {
    $scope.id = $stateParams['restaurant'];
    $scope.logo_path = WebApi.logo_path();
    $scope.restaurant = [];
    $ionicLoading.show();
    WebApi.get_restaurant($scope.id)
      .then(function(v){
        $ionicLoading.hide();
        $rootScope.restaurant  = $scope.restaurant = v;
      });
    //$scope.restaurant = {"id":1,"logo":"1483355224.jpeg","name":"Maheshwari","address":"rewa road","speciality":"samosa","cuisines":["Cafe","North Indian"],"type":"Pure Veg","delivery_time":"45","pickup_time":"30","dinein_time":"10","delivery_fee":"20","min_delivery_amt":"200","packing_fee":null,"payment_modes":"Yes","$$hashKey":"object:75","menu":[{"id":1,"title":"Snacks","products":[{"id":1,"title":"Samosa","mrp":"10","price":"7"},{"id":2,"title":"Chaat","mrp":"20","price":"15"},{"id":3,"title":"Kachori","mrp":"15","price":"15"},{"id":4,"title":"Pani Puri","mrp":"30","price":"30"}]},{"id":2,"title":"Beverages","products":[{"id":5,"title":"Coke Pepsi","mrp":"60","price":"55"},{"id":6,"title":"Pepsi Thumbs Up","mrp":"60","price":"50"},{"id":8,"title":"Mirinda","mrp":"60","price":"60"}]},{"id":3,"title":"Main Course","products":[{"id":10,"title":"Thali","mrp":"180","price":"180"},{"id":11,"title":"Deluxe Thali","mrp":"200","price":"180"}]},{"id":4,"title":"Dessert","products":[{"id":9,"title":"Ice Cream","mrp":"100","price":"70"}]}]};
  })
  .controller('RestaurantProductCtrl',   function($scope, $stateParams, WebApi, $ionicPopup, $state) {
    $scope.id = $stateParams['restaurant'];
    $scope.cat_id = $stateParams['category'];
    $scope.logo_path = WebApi.logo_path();
    $scope.restaurant = [];
    $scope.data = [];
    $scope.quantity = 0;
    $scope.category = WebApi.get_category($scope.cat_id);
    $scope.category.show_search = false;

    //$scope.restaurant = {"id":1,"logo":"1483355224.jpeg","name":"Maheshwari","address":"rewa road","speciality":"samosa","cuisines":["Cafe","North Indian"],"type":"Pure Veg","delivery_time":"45","pickup_time":"30","dinein_time":"10","delivery_fee":"20","min_delivery_amt":"200","packing_fee":null,"payment_modes":"Yes","$$hashKey":"object:75","menu":[{"id":1,"title":"Snacks","products":[{"id":1,"title":"Samosa","mrp":"10","price":"7"},{"id":2,"title":"Chaat","mrp":"20","price":"15"},{"id":3,"title":"Kachori","mrp":"15","price":"15"},{"id":4,"title":"Pani Puri","mrp":"30","price":"30"}]},{"id":2,"title":"Beverages","products":[{"id":5,"title":"Coke Pepsi","mrp":"60","price":"55"},{"id":6,"title":"Pepsi Thumbs Up","mrp":"60","price":"50"},{"id":8,"title":"Mirinda","mrp":"60","price":"60"}]},{"id":3,"title":"Main Course","products":[{"id":10,"title":"Thali","mrp":"180","price":"180"},{"id":11,"title":"Deluxe Thali","mrp":"200","price":"180"}]},{"id":4,"title":"Dessert","products":[{"id":9,"title":"Ice Cream","mrp":"100","price":"70"}]}]};
    // $scope.category = {"id":1,"title":"Snacks","products":[
    //   {"id":1,"title":"Samosa","mrp":"10","price":"7", quantity: 0},
    //   {"id":2,"title":"Chaat","mrp":"20","price":"15", quantity: 0},
    //   {"id":3,"title":"Kachori","mrp":"15","price":"15", quantity: 0},
    //   {"id":4,"title":"Pani Puri","mrp":"30","price":"30", quantity: 0}
    //   ]};

    $scope.quantityPopup = function (p){
      var q=1;
      $scope.data = p;
      WebApi.get_quantity(p.id)
        .then(function (res){
          $scope.data.quantity = res.quantity;
          if(res.edit){
            $scope.myPopup = $ionicPopup.show({
              templateUrl: 'templates/popup/quantity_product.html',
              title: '<span class="positive">'+$scope.data.title+'</span>',
              subTitle: 'Update Quantity / Remove from Cart',
              scope: $scope,
              buttons: [
                { text: "Update", type: "button-balanced" },
                { text: "Remove", type: "button-assertive",
                  onTap: function (e){
                    WebApi.remove_from_cart($scope.data);
                  }
                },
              ]
            });
          }else{
            $scope.myPopup = $ionicPopup.show({
              templateUrl: 'templates/popup/quantity_product.html',
              title: '<span class="positive">'+$scope.data.title+'</span>',
              subTitle: 'Base Price: <i class="fa fa-inr"></i>'+$scope.data.price,
              scope: $scope,
              buttons: [
                { text: "Cancel", type: "button-assertive",
                  onTap: function (e) {
                    return false;
                  }},
                {
                  text: '<b>Add to Cart</b>',
                  type: 'button-balanced',
                  onTap: function(e) {
                    if (!$scope.data.quantity) {
                      e.preventDefault();
                    } else {
                      return $scope.data.quantity;
                    }
                  }
                }
              ]
            });
          }

          $scope.myPopup.then(function(res) {
            if(res){
              WebApi.cart_add($scope.data);
            }
          });
        });
    };

    $scope.viewCart = function (){
      $state.go('app_b.tabs.cart');
    }
    $scope.decrease_quantity = function(id){
      angular.forEach($scope.category.products, function (v, i){
        if(v.id == id){
          if($scope.category.products[i]['quantity']>1) {
            $scope.category.products[i]['quantity']-=1;
          }
        }
      });
    };
    $scope.increase_quantity = function(id){
      angular.forEach($scope.category.products, function (v, i){
        if(v.id == id) {
          if($scope.category.products[i]['quantity']<20) {
            $scope.category.products[i]['quantity']+=1;
          }
        }
      });
    };
  })
  .controller('CartCtrl',   function ($rootScope, $scope, WebApi, $ionicPopup, $ionicLoading, $timeout, $state, $ionicHistory){
    $scope.cart = [];
    $scope.order_details = $scope.train = $scope.restaurant = [];
    $scope.cart_value = $scope.other_charges = $scope.gtotal = 0;
    $scope.editable = $scope.checkout_btn = $scope.coupon_t = false;
    $scope.coupon = {code: null, applied: false};
    $scope.away_amt = $scope.wallet = 0;
    $scope.payment_mode_popup = null;
    $scope.train_no = $scope.station = '';
    $scope.$on('$ionicView.enter', function(e) {
      $scope.train_no = WebApi.train_no();
      $scope.station = WebApi.station();

      WebApi.get_restaurant()
        .then(function (res){
          $scope.restaurant = res;
          $scope.update();
        });
      WebApi.wallet_balance().then(function (res){
        $scope.wallet = res.data;
        $scope.update();
      })
      $scope.type = WebApi.order_type();
      $scope.cart = WebApi.get_cart();

      // $scope.cart = JSON.parse('[{"id":1,"title":"Samosa","mrp":"10","price":"7","quantity":1}, {"id":2,"title":"Chaat","mrp":"20","price":"15","quantity":20}]');
      // $scope.restaurant = JSON.parse('{"id":1,"logo":"1482313769.jpeg","name":"Maheshwari","address":"rewa road","speciality":"samosa","cuisines":["Cafe","North Indian"],"type":"Pure Veg","delivery_time":"45","pickup_time":"30","dinein_time":"10","delivery_fee":"20","min_delivery_amt":"200","packing_fee":null,"payment_modes":"Yes","menu":[{"id":1,"title":"Snacks","products":[{"id":1,"title":"Samosa","mrp":"10","price":"7","quantity":0},{"id":2,"title":"Chaat","mrp":"20","price":"15","quantity":0},{"id":3,"title":"Kachori","mrp":"15","price":"15","quantity":0},{"id":4,"title":"Pani Puri","mrp":"30","price":"30","quantity":0}]},{"id":2,"title":"Beverages","products":[{"id":5,"title":"Coke Pepsi","mrp":"60","price":"55","quantity":0},{"id":6,"title":"Pepsi Thumbs Up","mrp":"60","price":"50","quantity":0},{"id":8,"title":"Mirinda","mrp":"60","price":"60","quantity":0}]},{"id":3,"title":"Main Course","products":[{"id":10,"title":"Thali","mrp":"180","price":"180","quantity":0},{"id":11,"title":"Deluxe Thali","mrp":"200","price":"180","quantity":0}]},{"id":4,"title":"Dessert","products":[{"id":9,"title":"Ice Cream","mrp":"100","price":"70","quantity":0}]}]}');
      // $scope.type = WebApi.order_type() || 'train';

      $scope.editable = false;
      $scope.update();
    });

    $scope.take_address = function (){
      if($scope.type != 'train'){
        var template = '<div class="list">' +
          '<label class="item item-input" ng-if="type == \'delivery\'">' +
          '<span class="input-label"><b>Address : </b></span>' +
          '<input type="text" ng-model="user.address" placeholder="">' +
          '</label>' +
          '<label class="item item-input">' +
          '<span class="input-label"><b>Mobile No. : </b></span>' +
          '<input type="text" ng-model="user.mobile" readonly>' +
          '</label>' +
          '<label class="item item-input">' +
          '<span class="input-label"><b>Alternate No. : </b></span>' +
          '<input type="text" ng-model="user.mobile2" value="">' +
          '</label>' +
          '<label class="item item-input">' +
          '<span class="input-label"><b>Remarks : </b></span>' +
          '<input type="text" ng-model="user.remarks" value="">' +
          '</label>' +
          '</div>';

        $ionicPopup.show({
          template: template,
          title: 'Please confirm your delivery address.',
          scope: $scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>Ok</b>',
              type: 'button-positive',
              onTap: function(e) {
                if (!$scope.user.address) {
                  e.preventDefault();
                } else {
                  if($scope.type == 'delivery')
                    $scope.take_payment($scope.user.address, $scope.user.mobile, $scope.user.mobile2, $scope.user.remarks);
                  else
                    $scope.take_payment(null, $scope.user.mobile, $scope.user.mobile2, $scope.user.remarks);
                }
              }
            }
          ]
        }).then(function() {});
      } else if($scope.type == 'train'){
        $scope.train = {pnr: 8257275698};
        $ionicPopup.show({
          template: '<input type="number" ng-model="train.pnr"  placeholder="Enter PNR Here.">',
          title: 'Please Enter your 10 Digit PNR',
          scope: $scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>Validate</b>',
              type: 'button-positive',
              onTap: function(e) {
                if (!$scope.train.pnr) {
                  e.preventDefault();
                } else {
                  if($scope.train.pnr.toString().length == 10){
                    return $scope.train.pnr;
                  }else{
                    e.preventDefault();

                  }
                }
              }
            }
          ]
        }).then(function(pnr) {
          if(pnr && pnr.toString().length == 10)
          {
            $ionicLoading.show();
            WebApi.get_pnr(pnr)
              .then(function (res)
              {
                $ionicLoading.hide();
                if(res.data.status == 'ok')
                {
                  var seat = res.data.passengers[0].seat_no.replace(' ', '').replace(' ', '').split(',');
                  console.log(seat);
                  $scope.train['coach'] = seat[0];
                  $scope.train['seat'] = seat[1];
                }

                var template = '<div class="list">' +
                  '<label class="item item-input">' +
                  '<span class="input-label"><b>Train Coach : </b></span>' +
                  '<input type="text" ng-model="train.coach" placeholder="">' +
                  '</label>' +
                  '<label class="item item-input">' +
                  '<span class="input-label"><b>Seat No. : </b></span>' +
                  '<input type="text" ng-model="train.seat">' +
                  '</label>' +
                  '<label class="item item-input">' +
                  '<span class="input-label"><b>Mobile No. : </b></span>' +
                  '<input type="text" ng-model="user.mobile" readonly>' +
                  '</label>' +
                  '<label class="item item-input">' +
                  '<span class="input-label"><b>Alternate No. : </b></span>' +
                  '<input type="text" ng-model="train.mobile2">' +
                  '</label>' +
                  '<label class="item item-input">' +
                  '<span class="input-label"><b>Remarks : </b></span>' +
                  '<input type="text" ng-model="train.remarks">' +
                  '</label>' +
                  '</div>';
                $ionicPopup.show({
                  template: template,
                  title: 'Seat and Contact Details',
                  scope: $scope,
                  buttons: [
                    { text: 'Cancel' },
                    {
                      text: '<b>OK</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                        if (!$scope.train.coach && !$scope.train.seat) {
                          e.preventDefault();
                        } else {
                          return $scope.train;
                        }
                      }
                    }
                  ]
                }).then(function(t) {
                  $scope.take_payment("Train No: "+$scope.train_no+", Coach: "+$scope.train.coach+", Seat No: "+$scope.train.seat, $scope.user.mobile, t.mobile2, t.remarks);
                });
              });
          }
        });
      }
    }

    $scope.take_payment = function (address, mobile, mobile2, remarks){
      $scope.order_details = {address:address, mobile:mobile, mobile2: mobile2, remarks: remarks};
      console.log($scope.order_details);
      if($scope.gtotal > 0){
        if($scope.restaurant.payment_modes == 'Yes'){
          var template = '<div class="list">' +
            '<ion-radio ng-click="do_online_payment()">Online Payment</ion-radio>' +
            '<ion-radio ng-click="do_cod_order()">Cash on Delivery</ion-radio>' +
            '</div>';
          $scope.payment_mode_popup = $ionicPopup.show({
            template: template,
            title: 'Select Payment Mode',
            scope: $scope,
            buttons: []
          });

          $scope.payment_mode_popup.then(function(t) {
            // $scope.take_payment($scope.order_details.address, $scope.user.mobile, $scope.user.mobile2, $scope.user.remarks);
          });
        }else{
          $scope.do_online_payment();
        }
      }else{
        $scope.payment_id = 'wallet';
        $scope.payment_amount = null;
        $scope.place_order($scope.order_details.address, $scope.order_details.mobile, $scope.order_details.mobile2, $scope.order_details.remarks);
      }
    };

    $scope.do_cod_order = function(){
      if($scope.payment_mode_popup) $scope.payment_mode_popup.close();
      $scope.payment_id = 'COD';
      $scope.payment_amount = $scope.gtotal;
      $scope.place_order($scope.order_details.address, $scope.order_details.mobile, $scope.order_details.mobile2, $scope.order_details.remarks);
    };

    $scope.do_online_payment = function ()
    {
      if($scope.payment_mode_popup) $scope.payment_mode_popup.close();
      var options = {
        "key": "rzp_test_FMKzS7xs08EwP5",
        "amount": $scope.gtotal*100,
        "name": "TromBoy",
        "description": "Purchase From "+$scope.restaurant.name,
        "prefill": {
          "name": $rootScope.user.name,
          "contact": $rootScope.user.mobile,
          "email": $rootScope.user.email
        },
        "notes": {
          "address": $scope.order_details.address
        },
        "theme": {
          "color": "#F37254"
        }
      };

      var successCallback = function(success) {
        $scope.payment_id = success.razorpay_payment_id;
        $scope.payment_amount = $scope.gtotal;
        $scope.place_order($scope.order_details.address, $scope.order_details.mobile, $scope.order_details.mobile2, $scope.order_details.remarks);
      };

      var cancelCallback = function(error) {
        $ionicPopup.alert({title: 'Error', template: error.description + ' (Error '+error.code+')'});
      };

      RazorpayCheckout.on('payment.success', successCallback);
      RazorpayCheckout.on('payment.cancel', cancelCallback);
      RazorpayCheckout.open(options);
    };

    $scope.place_order = function (address, mobile, mobile2, remarks){
      console.log('place order');
      $ionicLoading.show();
      WebApi.place_order($scope.cart, $scope.coupon, $scope.restaurant, $scope.type, address, $scope.payment_id, $scope.payment_amount, $scope.wallet, mobile2, remarks)
        .then(function (res){
          $ionicLoading.hide();
          WebApi.order(res.data);
          WebApi.clear_cart();
          $state.go('app_b.tabs.confirm_order');
        });
    };
    $scope.applyCoupon = function (){
      $ionicLoading.show({"template": "<ion-spinner></ion-spinner><br/>Applying Coupon..."});
      WebApi.check_coupon($scope.coupon.code, $scope.cart_value)
        .then(function (res){
          $ionicLoading.hide();
          if(res.data.status == 'ok'){
            $scope.coupon = res.data;
            $scope.coupon.applied = true;
            $scope.update();
          }else if(res.data.status == 'error'){
            if(res.data.error == 'invalid'){
              $ionicPopup.alert({title: 'Error', template: 'Invalid Coupon'})
                .then(function (){ $scope.coupon = {code: null, applied: false}; });
            }else if(res.data.error == 'times_exceeded'){
              $ionicPopup.alert({title: 'Error', template: 'Coupon usage limit has been exceeded.'})
                .then(function (){ $scope.coupon = {code: null, applied: false}; });
            }else if(res.data.error == 'new_only'){
              $ionicPopup.alert({title: 'Error', template: 'Coupon only valid for new users.'})
                .then(function (){ $scope.coupon = {code: null, applied: false}; });
            }else if(res.data.error == 'expired'){
              $ionicPopup.alert({title: 'Error', template: 'Coupon has been expired.'})
                .then(function (){ $scope.coupon = {code: null, applied: false}; });
            }else if(res.data.error == 'min_amt'){
              $ionicPopup.alert({title: 'Error', template: 'Minimum amount of order should be more than <i class="fa fa-inr"></i> '+res.data.min_amt})
                .then(function (){ $scope.coupon = {code: null, applied: false}; });
            }
          }else{
            $ionicPopup.alert({title: 'Error', template: 'Error in applying coupon.'})
              .then(function (){ $scope.coupon = {code: null, applied: false}; });
          }
        });
    }
    $scope.update = function (){
      $scope.gtotal = $scope.cart_value = $scope.other_charges = 0;
      for(var i=0; i<$scope.cart.length; i++) $scope.cart_value += $scope.cart[i].price*$scope.cart[i].quantity;
      if($scope.coupon.applied){
        if(parseFloat($scope.coupon.min_amt) <= $scope.cart_value) {
          var disc = ($scope.cart_value*parseFloat($scope.coupon.percent))*0.01;
          disc = disc>parseFloat($scope.coupon.max_amount)?parseFloat($scope.coupon.max_amount):disc;
          disc = parseInt(disc);
          if($scope.coupon.return_type == 'discount'){
            $scope.coupon.disc_amt = disc;
            $scope.gtotal -= disc;
          }else if($scope.coupon.return_type == 'cashback'){
            $scope.coupon.cashback_amt = disc;
          }
        }else {
          $scope.reset_coupon(false);
        }
      }
      if(($scope.type == 'train' || $scope.type == 'delivery') && $scope.restaurant.delivery_fee!=null) $scope.other_charges += parseInt($scope.restaurant.delivery_fee);
      if($scope.type != 'dinein' && $scope.restaurant.packing_fee!=null) $scope.other_charges += parseInt($scope.restaurant.packing_fee);
      if($scope.type == 'delivery' || $scope.type == 'train'){
        if(parseFloat($scope.restaurant.min_delivery_amt) > ($scope.cart_value)){
          $scope.checkout_btn = false;
          $scope.away_amt = parseInt($scope.restaurant.min_delivery_amt) - ($scope.cart_value);
        }else $scope.checkout_btn = true;
      }else $scope.checkout_btn = true;
      $scope.gtotal += $scope.cart_value+$scope.other_charges;
      if($scope.wallet > 0)
      {
        if($scope.wallet >= $scope.gtotal)
        {
          $scope.wallet = $scope.gtotal;
          $scope.gtotal = 0;
        }else{
          $scope.gtotal -= $scope.wallet;
        }
      }
    }
    $scope.reset_coupon = function (t){
      if(t == null) t = false;
      $scope.coupon_t = false;
      $scope.coupon = {code: null, applied: false};
      console.log($scope.coupon_t && !$scope.coupon.applied);
      if(t) $scope.update();
    };
    $scope.remove = function (p){
      WebApi.remove_from_cart(p)
    }
    $scope.edit = function (){
      $scope.editable = !$scope.editable;
      if(! $scope.editable) {
        $ionicLoading.show();
        WebApi.wallet_balance().then(function (res){
          $scope.wallet = res.data;
          $scope.update();
          $ionicLoading.hide();
        });
      }
    }
  })

  .controller('ConfirmOrderCtrl', function ($scope, WebApi, $timeout, $rootScope, $ionicLoading, $ionicHistory){
    $scope.user = $rootScope.user;
    $scope.$on('$ionicView.enter', function(e) {
      $ionicLoading.show();
      $scope.order = WebApi.order();
      $scope.restaurant = $scope.order.restaurant;
      $ionicLoading.hide();
    });
    for( var viewObj in $ionicHistory.viewHistory().views )
    {
      if( $ionicHistory.viewHistory().views[viewObj].stateName == 'app_b.tabs.main' ){
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
  })
  .controller('RestaurantMainCtrl',   function ($scope, WebApi){
    $scope.cart_value = $scope.other_charges =0;
    $scope.cart = WebApi.get_cart();

    $scope.$watch(
      function( $scope ){
        var val=0;
        $scope.cart = WebApi.get_cart();
        for(var i=0; i<$scope.cart.length; i++) val += $scope.cart[i].price*$scope.cart[i].quantity;
        return val;
      },
      function( f ) {
        $scope.cart_value = f;
      }
    );
  })
  .controller('ProfileCtrl', function ($scope, $state, WebApi, $rootScope, $ionicPopup){
    $scope.user = $rootScope.user;
    $scope.change_pin = true;

    $scope.updateProfile = function (){
      WebApi.updateProfile($scope.user)
        .then(function (res){
          if(res.data.status == 'ok'){
            $scope.user.edit = false;
            window.localStorage.setItem('name', $scope.user.name);
            window.localStorage.setItem('address', $scope.user.address);
            window.localStorage.setItem('email', $scope.user.email);
            $rootScope.user = $scope.user;
          }else if(res.data.status == 'error'){
            $ionicPopup.alert({title: 'Error', template: "Check entered details."});
          }
        });
    }
    $scope.changePIN = function (){
      if($scope.user.old_pin.toString().length == 4){
        if($scope.user.old_pin == $scope.user.pin) {
          if ($scope.user.new_pin.toString().length == 4) {
            if ($scope.user.new_pin == $scope.user.new_pin_verify) {
              WebApi.changePIN($scope.user)
                .then(function (res) {
                  if (res.data.status == 'ok') {
                    window.localStorage.setItem('user_pin', $scope.user.new_pin);
                    $ionicPopup.alert({title: 'TromBoy', template: "PIN Changed Successfully."});
                    $scope.user.old_pin = '';
                    $scope.user.new_pin = '';
                    $scope.user.new_pin_verify = '';
                  }else if(res.data.status == 'error'){
                    if(res.data.error == 'old_pin_invalid'){
                      $ionicPopup.alert({title: 'Error', template: "Please enter correct old PIN."});
                    }
                  }
                })
            } else $ionicPopup.alert({title: 'TromBoy', template: "PIN does not match."});
          } else $ionicPopup.alert({title: 'TromBoy', template: 'New PIN length should be 4 digit only.'});;
        }else $ionicPopup.alert({title: 'TromBoy', template: 'Please enter correct old PIN.'});
      }else $ionicPopup.alert({title: 'TromBoy', template: 'New PIN length should be 4 digit only.'});
    }
  })
  .controller('WalletCtrl', function ($scope, WebApi, $ionicLoading){
    $scope.wallet = [];

    $scope.$on('$ionicView.enter', function(e) {
      $ionicLoading.show();
      WebApi.wallet_summary().then(function (res){
        $ionicLoading.hide();
        $scope.wallet = res;
      });
    });
  })
  .controller('OrdersCtrl',   function ($scope, WebApi, $ionicLoading, $ionicPopup, $state, $timeout){
    $scope.orders = [];

    $scope.$on('$ionicView.enter', function(e) {
      $ionicLoading.show();
      WebApi.all_orders().then(function (res){
        $ionicLoading.hide();
        $scope.orders = res.data.reverse();
      });
    });

    var template = '<ion-card>' +
      '<ion-item ng-click="reorder(\'delivery\')">Delivery</ion-item>' +
      '<ion-item ng-click="reorder(\'pickup\')">Take Away</ion-item>' +
      // '<ion-item ng-click="reorder(\'dinein\')">Eat at Restaurant</ion-item>' +
      '</ion-card>';

    $scope.open_order_info = function(index) {
      $scope.index = index;
      $scope.order_popup = $ionicPopup.show({
        template: template,
        title: 'Select Order Information',
        scope: $scope
      });
    };

    $scope.reorder = function (type){
      $scope.order_popup.close();
      var cart = JSON.parse($scope.orders[$scope.index]['cart']);
      var restaurant = $scope.orders[$scope.index]['restaurant'];
      WebApi.set_cart(cart);
      WebApi.order_type(type);
      WebApi.set_restaurant(restaurant);
      $state.go('app_b.tabs.cart');
    };

  })
  .controller('TabsCtrl',   function (){});
