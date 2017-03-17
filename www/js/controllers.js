angular.module('tromboy.controllers', ['underscore'])

  .controller('AppCtrl',    function($scope, $ionicModal, $timeout, $rootScope, $cordovaPushV5) {
    $rootScope.user = {
      id: window.localStorage.getItem('user_id'),
      name: window.localStorage.getItem('name'),
      mobile: window.localStorage.getItem('user_mobile'),
      pin: window.localStorage.getItem('user_pin'),
      token: window.localStorage.getItem('token'),
      address: window.localStorage.getItem('address'),
      city: window.localStorage.getItem('city'),
      email: window.localStorage.getItem('email')
    };


  })

  .controller('MainCtrl',   function($scope, WebApi, $ionicModal, $ionicLoading, $ionicPopup, $state, $ionicHistory) {
    $scope.cities = [];
    $scope.areas = [];
    $scope.selected = [];
    $scope.cityModal = null;
    $scope.area_query = $scope.city_query = {};
    $scope.template_order_info = '';
    $scope.wallet_balance = 0;

    $ionicHistory.clearHistory();

    WebApi.get_city().then(function (res){
      $scope.cities = res;
    });

    $scope.$on('$ionicView.enter', function(e) {
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
    });
    $scope.closeCityModal = function() {
      $scope.cityModal.hide();
      $scope.city_query.name = '';
    };
    $scope.openCityModal = function (){
      $scope.cityModal.show();
    };

    $scope.closeAreaModal = function() {
      $scope.areaModal.hide();
      $scope.area_query.name = '';
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

    $scope.selectOrderInfo = function (){
      $scope.template_order_info = $ionicPopup.show({
        templateUrl: 'templates/popup/order_info.html',
        title: 'Order Information',
        scope: $scope
      });
    };
    $scope.deliveryChoose = function (type){
      $scope.template_order_info.close();
      $state.go('app_b.tabs.restaurant_index', {city: $scope.selected.city.id, area: $scope.selected.area.id, type: type});
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
        subTitle: 'You will receive the OTP',
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
              alert("You will receive your PIN shortly.");
            }else if(response.data.status == 'error'){
              alert(response.data.error);
            }
          });
        }else{
          alert("Enter valid mobile no.");
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
    $scope.user = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', city:'', otp: ''};
    $scope.error = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', city:''};
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
        template: '<input type="number" ng-model="user.otp">',
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
                $scope.error = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', city:''};
                $ionicLoading.show();
                WebApi.register($scope.user)
                  .then(function (res){
                    $ionicLoading.hide();
                    if(res.status == 200)
                    {
                      if(res.data.status == 'ok'){
                        $scope.user = {name:'', email:'', mobile:'', pin:'', pin_verify:'', address:'', address2:'', city:'', otp:''};
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
                        alert("Invalid OTP, Try again.");
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
    $scope.city = $stateParams['city'];
    $scope.area = $stateParams['area'];
    $scope.search_form = false;
    $scope.filter = {choice: null, veg_only: false, status: false, pickup: null, dinein:null};
    $scope.restaurants = [];
    $scope.filtered = [];
    $scope.closed = [];
    $scope.cart = [];
    $scope.logo_path = WebApi.logo_path();
    WebApi.order_type($stateParams['type']);
    $ionicLoading.show();
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
    $scope.restaurant = [];
    $scope.cart_value = $scope.other_charges = $scope.gtotal = 0;
    $scope.editable = false;
    $scope.checkout_btn = false;
    $scope.coupon_t = false;
    $scope.coupon = {code: null, applied: false};
    $scope.away_amt = 0;
    $scope.wallet = 0;
    $scope.$on('$ionicView.enter', function(e) {
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
      // $scope.type = WebApi.order_type() || 'delivery';

      $scope.editable = false;
      $scope.update();
    });

    $scope.take_address = function (){
      if($scope.type == 'delivery'){
        $ionicPopup.show({
          template: '<input type="text" ng-model="user.address">',
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
                  $scope.take_payment($scope.user.address);
                }
              }
            }
          ]
        }).then(function() {});
      }else {
        $scope.take_payment(null);
      }
    }

    $scope.take_payment = function (address){
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
          "address": address
        },
        "theme": {
          "color": "#F37254"
        }
      };

      var successCallback = function(success) {
        $scope.payment_id = success.razorpay_payment_id;
        $scope.payment_amount = $scope.gtotal;
        $scope.place_order(address);
      };

      var cancelCallback = function(error) {
        alert(error.description + ' (Error '+error.code+')')
      };

      RazorpayCheckout.on('payment.success', successCallback);
      RazorpayCheckout.on('payment.cancel', cancelCallback);
      if($scope.gtotal > 0){
        RazorpayCheckout.open(options)
      }else{
        $scope.payment_id = 'wallet';
        $scope.payment_amount = null;
        $scope.place_order(address);
      }
    };

    $scope.place_order = function (address){
      console.log('place order');
      $ionicLoading.show();
      WebApi.place_order($scope.cart, $scope.coupon, $scope.restaurant, $scope.type, address, $scope.payment_id, $scope.payment_amount, $scope.wallet)
        .then(function (res){
          console.log(res);
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
      if($scope.type == 'delivery' && $scope.restaurant.delivery_fee!=null) $scope.other_charges += parseInt($scope.restaurant.delivery_fee);
      if($scope.type != 'dinein' && $scope.restaurant.packing_fee!=null) $scope.other_charges += parseInt($scope.restaurant.packing_fee);
      if($scope.type == 'delivery'){
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
      $ionicLoading.show();
      $scope.editable = !$scope.editable;
      if(! $scope.editable)$scope.update();
      $timeout(function (){ $ionicLoading.hide() }, 750);
    }
  })

  .controller('ConfirmOrderCtrl', function ($scope, WebApi, $timeout, $rootScope, $ionicLoading, $ionicHistory){
    $scope.user = $rootScope.user;
    $scope.order = WebApi.order();
    $scope.check = true; $scope.time = 0;
    $scope.interval = 1000;
    $scope.status = '';
    $scope.time = 0;
    $scope.clock = '00:00';
    $scope.order_s = '';
    $scope.clock_min = 00;
    $scope.clock_sec = 00;
    $scope.run_time = true;
    WebApi.get_restaurant()
      .then(function (res){
        $scope.restaurant = res;
        if($scope.order.deliver == 'delivery')
          $scope.clock_min = $scope.restaurant.delivery_time;
        else if($scope.order.deliver == 'pickup')
          $scope.clock_min = $scope.restaurant.pickup_time;
        else if($scope.order.deliver == 'dinein')
          $scope.clock_min = $scope.restaurant.dinein_time;

      });
    // $scope.order = {id: 13};
    var min_elapsed;

    console.log($scope.order, $scope.restaurant, $scope.clock_min);
    $scope.clock_run = function()
    {
      if($scope.run_time)
      {
        if($scope.clock_sec > 1) $scope.clock_sec -= 1;
        else{
          console.log('sec else');
          if($scope.clock_min > 1) {
            $scope.clock_min -= 1;
            $scope.clock_sec = 60;
          }else{
            console.log('min else');
            $scope.clock_min = '00';
            $scope.clock_sec = '00';
            $scope.run_time = false;
          }
        }
      }
      $timeout( function (){ $scope.clock_run(); }, 1000);
    }

    $scope.check_status = function (){
      console.log('checking');
      if($scope.check){
        $ionicLoading.show();
        WebApi.order_status($scope.order)
          .then(function (res){
            $ionicLoading.hide();
            if($scope.order_s != res)
            {
              $scope.order_s = res;
              if(res  == 'WFRA') {$scope.status = 'Awaiting for confirmation from Restaurant.';}
              else if(res == 'PROC') {
                $scope.status = 'Order is accepted by vendor and is being Processed.';
                var order_time = moment($scope.order.created_time);
                var min_elapsed = moment.utc(moment().diff(order_time)).format("m");
                var sec_elapsed = moment.utc(moment().diff(order_time)).format("s");
                $scope.clock_min -= min_elapsed;
                $scope.clock_sec -= sec_elapsed;
                $scope.clock_run();
              }
              else if(res == 'CMPT') {
                $scope.run_time = false;
                $scope.check = false;
                $scope.status = 'Order is Completed.';
              }
              else if(res == 'DECL') {
                $scope.run_time = false;
                $scope.check = false;
                $scope.status = 'Order is Declined.';
              }
              else if(res == 'CNCL') {
                $scope.run_time = false;
                $scope.check = false;
                $scope.status = 'Order is Canceled.';
              }
            }
          });
        $scope.time++;

        if($scope.time > 30) $scope.check = false;
        else if($scope.time > 20) $timeout(function (){ $scope.check_status() }, 90000);
        else if($scope.time > 10) $timeout(function (){ $scope.check_status() }, 60000);
        else if($scope.time > 4) $timeout(function (){ $scope.check_status() }, 30000);
        else if($scope.check && $scope.time < 5) $timeout(function (){ $scope.check_status() }, 15000);
      }
    };

    $scope.check_status();

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

  .controller('ProfileCtrl', function ($scope, $state, WebApi, $rootScope){
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
            alert("Error: Check entered details.");
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
                    alert('PIN Changed Successfully.');
                    $scope.user.old_pin = '';
                    $scope.user.new_pin = '';
                    $scope.user.new_pin_verify = '';
                  }else if(res.data.status == 'error'){
                    if(res.data.error == 'old_pin_invalid'){
                      alert('Please enter correct old PIN.');
                    }
                  }
                })
            } else alert("PIN does not match.");
          } else alert('New PIN length should be 4 digit only.');
        }else alert('Please enter correct old PIN.');
      }else alert('New PIN length should be 4 digit only.');
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

  .controller('OrdersCtrl',   function ($scope, WebApi, $ionicLoading){
    $scope.orders = [];

    $scope.$on('$ionicView.enter', function(e) {
      $ionicLoading.show();
      WebApi.all_orders().then(function (res){
        $ionicLoading.hide();
        console.log(JSON.stringify(res));
        $scope.orders = res.data;
      });
    });
  })

  .controller('TabsCtrl',   function (){});
